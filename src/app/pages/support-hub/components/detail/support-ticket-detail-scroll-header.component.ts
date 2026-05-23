import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { SupportTicketCardConfig } from '../ticket-card/support-ticket-card.component';
import { SupportHubTicketDetail } from '@pages/support-hub/data-access/support-hub-ticket-detail.interface';
import { SupportTicketStatus } from '@shared/enums';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { faEllipsisVertical } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-support-ticket-detail-scroll-header',
  standalone: true,
  imports: [CommonModule, DsIconComponent, DsResponsiveMenuComponent],
  providers: [TimeAgoPipe],
  templateUrl: './support-ticket-detail-scroll-header.component.html',
  styles: [
    `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }

      .support-ticket-summary-clamp {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        word-break: break-word;
      }
    `,
  ],
})
export class SupportTicketDetailScrollHeaderComponent {
  readonly summary = input.required<SupportTicketCardConfig>();
  readonly detail = input<SupportHubTicketDetail | null>(null);
  readonly clicked = output<void>();
  readonly menuItemSelected = output<PopupItem>();

  private readonly timeAgoPipe = inject(TimeAgoPipe);

  protected readonly menuIcon = faEllipsisVertical;

  protected readonly menu = computed(() => {
    const menuItems = this.summary()?.menu;
    if (!menuItems?.length) {
      return null;
    }

    // Hide "View details" in the scrolling header since we're already in details
    return menuItems.filter(
      (item) => item.visible !== false && item.id !== 'view-details',
    );
  });

  protected readonly escalationLabel = computed(() => {
    const detail = this.detail();
    const summary = this.summary();
    return (
      this.buildEscalationLabel(detail) ?? summary?.escalation?.label ?? null
    );
  });

  protected onHeaderClick(): void {
    this.clicked.emit();
  }

  protected onMenuItemClick(item: PopupItem): void {
    this.menuItemSelected.emit(item);
  }

  private buildEscalationLabel(
    detail: SupportHubTicketDetail | null,
  ): string | null {
    if (!detail) {
      return null;
    }

    const { firstEscalationLevelNumber, currentEscalationLevelNumber } = detail;

    if (
      currentEscalationLevelNumber === null ||
      currentEscalationLevelNumber === undefined
    ) {
      return null;
    }

    const entryDate =
      this.findEscalationActivityDate(detail, {
        toLevel: currentEscalationLevelNumber,
      }) ?? new Date(detail.createdAt);
    const label = this.timeAgoPipe.transform(entryDate);
    return label || null;
  }

  private findEscalationActivityDate(
    detail: SupportHubTicketDetail,
    match: { fromLevel?: number; toLevel?: number },
  ): Date | null {
    const activities = detail.ticketActivity ?? [];
    if (!activities.length) {
      return null;
    }

    const matchedActivities = activities.filter((activity) => {
      if (
        activity.status !== SupportTicketStatus.ESCALATED &&
        activity.status !== SupportTicketStatus.DE_ESCALATE
      ) {
        return false;
      }

      const change = activity.escalationChange;
      if (!change) {
        return false;
      }

      if (
        match.fromLevel !== undefined &&
        change.fromLevel !== match.fromLevel
      ) {
        return false;
      }

      if (match.toLevel !== undefined && change.toLevel !== match.toLevel) {
        return false;
      }

      return true;
    });

    if (!matchedActivities.length) {
      return null;
    }

    const latestActivity = matchedActivities.slice().sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    })[0];

    const date = new Date(latestActivity.createdAt);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
