import {
  Component,
  ViewChild,
  Injector,
  computed,
  effect,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  SupportTicketCardConfig,
  SupportTicketMenuSelection,
} from './components/ticket-card/support-ticket-card.component';
import { UserType } from '@shared/enums';
import { LayoutService } from '@layout/layout.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportTicketJourneyComponent } from '@pages/support-hub/components/journey/support-ticket-journey.component';
import { SupportJourneyStudent } from './data-access/journey/support-journey-student.model';
import { SupportHubTicketsService } from './data-access/support-hub-tickets.service';
import {
  SupportTicketInitatorViewComponent,
  type SupportTicketInitatorViewProfile,
} from '@pages/support-hub/components/detail/support-ticket-initator-view.component';
import { SupportTicketAssigneeDetailViewComponent } from '@pages/support-hub/components/detail/support-ticket-assignee-detail-view.component';
import { SupportHubTicketsSidebarComponent } from './components/tickets-sidebar/support-hub-tickets-sidebar.component';
import { SupportTicketActionsService } from './services/support-ticket-actions.service';
import { SupportJourneySelectionService } from './data-access/journey/support-journey-selection.service';
import {
  NoDataBtnInterface,
  NoDataCardComponent,
} from '@shared/components/no-data-card/no-data-card.component';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'app-support-hub',
  templateUrl: './support-hub.page.html',
  standalone: true,
  imports: [
    CommonModule,
    SupportTicketJourneyComponent,
    SupportTicketInitatorViewComponent,
    SupportTicketAssigneeDetailViewComponent,
    SupportHubTicketsSidebarComponent,
    NoDataCardComponent,
  ],
})
export class SupportHubPage {
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly translate = inject(HesTranslateService);
  private readonly ticketActionsService = inject(SupportTicketActionsService);
  private readonly journeySelection = inject(SupportJourneySelectionService);

  @ViewChild(SupportHubTicketsSidebarComponent)
  private readonly ticketsSidebar?: SupportHubTicketsSidebarComponent;

  private readonly resolvedPresence = this.route.snapshot.data[
    'ticketPresence'
  ] as { hasInitiated: boolean; hasAssigned: boolean } | undefined;

  protected readonly selectedTicketId = signal<string | null>(null);
  protected readonly deepLinkTicketId = signal<string | null>(null);
  private readonly lastSelectedTicketId = signal<string | null>(null);
  protected readonly isJourneyActive = signal(false);
  protected readonly journeyStudents = signal<SupportJourneyStudent[]>([]);
  protected readonly journeyRequiresFullWidth = signal(false);
  protected readonly refreshToken = signal(0);

  protected readonly activeTicket = signal<SupportTicketCardConfig | null>(
    null,
  );

  protected readonly isTabletOrDesktop = this.layoutService.isTabletOrDesktop;
  protected readonly isMobile = this.layoutService.isMobile;
  protected readonly isCompact = computed(
    () => this.layoutService.windowClass() === 'compact',
  );
  protected readonly isSplitView = computed(
    () => this.layoutService.windowClass() !== 'compact',
  );
  protected readonly canManageTickets = this.rbacService.hasSomePermission([
    RESOURCE_PERMISSION.supportTicket.updateTicket,
    RESOURCE_PERMISSION.supportTicket.reassign,
    RESOURCE_PERMISSION.supportTicket.resolveTicket,
  ]);

  protected readonly shouldShowEmptyShell = signal(false);
  private readonly initiatedPresence = signal<boolean | null>(
    this.resolvedPresence?.hasInitiated ?? null,
  );
  private readonly assignedPresence = signal<boolean | null>(
    this.resolvedPresence?.hasAssigned ?? null,
  );

  protected readonly hasInitiatedTickets = computed(
    () => this.supportHubTicketsService.initiatedTickets().length > 0,
  );
  protected readonly hasAssignedTickets = computed(
    () => this.supportHubTicketsService.assignedTickets().length > 0,
  );
  protected readonly hasAnyTicketsPresence = computed(() => {
    const initiated = this.initiatedPresence();
    const assigned = this.assignedPresence();
    if (
      initiated === null &&
      assigned === null &&
      !this.hasInitiatedTickets() &&
      !this.hasAssignedTickets()
    ) {
      return true;
    }
    const hasInitiated = (initiated ?? false) || this.hasInitiatedTickets();
    const hasAssigned = (assigned ?? false) || this.hasAssignedTickets();
    return hasInitiated || hasAssigned;
  });
  // Hides the tickets pane for non-managers with no tickets.
  // Uses resolver snapshot data via hasAnyTicketsPresence so it takes effect
  // on the very first render, before the sidebar's async load can interfere.
  protected readonly shouldHideTicketsPane = computed(
    () =>
      this.shouldShowEmptyShell() ||
      (!this.canManageTickets &&
        !this.isJourneyActive() &&
        !this.hasAnyTicketsPresence()),
  );
  protected readonly shouldShowManageEmptyShell = computed(
    () =>
      this.canManageTickets &&
      !this.isJourneyActive() &&
      !this.hasAnyTicketsPresence(),
  );
  protected readonly shouldShowAnyEmptyShell = computed(
    () => this.shouldHideTicketsPane() || this.shouldShowManageEmptyShell(),
  );
  protected readonly initiatorEmptyStateTitle = this.translate.t(
    'support.hub.empty.title',
  );
  protected readonly initiatorEmptyStateDescription = this.translate.t(
    'support.hub.empty.description',
  );
  protected readonly initiatorEmptyStateImagePath =
    'assets/illustrations/no_data.svg';
  private readonly canCreateTicket = this.rbacService.hasPermission(
    RESOURCE_PERMISSION.supportTicket.createTicket,
  );
  protected readonly initiatorEmptyStatePrimaryButton:
    | NoDataBtnInterface
    | undefined = this.canCreateTicket
    ? {
        label: this.translate.t('support.hub.empty.primary_cta'),
        onAction: () => this.onHeaderJourneyStartRequested([], true),
      }
    : undefined;

  protected readonly showListPane = computed(() => {
    if (!this.canManageTickets) {
      if (this.shouldShowEmptyShell()) {
        return false;
      }

      if (this.isJourneyActive() && this.journeyRequiresFullWidth()) {
        return false;
      }
    }

    if (this.isJourneyActive()) {
      return this.isSplitView();
    }

    if (this.shouldShowEmptyShell()) {
      return false;
    }

    return this.isSplitView() || !this.selectedTicketId();
  });

  protected readonly showDetailPane = computed(() => {
    if (!this.canManageTickets) {
      if (this.shouldShowEmptyShell()) {
        return false;
      }

      if (this.isJourneyActive()) {
        return true;
      }
    }

    if (this.shouldShowEmptyShell()) {
      return false;
    }

    if (this.isJourneyActive()) {
      return true;
    }

    return this.isSplitView() || !!this.selectedTicketId();
  });

  private readonly profileRouteByType: Record<UserType, string> = {
    [UserType.STUDENT]: 'user-management/students',
    [UserType.GUARDIAN]: 'user-management/guardians',
    [UserType.PERSONNEL]: 'user-management/personnels',
  };

  constructor() {
    // Capture ticketId from query params for deep linking
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        const ticketId = queryParams.get('ticketId');
        if (ticketId) {
          this.deepLinkTicketId.set(ticketId);
        }
      });

    this.ticketActionsService.ticketUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ticketId) => {
        const selectedId = this.selectedTicketId();
        if (!selectedId || selectedId !== String(ticketId)) {
          return;
        }
        Promise.resolve().then(() => {
          const numericId = Number(selectedId);
          const updatedTicket =
            this.supportHubTicketsService
              .initiatedTickets()
              .find((ticket) => ticket.id === numericId) ??
            this.supportHubTicketsService
              .assignedTickets()
              .find((ticket) => ticket.id === numericId) ??
            null;
          const menu = updatedTicket
            ? this.ticketActionsService.buildMenuItems(updatedTicket, {
                includeViewItem: !this.isSplitView(),
              })
            : null;

          const updatedCard = this.ticketsSidebar?.findTicketById(selectedId);
          if (updatedCard) {
            this.activeTicket.set({
              ...updatedCard,
              ...(menu ? { menu } : {}),
            });
            return;
          }

          const current = this.activeTicket();
          if (!current || !menu) {
            return;
          }

          this.activeTicket.set({ ...current, menu });
        });
      });

    this.ticketActionsService.navigateToList$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isCompact()) {
          this.onBackToList();
        }
      });

    this.ticketActionsService.listRefresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshToken.update((value) => value + 1);
      });

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

    effect(
      () => {
        this.layoutService.updateBottomBarVisibility(false);

        if (this.isCompact()) {
          const shouldShowHeader =
            !this.selectedTicketId() && !this.isJourneyActive();
          this.layoutService.updateHeaderVisibility(shouldShowHeader);
        } else {
          this.layoutService.updateHeaderVisibility(true);
        }
      },
      { injector: this.injector },
    );
  }

  protected async onHeaderJourneyStartRequested(
    students: SupportJourneyStudent[],
    fullWidth = false,
  ): Promise<void> {
    const resolvedStudents =
      await this.journeySelection.resolvePreJourneySelection(students);
    if (!resolvedStudents) {
      return;
    }
    this.journeyRequiresFullWidth.set(
      fullWidth && !this.canManageTickets ? true : false,
    );
    this.journeyStudents.set(resolvedStudents);
    this.lastSelectedTicketId.set(this.selectedTicketId());
    this.selectedTicketId.set(null);
    this.activeTicket.set(null);
    this.isJourneyActive.set(true);
    this.shouldShowEmptyShell.set(false);
  }

  protected onJourneyStudentsRequested(
    students: SupportJourneyStudent[],
  ): void {
    // Update journey students when selected from modal
    this.journeyStudents.set(students);
  }

  protected onTicketSelected(ticket: SupportTicketCardConfig): void {
    // Exit journey when selecting a ticket from the list
    if (this.isJourneyActive()) {
      this.isJourneyActive.set(false);
      this.journeyStudents.set([]);
      this.journeyRequiresFullWidth.set(false);
      this.journeySelection.clearSelections();
    }
    this.selectedTicketId.set(ticket.ticketNumber);
    this.lastSelectedTicketId.set(ticket.ticketNumber);
    this.activeTicket.set(ticket);
  }

  protected onJourneyExit(): void {
    this.isJourneyActive.set(false);
    this.journeyStudents.set([]);
    this.journeyRequiresFullWidth.set(false);
    this.activeTicket.set(null);
    this.selectedTicketId.set(this.lastSelectedTicketId());
    this.journeySelection.clearSelections();
  }

  protected onBackToList(): void {
    this.selectedTicketId.set(null);
    this.activeTicket.set(null);
    this.journeyRequiresFullWidth.set(false);
  }

  protected onTicketMenuItemSelected(
    selection: SupportTicketMenuSelection,
  ): void {
    // Handle view-details action
    if (selection.item.id === 'view-details') {
      this.onTicketSelected(selection.ticket);
    }
  }

  protected onEmptyShellVisibilityChange(show: boolean): void {
    if (this.canManageTickets) {
      return;
    }

    this.shouldShowEmptyShell.set(show && !this.isJourneyActive());
  }

  protected onDeepLinkHandled(): void {
    this.deepLinkTicketId.set(null);
  }

  protected onTicketCreated(event: {
    ticketId: string | number | null;
    schoolId: number | null;
  }): void {
    // Exit journey mode
    this.isJourneyActive.set(false);
    this.journeyStudents.set([]);
    this.journeyRequiresFullWidth.set(false);
    this.selectedTicketId.set(null);
    this.activeTicket.set(null);
    this.journeySelection.clearSelections();
    this.ticketsSidebar?.focusCreatedTicket(event.ticketId);
  }

  protected onViewRequesterProfile(
    profile: SupportTicketInitatorViewProfile | null,
  ): void {
    if (!profile) {
      return;
    }

    const baseRoute = this.profileRouteByType[profile.type];
    if (!baseRoute) {
      return;
    }

    this.router.navigate([baseRoute, profile.id]);
  }

  ionViewWillEnter(): void {
    this.layoutService.updateChildSelectorVisibility(false);
    this.layoutService.updateBottomBarVisibility(false);
    this.refreshToken.update((value) => value + 1);

    if (this.isCompact()) {
      const shouldShowHeader =
        !this.selectedTicketId() && !this.isJourneyActive();
      this.layoutService.updateHeaderVisibility(shouldShowHeader);
    } else {
      this.layoutService.updateHeaderVisibility(true);
    }
  }

  ionViewWillLeave(): void {
    this.layoutService.updateBottomBarVisibility(true);
    this.layoutService.updateHeaderVisibility(true);
  }
}
