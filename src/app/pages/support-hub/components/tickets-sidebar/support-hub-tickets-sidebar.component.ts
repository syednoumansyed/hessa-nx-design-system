import {
  Component,
  computed,
  effect,
  inject,
  output,
  signal,
  input,
  DestroyRef,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupportHubHeaderComponent } from '../header/support-hub-header.component';
import { SupportHubListComponent } from '../list/support-hub-list.component';
import {
  SupportTicketCardConfig,
  SupportTicketMenuSelection,
  SupportTicketFooterProfile,
} from '../ticket-card/support-ticket-card.component';
import { SupportHubFiltersChange } from '../filters/support-hub-filters.component';
import { SupportJourneyStudent } from '../../data-access/journey/support-journey-student.model';
import { SupportHubTicketsService } from '../../data-access/support-hub-tickets.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AuthService } from '@auth/auth.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { SupportHubTicket } from '../../data-access/support-hub-initiated-tickets.interface';
import { SupportTicketStatus, UserProfileColors } from '@shared/enums';
import {
  findAllSchools,
  findAllCompanies,
  findAllCampuses,
} from '@shared/utils/school-structure';
import { getIconDefinitionByName } from '@ds/icon-chooser/icon-chooser.util';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { LayoutService } from '@layout/layout.service';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { SupportTicketActionsService } from '../../services/support-ticket-actions.service';
import {
  NoDataBtnInterface,
  NoDataCardComponent,
  NoDataFilterChip,
} from '@shared/components/no-data-card/no-data-card.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonnelService } from '@pages/user-management/personnels/personnel.service';
import { take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HesToasterService } from '@shared/services/hes-toaster.service';

@Component({
  selector: 'app-support-hub-tickets-sidebar',
  templateUrl: './support-hub-tickets-sidebar.component.html',
  standalone: true,
  imports: [
    CommonModule,
    SupportHubHeaderComponent,
    SupportHubListComponent,
    IonContent,
    IonSpinner,
    InfiniteScrollDirective,
    NoDataCardComponent,
  ],
})
export class SupportHubTicketsSidebarComponent {
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly auth = inject(AuthService);
  private readonly translateService = inject(HesTranslateService);
  private readonly personnelService = inject(PersonnelService);
  private readonly studentSelectionScope = inject(StudentSelectionScopeService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly layoutService = inject(LayoutService);
  private readonly ticketActionsService = inject(SupportTicketActionsService);
  private readonly translate = inject(HesTranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasterService = inject(HesToasterService);

  // Inputs
  readonly selectedTicketId = input<string | null>(null);
  readonly journeyActive = input(false);
  readonly showSidebar = input<boolean>(true);
  readonly refreshToken = input<number>(0);
  readonly deepLinkTicketId = input<string | null>(null);

  // Outputs
  readonly ticketSelected = output<SupportTicketCardConfig>();
  readonly ticketMenuItemSelected = output<SupportTicketMenuSelection>();
  readonly journeyStartRequested = output<SupportJourneyStudent[]>();
  readonly emptyShellVisibilityChange = output<boolean>();
  readonly deepLinkHandled = output<void>();

  readonly canManageTickets = this.rbacService.hasSomePermission([
    RESOURCE_PERMISSION.supportTicket.updateTicket,
    RESOURCE_PERMISSION.supportTicket.reassign,
    RESOURCE_PERMISSION.supportTicket.resolveTicket,
  ]);

  private readonly assigneeAvatarColors: UserProfileColors[] = [
    UserProfileColors.CORAL,
    UserProfileColors.GREEN,
    UserProfileColors.INDIGO,
    UserProfileColors.TEAL,
    UserProfileColors.BRAND,
  ];

  // Internal state
  protected readonly ticketsHeading = computed(() => {
    if (this.canManageTickets || !this.isCompact()) {
      return '';
    }
    return (
      this.translateService.t('support.user_requests.title') || 'Your requests'
    );
  });
  protected readonly showClosedSplitter = computed(
    () =>
      this.isCompact() &&
      !this.canManageTickets &&
      this.currentFilters().showInitiated,
  );
  protected readonly currentFilters = signal<SupportHubFiltersChange>({
    status: null,
    showInitiated: !this.canManageTickets,
  });
  protected readonly hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return Boolean(
      (filters.searchText && filters.searchText.trim().length > 0) ||
      filters.status ||
      (filters.assignedTo && filters.assignedTo.length > 0) ||
      (filters.companyIds && filters.companyIds.length > 0) ||
      (filters.schoolIds && filters.schoolIds.length > 0) ||
      (filters.campusIds && filters.campusIds.length > 0),
    );
  });
  protected readonly isMobile = this.layoutService.isMobile;
  protected readonly isTabletOrDesktop = this.layoutService.isTabletOrDesktop;
  protected readonly isCompact = computed(
    () => this.layoutService.windowClass() === 'compact',
  );
  protected readonly isSplitView = computed(() => !this.isCompact());
  protected readonly isLoading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly hasAttemptedInitialLoad = signal(false);
  protected readonly ticketsScrollerRef =
    viewChild<ElementRef<HTMLDivElement>>('ticketsScroller');
  private readonly forceSelectFirstAfterFilterChange = signal(false);
  private readonly initiatedPresence = signal<boolean | null>(null);
  private readonly assignedPresence = signal<boolean | null>(null);
  private readonly initialViewApplied = signal(false);
  protected readonly hasInitiatedTickets = computed(() => {
    const resolved = this.initiatedPresence();
    return resolved !== null
      ? resolved
      : this.supportHubTicketsService.initiatedTickets().length > 0;
  });
  protected readonly hasAssignedTickets = computed(() => {
    const resolved = this.assignedPresence();
    return resolved !== null
      ? resolved
      : this.supportHubTicketsService.assignedTickets().length > 0;
  });
  private readonly canCreateTicket = this.rbacService.hasPermission(
    RESOURCE_PERMISSION.supportTicket.createTicket,
  );
  protected readonly initiatorEmptyStateTitle = 'No support tickets yet';
  protected readonly initiatorEmptyStateDescription =
    'You can create a new request and track its updates here.';
  protected readonly initiatorEmptyStateImagePath =
    'assets/illustrations/no-search-result.svg';
  protected readonly initiatorEmptyStatePrimaryButton:
    | NoDataBtnInterface
    | undefined = this.canCreateTicket
    ? {
        label: this.translateService.t('support.hub.empty.primary_cta'),
        onAction: () => this.onHeaderJourneyStartRequested([]),
      }
    : undefined;
  protected readonly clearFiltersButton = computed<
    NoDataBtnInterface | undefined
  >(() => {
    if (!this.hasActiveFilters()) {
      return undefined;
    }

    return {
      label: 'global.clear_filters.btn',
      onAction: () => this.onClearFiltersRequested(),
    };
  });
  protected readonly managerEmptyStateTitle = this.translateService.t(
    'support.hub.filter.no_results.title',
  );
  protected readonly managerEmptyStateDescription = computed(() =>
    this.hasActiveFilters()
      ? this.translate.t('support.hub.filter.no_results.description')
      : '',
  );
  protected readonly managerEmptyStateImagePath =
    'assets/illustrations/no-search-result.svg';
  private readonly assignedToFilterId = signal<number | null>(null);
  private readonly assignedToFilterLabel = signal<string | null>(null);
  protected readonly filteredByChips = computed<NoDataFilterChip[]>(() => {
    if (!this.hasActiveFilters()) {
      return [];
    }

    const filters = this.currentFilters();
    const chips: NoDataFilterChip[] = [];

    if (filters.searchText?.trim()) {
      chips.push({
        label: `${filters.searchText.trim()}`,
        onRemove: () => this.updateFilters({ searchText: undefined }),
      });
    }

    if (filters.status) {
      chips.push({
        label: this.getTicketStatusLabel(filters.status as SupportTicketStatus),
        onRemove: () => this.updateFilters({ status: null }),
      });
    }

    const scopedStructure =
      this.schoolStructureScope.userScopedSchoolStructure();
    const companies = findAllCompanies(scopedStructure);
    const schools = findAllSchools(scopedStructure);
    const campuses = findAllCampuses(scopedStructure);

    (filters.companyIds ?? []).forEach((id) => {
      const match = companies.find((item) => item.id === id);
      chips.push({
        label: match?.name ?? `Company ${id}`,
        onRemove: () =>
          this.updateFilters({
            companyIds: this.removeId(filters.companyIds, id),
          }),
      });
    });

    (filters.schoolIds ?? []).forEach((id) => {
      const match = schools.find((item) => item.id === id);
      chips.push({
        label: match?.name ?? `School ${id}`,
        onRemove: () =>
          this.updateFilters({
            schoolIds: this.removeId(filters.schoolIds, id),
          }),
      });
    });

    (filters.campusIds ?? []).forEach((id) => {
      const match = campuses.find((item) => item.id === id);
      chips.push({
        label: match?.name ?? `Campus ${id}`,
        onRemove: () =>
          this.updateFilters({
            campusIds: this.removeId(filters.campusIds, id),
          }),
      });
    });
    if (filters.assignedTo && filters.assignedTo.length > 0) {
      const label = filters.assignedToLabel ?? this.assignedToFilterLabel();
      chips.push({
        label:
          label ?? this.translateService.t('support_ticket.assigned_to.label'),
        onRemove: () =>
          this.updateFilters({ assignedTo: null, assignedToLabel: null }),
      });
    }

    return chips;
  });

  protected readonly pagination = computed(() => {
    const shouldShowInitiated =
      !this.canManageTickets || this.currentFilters().showInitiated;
    return shouldShowInitiated
      ? this.supportHubTicketsService.initiatedTicketsPagination()
      : this.supportHubTicketsService.assignedTicketsPagination();
  });

  protected readonly hasMore = computed(() => {
    const pag = this.pagination();
    if (!pag) return false;
    return pag.pageNumber < pag.totalPages;
  });

  protected readonly tickets = signal<SupportTicketCardConfig[]>([]);

  findTicketById(ticketId: string): SupportTicketCardConfig | null {
    if (!ticketId) {
      return null;
    }
    return (
      this.tickets().find((ticket) => ticket.ticketNumber === ticketId) ?? null
    );
  }

  // No local filtering - all filtering happens on the server
  protected readonly filteredTickets = this.tickets;
  protected readonly showEmptyState = computed(() => {
    if (this.isLoading()) {
      return false;
    }

    const noTickets = this.filteredTickets().length === 0;
    if (!noTickets) {
      return false;
    }

    if (this.canManageTickets) {
      return true;
    }

    return true;
  });
  protected readonly shouldShowGlobalEmptyShell = computed(() => {
    if (this.canManageTickets) {
      return false;
    }

    if (this.journeyActive()) {
      return false;
    }

    if (this.isLoading()) {
      return false;
    }

    if (this.hasActiveFilters()) {
      return false;
    }

    if (!this.hasAttemptedInitialLoad()) {
      return false;
    }

    return this.filteredTickets().length === 0;
  });
  protected readonly hideHeaderForEmptyDesktop = computed(
    () =>
      this.isSplitView() &&
      this.showEmptyState() &&
      !this.canManageTickets &&
      !this.hasActiveFilters(),
  );
  private readonly selectedTicketSnapshot = signal<string | null>(null);

  constructor() {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const presence = data['ticketPresence'] as
          | { hasInitiated: boolean; hasAssigned: boolean }
          | undefined;
        if (!presence) {
          return;
        }
        this.initiatedPresence.set(presence.hasInitiated);
        this.assignedPresence.set(presence.hasAssigned);
      });

    effect(() => {
      if (this.initialViewApplied()) {
        return;
      }
      if (!this.canManageTickets) {
        this.initialViewApplied.set(true);
        return;
      }

      const hasInitiated = this.hasInitiatedTickets();
      const hasAssigned = this.hasAssignedTickets();

      if (hasInitiated && !hasAssigned) {
        this.currentFilters.update((current) => ({
          ...current,
          showInitiated: true,
        }));
      }
      this.initialViewApplied.set(true);
    });

    // Effect to map tickets from service to card configs
    effect(
      () => {
        const filters = this.currentFilters();
        const shouldShowInitiated =
          !this.canManageTickets || filters.showInitiated;
        const sourceTickets = shouldShowInitiated
          ? this.supportHubTicketsService.initiatedTickets()
          : this.supportHubTicketsService.assignedTickets();

        const mappedTickets = sourceTickets.map((ticket) =>
          this.mapTicketToCardConfig(ticket),
        );

        this.tickets.set(mappedTickets);
      },
      { allowSignalWrites: true },
    );

    // Effect to load tickets when school or filters change
    effect((onCleanup) => {
      this.refreshToken();
      const filters = this.currentFilters();
      const shouldShowInitiated =
        !this.canManageTickets || filters.showInitiated;
      this.currentPage.set(1);
      this.isLoading.set(true);
      this.isLoadingMore.set(false);
      this.resetTicketsScroll();

      const searchText = filters.searchText?.trim();

      const initiatedSchoolIds = filters.schoolIds?.length
        ? filters.schoolIds
        : undefined;

      const load$ = shouldShowInitiated
        ? this.supportHubTicketsService.loadInitiatedTickets({
            schoolIds: initiatedSchoolIds,
            pageNumber: 1,
            itemsPerPage: 10,
            ...(searchText ? { searchText } : {}),
            status: filters.status ?? undefined,
            assignedTo: filters.assignedTo ?? undefined,
            companyIds: filters.companyIds,
            campusIds: filters.campusIds,
          })
        : this.supportHubTicketsService.loadAssignedTickets({
            pageNumber: 1,
            itemsPerPage: 10,
            ...(searchText ? { searchText } : {}),
            status: filters.status ?? undefined,
            assignedTo: filters.assignedTo ?? undefined,
            companyIds: filters.companyIds,
            schoolIds: filters.schoolIds,
            campusIds: filters.campusIds,
          });

      const subscription = load$.subscribe({
        next: () => {
          this.isLoading.set(false);
          this.hasAttemptedInitialLoad.set(true);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.hasAttemptedInitialLoad.set(true);
          if (shouldShowInitiated) {
            this.supportHubTicketsService.resetInitiatedTickets(error);
          } else {
            this.supportHubTicketsService.resetAssignedTickets(error);
          }
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });

    // Effect to auto-select first ticket on wide layouts when tickets load
    effect(() => {
      if (!this.isSplitView()) {
        return;
      }

      if (this.isLoading()) {
        return;
      }

      if (this.journeyActive()) {
        return;
      }

      const currentlySelected = this.selectedTicketId();
      const filtered = this.filteredTickets();

      // Auto-select first ticket when filters change or no ticket selected.
      if (
        filtered.length > 0 &&
        (this.forceSelectFirstAfterFilterChange() || !currentlySelected)
      ) {
        this.forceSelectFirstAfterFilterChange.set(false);
        this.ticketSelected.emit(filtered[0]);
      }
    });

    effect(() => {
      this.refreshToken();
      this.forceSelectFirstAfterFilterChange.set(true);
    });

    effect(
      () => {
        const selectedId = this.selectedTicketId();
        // When a specific ticket ID is provided (e.g., from deep link), clear the
        // forceSelectFirstAfterFilterChange flag and proceed. On mobile, this flag
        // is never cleared by the auto-select effect since it returns early.
        if (this.forceSelectFirstAfterFilterChange() && selectedId) {
          this.forceSelectFirstAfterFilterChange.set(false);
        }
        if (this.forceSelectFirstAfterFilterChange()) {
          return;
        }
        if (!selectedId) {
          this.selectedTicketSnapshot.set(null);
          return;
        }

        const filtered = this.filteredTickets();
        const selectedTicket = filtered.find(
          (ticket) => ticket.ticketNumber === selectedId,
        );

        if (!selectedTicket) {
          this.selectedTicketSnapshot.set(null);
          return;
        }

        const snapshot = this.buildTicketSnapshot(selectedTicket);
        if (this.selectedTicketSnapshot() === snapshot) {
          return;
        }

        this.selectedTicketSnapshot.set(snapshot);
        this.ticketSelected.emit(selectedTicket);
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      this.emptyShellVisibilityChange.emit(this.shouldShowGlobalEmptyShell());
    });

    effect((onCleanup) => {
      const filters = this.currentFilters();
      const assignedId = filters.assignedTo?.[0] ?? null;

      if (!assignedId) {
        this.assignedToFilterId.set(null);
        this.assignedToFilterLabel.set(null);
        return;
      }

      if (filters.assignedToLabel) {
        this.assignedToFilterId.set(assignedId);
        this.assignedToFilterLabel.set(filters.assignedToLabel);
        return;
      }

      if (this.assignedToFilterId() === assignedId) {
        return;
      }

      this.assignedToFilterId.set(assignedId);

      const subscription = this.personnelService
        .getPersonnel(assignedId)
        .subscribe({
          next: (personnel) => {
            this.assignedToFilterLabel.set(personnel.displayName || null);
          },
          error: () => {
            this.assignedToFilterLabel.set(null);
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });

    // Effect to handle deep link ticket ID
    // First checks if ticket exists in loaded list, otherwise fetches by ID
    effect(
      (onCleanup) => {
        const deepLinkId = this.deepLinkTicketId();
        if (!deepLinkId) {
          return;
        }

        // Wait for initial loading to complete
        if (this.isLoading()) {
          return;
        }

        // Check if ticket already exists in the loaded list
        const tickets = this.filteredTickets();
        const existingTicket = tickets.find(
          (ticket) => ticket.ticketNumber === deepLinkId,
        );

        if (existingTicket) {
          // Ticket found in list - select it directly
          this.ticketSelected.emit(existingTicket);
          this.deepLinkHandled.emit();
          return;
        }

        // Ticket not in list - fetch it by ID and prepend to list
        const subscription = this.supportHubTicketsService
          .fetchAndPrependTicket(Number(deepLinkId))
          .subscribe({
            next: (ticket) => {
              // Ticket fetched and added to list - select it
              const cardConfig = this.mapTicketToCardConfig(ticket);
              this.ticketSelected.emit(cardConfig);
              this.deepLinkHandled.emit();
            },
            error: () => {
              // Failed to fetch ticket - show error toast and clear the deep link
              this.toasterService.error(
                this.translateService.t(
                  'support_tickets.ticket_not_found.title',
                ),
                this.translateService.t('enum.SUPPORT'),
              );
              this.deepLinkHandled.emit();
            },
          });

        onCleanup(() => subscription.unsubscribe());
      },
      { allowSignalWrites: true },
    );
  }

  protected onHeaderActionSelected(
    action: 'new-help-request' | 'learn-more',
  ): void {
    if (action === 'new-help-request') {
      // Journey will be started from header via journeyStartRequested
    } else if (action === 'learn-more') {
      this.router.navigate(['/help-center']);
    }
  }

  protected onHeaderSearchChanged(term: string): void {
    this.currentFilters.update((current) => ({
      ...current,
      searchText: term.trim().length ? term : undefined,
    }));
    this.resetTicketsScroll();
  }

  protected onHeaderFiltersChanged(filters: SupportHubFiltersChange): void {
    const previousShowInitiated = this.currentFilters().showInitiated;
    const currentSearch = this.currentFilters().searchText;

    // Preserve search term when updating filters
    this.currentFilters.set({ ...filters, searchText: currentSearch });
    this.forceSelectFirstAfterFilterChange.set(true);
    this.resetTicketsScroll();

    if (
      this.canManageTickets &&
      previousShowInitiated !== filters.showInitiated
    ) {
      this.tickets.set([]);
      this.currentPage.set(1);
      if (filters.showInitiated) {
        this.supportHubTicketsService.resetAssignedTickets();
      } else {
        this.supportHubTicketsService.resetInitiatedTickets();
      }
    }
  }

  protected onScroll(): void {
    if (this.isLoading() || this.isLoadingMore() || !this.hasMore()) {
      return;
    }

    const filters = this.currentFilters();
    const shouldShowInitiated = !this.canManageTickets || filters.showInitiated;
    const nextPage = this.currentPage() + 1;
    const searchText = filters.searchText?.trim();

    this.isLoadingMore.set(true);

    const initiatedSchoolIds = filters.schoolIds?.length
      ? filters.schoolIds
      : undefined;

    const load$ = shouldShowInitiated
      ? this.supportHubTicketsService.loadInitiatedTickets(
          {
            schoolIds: initiatedSchoolIds,
            pageNumber: nextPage,
            itemsPerPage: 10,
            ...(searchText ? { searchText } : {}),
            status: filters.status ?? undefined,
            assignedTo: filters.assignedTo ?? undefined,
            companyIds: filters.companyIds,
            campusIds: filters.campusIds,
          },
          true,
        )
      : this.supportHubTicketsService.loadAssignedTickets(
          {
            pageNumber: nextPage,
            itemsPerPage: 10,
            ...(searchText ? { searchText } : {}),
            status: filters.status ?? undefined,
            assignedTo: filters.assignedTo ?? undefined,
            companyIds: filters.companyIds,
            schoolIds: filters.schoolIds,
            campusIds: filters.campusIds,
          },
          true,
        );

    load$.subscribe({
      next: () => {
        this.currentPage.set(nextPage);
        this.isLoadingMore.set(false);
      },
      error: (error) => {
        this.isLoadingMore.set(false);
        if (shouldShowInitiated) {
          this.supportHubTicketsService.resetInitiatedTickets(error);
        } else {
          this.supportHubTicketsService.resetAssignedTickets(error);
        }
      },
    });
  }

  protected onHeaderJourneyStartRequested(
    students: SupportJourneyStudent[],
  ): void {
    this.journeyStartRequested.emit(students);
  }

  protected onClearFiltersRequested(): void {
    const current = this.currentFilters();
    this.currentFilters.set({
      status: null,
      showInitiated: current.showInitiated,
      searchText: undefined,
      companyIds: undefined,
      schoolIds: undefined,
      campusIds: undefined,
      assignedTo: null,
      assignedToLabel: null,
    });
    this.resetTicketsScroll();
  }

  focusCreatedTicket(ticketId: string | number | null): void {
    const desiredId = ticketId != null ? ticketId.toString() : null;
    const filters = this.currentFilters();
    const shouldShowInitiated = !this.canManageTickets || filters.showInitiated;

    this.currentPage.set(1);
    this.isLoadingMore.set(false);
    this.resetTicketsScroll();

    const schoolIds = filters.schoolIds?.length ? filters.schoolIds : undefined;

    const load$ = shouldShowInitiated
      ? this.supportHubTicketsService.loadInitiatedTickets({
          pageNumber: 1,
          itemsPerPage: 10,
          ...(schoolIds ? { schoolIds } : {}),
        })
      : this.supportHubTicketsService.loadAssignedTickets({
          pageNumber: 1,
          itemsPerPage: 10,
          ...(schoolIds ? { schoolIds } : {}),
        });

    load$.pipe(take(1)).subscribe({
      next: (tickets) => {
        if (!tickets.length) {
          return;
        }

        const resolvedId = desiredId
          ? tickets.some((ticket) => ticket.id.toString() === desiredId)
            ? desiredId
            : tickets[0].id.toString()
          : tickets[0].id.toString();

        const matched =
          tickets.find((ticket) => ticket.id.toString() === resolvedId) ??
          tickets[0];

        this.ticketSelected.emit(this.mapTicketToCardConfig(matched));
      },
    });
  }

  private updateFilters(patch: Partial<SupportHubFiltersChange>): void {
    this.currentFilters.update((current) => ({
      ...current,
      ...patch,
    }));
    this.resetTicketsScroll();
  }

  private resetTicketsScroll(): void {
    const scroller = this.ticketsScrollerRef()?.nativeElement;
    if (!scroller) {
      return;
    }
    scroller.scrollTop = 0;
  }

  private removeId(
    list: number[] | undefined,
    id: number,
  ): number[] | undefined {
    if (!list?.length) {
      return undefined;
    }
    const next = list.filter((value) => value !== id);
    return next.length ? next : undefined;
  }

  protected onTicketSelected(ticket: SupportTicketCardConfig): void {
    this.ticketSelected.emit(ticket);
  }

  protected onTicketMenuItemSelected(
    selection: SupportTicketMenuSelection,
  ): void {
    this.ticketMenuItemSelected.emit(selection);
  }

  private buildTicketSnapshot(ticket: SupportTicketCardConfig): string {
    const menuSignature = (ticket.menu ?? [])
      .map((item) => {
        const id = String(item?.id ?? 'unknown');
        const visibility = item?.visible === false ? '0' : '1';
        return `${id}:${visibility}`;
      })
      .join('|');

    return [
      ticket.ticketNumber,
      ticket.status.label,
      ticket.status.tone ?? '',
      ticket.category?.label ?? '',
      ticket.category?.tone ?? '',
      menuSignature,
    ].join('::');
  }

  private mapTicketToCardConfig(
    ticket: SupportHubTicket,
  ): SupportTicketCardConfig {
    // Use different mapper based on whether the ticket was initiated by guardian/student or personnel
    if (ticket.isInitiatorTicket) {
      return this.mapInitiatorTicketToCardConfig(ticket);
    } else {
      return this.mapPersonnelTicketToCardConfig(ticket);
    }
  }

  /**
   * Maps ticket initiated by guardian/student to card config
   * - Shows students from the ticket ONLY if guardian has more than 1 student in scope
   * - Does NOT show initiatorDisplayName to guardian/student
   * - Does NOT show school information
   * - Shows assignee ONLY if current user is personnel (not for guardian/student)
   * - Shows footer profiles only if guardian has multiple students in scope
   */
  private mapInitiatorTicketToCardConfig(
    ticket: SupportHubTicket,
  ): SupportTicketCardConfig {
    const createdOn = ticket.createdAt;
    const currentUserIds = this.getCurrentUserIds();

    // For guardians with multiple students, show student profiles in footer
    // buildFooterProfiles checks guardian status and student count internally
    const footerProfiles = this.buildFooterProfiles(ticket);

    // Only show students if guardian has more than one student in scope
    const hasMultipleStudents =
      this.studentSelectionScope.studentSelectionScope().length > 1;
    const students = hasMultipleStudents
      ? (ticket.students?.map((student) => ({
          id: student.id,
          displayName: student.displayName,
        })) ?? [])
      : [];

    // Only show assignee if current user is personnel
    const assignee = this.auth.isUserPersonnel()
      ? this.buildAssignee(ticket)
      : undefined;

    const shouldShowSchool =
      this.auth.isUserPersonnel() && this.hasMultipleSchools();
    const school = shouldShowSchool
      ? this.getSchoolInfo(ticket.schoolId)
      : undefined;

    const privateRequestLabel =
      this.translateService.t('support.request.anonymous.title') ??
      'Private request';
    const initiatorDisplayName = this.auth.isUserPersonnel()
      ? ticket.hideInitiatorName
        ? undefined
        : !!ticket.createdBy?.id && currentUserIds.has(ticket.createdBy.id)
          ? this.translateService.globalTObj.you
          : ticket.createdBy?.displayName
      : undefined;

    return {
      ticketNumber: ticket.id.toString(),
      createdOn,
      subCategory: ticket.supportCategory.displayName,
      status: {
        label: this.getTicketStatusLabel(ticket.status),
        tone: this.getTicketStatusTone(ticket.status),
      },
      isResolved: ticket.isResolved,
      isPrivateRequest: ticket.hideInitiatorName,
      category: {
        label: ticket.supportType.displayName,
        icon: getIconDefinitionByName(ticket.supportType.icon),
      },
      description: ticket.description,
      isInitiatorTicket: true,
      initiatorDisplayName,
      ...(school ? { school } : {}),
      ...(students.length
        ? {
            students,
          }
        : {}),
      ...(assignee ? { assignee } : {}),
      menu: this.ticketActionsService.buildMenuItems(ticket, {
        includeViewItem: !this.isSplitView(),
      }),
      ...(footerProfiles ? { footerProfiles } : {}),
    };
  }

  /**
   * Maps ticket initiated by personnel to card config
   * - Shows initiatorDisplayName (personnel who created it)
   * - Shows "You" if current user is the initiator
   * - Shows assignee if ticket is escalated (shows "You" if current user is assignee)
   * - Shows students associated with the ticket
   * - Shows school info if assignee has multiple schools (company as title, school as subtitle)
   */
  private mapPersonnelTicketToCardConfig(
    ticket: SupportHubTicket,
  ): SupportTicketCardConfig {
    const createdOn = ticket.createdAt;

    const currentUserIds = this.getCurrentUserIds();

    // Check if current user is one of the assignees
    const personnels = ticket.ticketEscalation?.ticketEscalationPersonnels;

    const privateRequestLabel =
      this.translateService.t('support.request.anonymous.title') ??
      'Private request';
    const requester = ticket.createdBy
      ? {
          id: ticket.createdBy.id,
          name: ticket.hideInitiatorName
            ? privateRequestLabel
            : ticket.createdBy.displayName,
        }
      : undefined;

    const assignee = this.buildAssignee(ticket);
    const assigneesDetail = this.buildDetailedAssignees(ticket);
    const escalation = this.buildEscalationInfo(ticket);
    const students = ticket.students ?? [];

    const initiatorDisplayName = ticket.hideInitiatorName
      ? undefined
      : !!ticket.createdBy?.id && currentUserIds.has(ticket.createdBy.id)
        ? this.translateService.globalTObj.you
        : ticket.createdBy.displayName;

    // Show school info if current user is assignee and has multiple schools
    const shouldShowSchool = this.hasMultipleSchools();
    const school = shouldShowSchool
      ? this.getSchoolInfo(ticket.schoolId)
      : undefined;

    return {
      ticketNumber: ticket.id.toString(),
      createdOn,
      subCategory: ticket.supportCategory.displayName,
      status: {
        label: this.getTicketStatusLabel(ticket.status),
        tone: this.getTicketStatusTone(ticket.status),
      },
      isResolved: ticket.isResolved,
      isPrivateRequest: ticket.hideInitiatorName,
      category: {
        label: ticket.supportType.displayName,
        icon: getIconDefinitionByName(ticket.supportType.icon),
      },
      description: ticket.description,
      ...(school ? { school } : {}),
      initiatorDisplayName,
      isInitiatorTicket: false,
      ...(students.length
        ? {
            students: students.map((student) => ({
              id: student.id,
              displayName: student.displayName,
            })),
          }
        : {}),
      ...(requester ? { requester } : {}),
      ...(assignee ? { assignee } : {}),
      ...(assigneesDetail ? { assigneesDetail } : {}),
      ...(escalation ? { escalation } : {}),
      menu: this.ticketActionsService.buildMenuItems(ticket, {
        includeViewItem: !this.isSplitView(),
      }),
    };
  }

  private buildAssignee(
    ticket: SupportHubTicket,
  ): SupportTicketCardConfig['assignee'] | undefined {
    const personnels = ticket.ticketEscalation?.ticketEscalationPersonnels;
    if (!personnels || personnels.length === 0) {
      return undefined;
    }

    const currentUserIds = this.getCurrentUserIds();

    const names = personnels
      .map((personnel) => {
        if (
          personnel.personnel?.id &&
          currentUserIds.has(personnel.personnel.id)
        ) {
          return this.translateService.globalTObj.you;
        }
        return personnel.personnel.displayName;
      })
      .filter((name): name is string => !!name);

    if (names.length === 0) {
      return undefined;
    }

    return {
      name: names.join(', '),
      names,
      label: this.translateService.t('support_ticket.assigned_to.title'),
    };
  }

  private buildDetailedAssignees(
    ticket: SupportHubTicket,
  ): SupportTicketCardConfig['assigneesDetail'] | undefined {
    const personnels = ticket.ticketEscalation?.ticketEscalationPersonnels;
    if (!personnels || personnels.length === 0) {
      return undefined;
    }

    const currentUserIds = this.getCurrentUserIds();

    return personnels.map((personnel, index) => ({
      id: personnel.personnelId ?? personnel.id,
      name:
        personnel.personnel?.id && currentUserIds.has(personnel.personnel.id)
          ? this.translateService.globalTObj.you
          : personnel.personnel.displayName,
      role: personnel.status ?? null,
      avatarColor:
        this.assigneeAvatarColors[index % this.assigneeAvatarColors.length] ??
        UserProfileColors.NEUTRAL,
    }));
  }

  private buildEscalationInfo(
    ticket: SupportHubTicket,
  ): SupportTicketCardConfig['escalation'] | undefined {
    if (!ticket.ticketEscalation) {
      return undefined;
    }

    const label = this.translateService.t(
      'support_ticket.default_escalation_level.title',
    );
    return { label };
  }

  private hasMultipleSchools(): boolean {
    const scopedSchools = this.schoolStructureScope.userScopedSchoolStructure();
    const schools = findAllSchools(scopedSchools);
    return schools.length > 1;
  }

  private getCurrentUserIds(): Set<number> {
    const currentUser = this.auth.user();
    const ids = new Set<number>();
    if (currentUser?.id != null) {
      ids.add(currentUser.id);
    }
    if (currentUser?.userTypeId != null) {
      ids.add(currentUser.userTypeId);
    }
    return ids;
  }

  /**
   * Retrieves school information for a ticket based on schoolId
   * Returns an object with title (company name) and optional subtitle (school name)
   * Returns null if schoolId is not provided or school is not found in scope
   */
  private getSchoolInfo(
    schoolId: number | null | undefined,
  ): { title: string; subtitle?: string } | null {
    if (!schoolId) {
      return null;
    }

    const userScope = this.schoolStructureScope.userScopedSchoolStructure();
    const allSchools = findAllSchools(userScope);
    const ticketSchool = allSchools.find((s) => s.id === schoolId);

    if (!ticketSchool) {
      return null;
    }

    const schoolName = ticketSchool.name;

    const allCompanies = findAllCompanies(userScope);
    const allCampuses = findAllCampuses(userScope);
    const campus = ticketSchool.parentId
      ? allCampuses.find((item) => item.id === ticketSchool.parentId)
      : null;

    const resolveCompanyChain = (parentId: number | null | undefined) => {
      const parent = parentId
        ? allCompanies.find((item) => item.id === parentId)
        : null;
      if (!parent) {
        return { company: null, subCompany: null };
      }
      if (parent.type === 'sub-company') {
        const company = parent.parentId
          ? allCompanies.find((item) => item.id === parent.parentId)
          : null;
        return { company, subCompany: parent };
      }
      return { company: parent, subCompany: null };
    };

    const campusName = campus?.name?.trim() ?? '';
    const title = campusName || schoolName;

    return {
      title,
      ...(schoolName && title !== schoolName ? { subtitle: schoolName } : {}),
    };
  }

  private buildFooterProfiles(
    ticket: SupportHubTicket,
  ): SupportTicketFooterProfile[] | null {
    const userIsNotGuardian = !this.auth.isUserGuardian();
    const lessThanTwoStudents =
      this.studentSelectionScope.studentSelectionScope().length < 2;
    const students = ticket.students;

    // Return null if user is not a guardian, has fewer than 2 students, or no escalation personnels
    if (
      userIsNotGuardian ||
      lessThanTwoStudents ||
      !students ||
      students.length === 0
    ) {
      return null;
    }

    const scopedStudents = this.studentSelectionScope.studentSelectionScope();

    return students.slice(0, 3).map((student) => {
      const scoped = scopedStudents.find((item) => item.id === student.id);

      return {
        displayName: student.displayName,
        imageUrl: scoped?.image ?? null,
        color: UserProfileColors.NEUTRAL,
      };
    });
  }

  private getTicketStatusLabel(status: SupportTicketStatus): string {
    switch (status) {
      case SupportTicketStatus.REVIEW:
        return this.translate.t('global.open.txt');
      case SupportTicketStatus.DE_ESCALATE:
        return 'De-escalated';
      case SupportTicketStatus.RESOLVED:
        return this.translate.t('support.status.resolved');
      case SupportTicketStatus.RE_OPEN:
        return this.translate.t('support.ticket.status.reopened');
      default:
        return status;
    }
  }

  private getTicketStatusTone(
    status: SupportTicketStatus,
  ): SupportTicketCardConfig['status']['tone'] | undefined {
    switch (status) {
      case SupportTicketStatus.REVIEW:
        return 'open';
      case SupportTicketStatus.RE_OPEN:
        return 'reopened';
      case SupportTicketStatus.RESOLVED:
        return 'resolved';
      case SupportTicketStatus.DE_ESCALATE:
        return 'escalated';
      default:
        return undefined;
    }
  }
}
