import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  ModalController,
} from '@ionic/angular/standalone';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupportHubTicketsService } from '@pages/support-hub/data-access/support-hub-tickets.service';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import {
  SupportTicketSchoolInfo,
  SupportTicketSchoolInfoComponent,
} from '../detail/support-ticket-school-info.component';
import {
  UserInfoPillComponent,
  UserInfoPillData,
} from '../user-info-pill/user-info-pill.component';
import { UserProfileColors } from '@shared/enums';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { SupportHubTicketDetail } from '@pages/support-hub/data-access/support-hub-ticket-detail.interface';
import { SupportHubTicketPersonnel } from '@pages/support-hub/data-access/support-hub-ticket-personnel.interface';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { AuthService } from '@auth/auth.service';

export interface AvailableUser extends UserInfoPillData {
  readonly id: string;
  readonly userId: number;
}

const ITEMS_PER_PAGE = 20;

@Component({
  selector: 'app-support-hub-add-remove-assignee',
  standalone: true,
  imports: [
    TranslocoDirective,
    CommonModule,
    FormsModule,
    SearchBoxComponent,
    SupportTicketSchoolInfoComponent,
    UserInfoPillComponent,
    DsCheckboxComponent,
    AvatarComponent,
    DsButtonComponent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonContent,
  ],
  templateUrl: './support-hub-add-remove-assignee.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubAddRemoveAssigneeComponent {
  private readonly authService = inject(AuthService);
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchSubject = new Subject<string>();
  private currentSchoolId: number | null = null;
  private currentPage = 1;
  private ticketDetail: SupportHubTicketDetail | null = null;
  private readonly initialSelectedIds = signal<Set<string>>(new Set());

  // Inputs
  readonly isMobile = input<boolean>(false);
  readonly modalCtrl = input<ModalController>();
  readonly ticketId = input<number>();
  readonly isInitiatorTicket = input<boolean>();
  closeModal?: (data?: unknown, role?: string) => void;

  // State
  readonly searchQuery = signal<string>('');
  readonly schoolInfo = signal<SupportTicketSchoolInfo>({
    title: '',
    subtitle: '',
  });
  readonly availableUsers = signal<AvailableUser[]>([]);
  readonly selectedUserIds = signal<Set<string>>(new Set());
  readonly selectedAssigneesMap = signal<Map<string, AvailableUser>>(new Map());
  readonly isLoading = signal<boolean>(false);
  readonly isUpdating = signal<boolean>(false);
  readonly hasMorePages = signal<boolean>(true);
  readonly defaultColor = UserProfileColors.NEUTRAL;

  readonly selectedAssignees = computed<AvailableUser[]>(() => {
    return Array.from(this.selectedAssigneesMap().values());
  });

  readonly currentUserPersonnelId = computed<string>(() => {
    const user = this.authService.user();
    return user ? String(user.userTypeId) : '';
  });

  readonly hasChanges = computed<boolean>(() => {
    const current = this.selectedUserIds();
    const initial = this.initialSelectedIds();

    if (current.size !== initial.size) return true;

    for (const id of current) {
      if (!initial.has(id)) return true;
    }

    return false;
  });

  constructor() {
    this.initializeTicketDetailEffect();
    this.initializeSearchDebounce();
  }

  // Public methods
  isUserSelected(id: string): boolean {
    return this.selectedUserIds().has(id);
  }

  isCurrentUser(id: string): boolean {
    return id === this.currentUserPersonnelId();
  }

  wasInitiallySelected(id: string): boolean {
    return this.initialSelectedIds().has(id);
  }

  onToggleUser(user: AvailableUser, isSelected: boolean): void {
    this.selectedUserIds.update((ids) => {
      const newIds = new Set(ids);
      if (isSelected) {
        newIds.add(user.id);
      } else {
        newIds.delete(user.id);
      }
      return newIds;
    });

    this.selectedAssigneesMap.update((map) => {
      const newMap = new Map(map);
      if (isSelected) {
        newMap.set(user.id, user);
      } else {
        newMap.delete(user.id);
      }
      return newMap;
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  onLoadMore(event: InfiniteScrollCustomEvent): void {
    if (!this.hasMorePages() || !this.currentSchoolId) {
      event.target.complete();
      return;
    }

    this.currentPage++;
    this.loadPersonnels(this.currentSchoolId, true, event);
  }

  onCancelClick(): void {
    if (this.closeModal) {
      this.closeModal(undefined, 'cancel');
      return;
    }
    this.modalCtrl()?.dismiss();
  }

  onRemoveAssignee(user: AvailableUser): void {
    this.onToggleUser(user, false);
  }

  onUpdateAssignees(): void {
    if (!this.ticketDetail || !this.ticketId()) return;

    const currentSelectedIds = this.selectedUserIds();

    // All currently selected personnel IDs
    const personnelIds: number[] = Array.from(currentSelectedIds).map((id) =>
      Number(id),
    );

    // Find removed personnel IDs (in initial but not in current)
    const unassignedPersonnelIds: number[] = [];
    this.initialSelectedIds().forEach((id) => {
      if (!currentSelectedIds.has(id)) {
        unassignedPersonnelIds.push(Number(id));
      }
    });

    // At least one array must have values
    if (personnelIds.length === 0 && unassignedPersonnelIds.length === 0) {
      if (this.closeModal) {
        this.closeModal(undefined, 'cancel');
        return;
      }
      this.modalCtrl()?.dismiss();
      return;
    }

    this.isUpdating.set(true);

    this.supportHubTicketsService
      .reAssignTicket(this.ticketId()!, {
        supportTypeId: this.ticketDetail.supportTypeId,
        supportCategoryId: this.ticketDetail.supportCategoryId,
        ...(personnelIds.length > 0 && { personnelIds }),
        ...(unassignedPersonnelIds.length > 0 && { unassignedPersonnelIds }),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isUpdating.set(false)),
      )
      .subscribe(() => {
        if (this.closeModal) {
          this.closeModal({ updated: true }, 'updated');
          return;
        }
        this.modalCtrl()?.dismiss({ updated: true });
      });
  }

  // Private methods
  private initializeTicketDetailEffect(): void {
    effect(() => {
      const ticketId = this.ticketId();
      const isInitiator = this.isInitiatorTicket();

      if (ticketId === undefined) return;

      const handleResponse = (response: SupportHubTicketDetail) => {
        this.populateTicketDetail(response);
      };

      if (isInitiator) {
        this.supportHubTicketsService
          .getTicketDetailAsInitiator(ticketId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(handleResponse);
      } else {
        this.supportHubTicketsService
          .getTicketDetailsAsAssignee(String(ticketId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(handleResponse);
      }
    });
  }

  private initializeSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.resetPagination();
        if (this.currentSchoolId) {
          this.loadPersonnels(this.currentSchoolId, false);
        }
      });
  }

  private populateTicketDetail(ticketDetail: SupportHubTicketDetail): void {
    this.ticketDetail = ticketDetail;
    this.currentSchoolId = ticketDetail.schoolId;
    this.populateSchoolInfo(ticketDetail.schoolStructure);
    this.populateSelectedAssignees(ticketDetail);
    this.initialSelectedIds.set(new Set(this.selectedUserIds()));
    this.loadPersonnels(ticketDetail.schoolId, false);
  }

  private populateSchoolInfo(
    schoolStructure: SupportHubTicketDetail['schoolStructure'],
  ): void {
    this.schoolInfo.set({
      title: `${schoolStructure.company.displayName} - ${schoolStructure.campus.displayName}`,
      subtitle: schoolStructure.school.displayName,
    });
  }

  private populateSelectedAssignees(
    ticketDetail: SupportHubTicketDetail,
  ): void {
    const currentEscalation = ticketDetail.ticketEscalations.find(
      (escalation) =>
        escalation.levelNumber === ticketDetail.currentEscalationLevelNumber,
    );

    if (!currentEscalation) {
      this.selectedUserIds.set(new Set());
      this.selectedAssigneesMap.set(new Map());
      return;
    }

    const ids: string[] = [];
    const assigneesMap = new Map<string, AvailableUser>();

    currentEscalation.ticketEscalationPersonnels.forEach((personnel) => {
      const id = String(personnel.personnelId);
      ids.push(id);
      assigneesMap.set(id, {
        id,
        userId: personnel.userId,
        fullName: personnel.displayName,
        subtitle: personnel.roles.map((role) => role.displayName).join(', '),
        color: personnel.profileColor,
      });
    });

    this.selectedUserIds.set(new Set(ids));
    this.selectedAssigneesMap.set(assigneesMap);
  }

  private loadPersonnels(
    schoolId: number,
    append: boolean,
    infiniteScrollEvent?: InfiniteScrollCustomEvent,
  ): void {
    this.isLoading.set(true);

    this.supportHubTicketsService
      .getTicketPersonnels(schoolId, {
        searchText: this.searchQuery() || undefined,
        pageNumber: this.currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading.set(false);
          infiniteScrollEvent?.target.complete();
        }),
      )
      .subscribe(({ personnels, pagination }) => {
        const users = this.mapPersonnelsToAvailableUsers(personnels);

        if (append) {
          this.availableUsers.update((current) => [...current, ...users]);
        } else {
          this.availableUsers.set(users);
        }

        this.hasMorePages.set(this.currentPage < pagination.totalPages);
      });
  }

  private mapPersonnelsToAvailableUsers(
    personnels: SupportHubTicketPersonnel[],
  ): AvailableUser[] {
    return personnels.map((personnel) => ({
      id: String(personnel.id),
      userId: personnel.userId,
      fullName: personnel.displayName,
      subtitle: personnel.roles,
      color: personnel.profileColor,
    }));
  }

  private resetPagination(): void {
    this.currentPage = 1;
    this.hasMorePages.set(true);
    this.availableUsers.set([]);
  }
}
