import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { faCircleInfo, faCirclePlus } from '@fortawesome/pro-regular-svg-icons';
import {
  SupportHubFiltersChange,
  SupportHubFiltersComponent,
} from '../filters/support-hub-filters.component';
import {
  SupportHubActionItem,
  SupportHubActionListComponent,
} from '../action-list/support-hub-action-list.component';
import { LayoutService } from '@layout/layout.service';
import { SupportJourneyStudent } from '../../data-access/journey/support-journey-student.model';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import { AuthService } from '@auth/auth.service';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { createSupportTicketAccess } from '@shared/utils/support-ticket-access';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

@Component({
  selector: 'app-support-hub-header',
  templateUrl: './support-hub-header.component.html',
  standalone: true,
  imports: [
    CommonModule,
    SearchBoxComponent,
    SupportHubFiltersComponent,
    SupportHubActionListComponent,
    DsTranslatePipe,
  ],
})
export class SupportHubHeaderComponent {
  private readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly supportTicketAccess = createSupportTicketAccess();

  readonly isTabletOrDesktop = this.layoutService.isTabletOrDesktop;
  readonly isSplitView = computed(
    () => this.layoutService.windowClass() !== 'compact',
  );
  readonly userName = computed(
    () => this.authService.user()?.displayName ?? '',
  );
  readonly canManageTickets = this.supportTicketAccess.canManageTickets;
  readonly canCreateTicket = computed(() =>
    this.rbacService.hasPermission(
      RESOURCE_PERMISSION.supportTicket.createTicket,
    ),
  );
  readonly showAddButton = computed(
    () => this.isSplitView() && this.canCreateTicket(),
  );
  readonly searchPlaceholderKey = computed(() =>
    this.canManageTickets()
      ? 'support.ticket.search_placeholder'
      : 'support.ticket.search_by_initiator_placeholder',
  );

  readonly actionCards = computed<SupportHubActionItem[]>(() => [
    ...(this.canCreateTicket()
      ? [
          {
            labelKey: 'support.new_request.btn',
            iconBackgroundClass: 'bg-surface-brand-surface-light',
            iconColorClass: 'text-surface-pastel-foreground-brandRich',
            icon: faCirclePlus,
            onSelect: () => {
              this.onNewHelpRequestClick();
            },
          },
        ]
      : []),
    {
      labelKey: 'support.learn_more.link',
      iconBackgroundClass: 'bg-surface-pastel-background-blueRich',
      iconColorClass: 'text-surface-pastel-foreground-blueRich',
      icon: faCircleInfo,
      onSelect: () => {
        this.actionSelected.emit('learn-more');
      },
    },
  ]);

  // Inputs
  readonly showInitiated = input<boolean>(false);
  readonly searchText = input<string>('');
  readonly filters = input<SupportHubFiltersChange | null>(null);
  readonly hasInitiatedTickets = input<boolean>(true);
  readonly hasAssignedTickets = input<boolean>(true);

  // Outputs
  readonly actionSelected = output<'new-help-request' | 'learn-more'>();
  readonly searchChanged = output<string>();
  readonly filtersChanged = output<SupportHubFiltersChange>();
  readonly journeyStartRequested = output<SupportJourneyStudent[]>();

  protected onSearchChange(term: string): void {
    this.searchChanged.emit(term);
  }

  protected onFiltersChanged(filters: SupportHubFiltersChange): void {
    this.filtersChanged.emit(filters);
  }

  protected handleActionSelected(_action: SupportHubActionItem): void {
    // onSelect is already called by the action-list component itself.
    // This handler is kept for any additional side-effects if needed.
  }

  protected onNewHelpRequestClick(): void {
    this.actionSelected.emit('new-help-request');
    this.journeyStartRequested.emit([]);
  }
}
