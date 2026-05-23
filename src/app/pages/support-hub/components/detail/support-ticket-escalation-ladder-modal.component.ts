import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { SupportTicketEscalationLadderComponent } from './support-ticket-escalation-ladder.component';
import type {
  SupportTicketEscalationLadderVm,
  SupportTicketEscalationLadderStepVm,
  SupportTicketEscalationLadderTimeTone,
  SupportTicketEscalationLadderDotTone,
  SupportTicketEscalationLadderPersonnelVm,
} from './support-ticket-escalation-ladder.component';
import { SupportHubTicketDetail } from '@pages/support-hub/data-access/support-hub-ticket-detail.interface';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { SupportTicketStatus, UserProfileColors } from '@shared/enums';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { isRtl } from '@shared/utils/platform';
import { addDays } from 'date-fns';
import { faClock } from '@fortawesome/pro-regular-svg-icons';
import { faArrowTurnUp } from '@fortawesome/pro-solid-svg-icons';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

@Component({
  selector: 'app-support-ticket-escalation-ladder-modal',
  standalone: true,
  imports: [CommonModule, SupportTicketEscalationLadderComponent],
  providers: [TimeAgoPipe],
  template: `
    @if (escalationLadderVm(); as ladderVm) {
      <app-support-ticket-escalation-ladder
        [ladder]="ladderVm"
      ></app-support-ticket-escalation-ladder>
    } @else {
      <div class="p-ds-xl">
        <p class="content-md-default text-emphasis-mid">
          {{ escalationUnavailableLabel() }}
        </p>
      </div>
    }
  `,
})
export class SupportTicketEscalationLadderModalComponent implements DsModalContentComponent {
  private static readonly DAY_IN_MS = 24 * 60 * 60 * 1000;

  readonly ticketDetail = input<SupportHubTicketDetail | null>(null);
  readonly escalateAction = input<(() => void) | null>(null);
  closeModal?: (data?: unknown, role?: string) => void;

  private readonly translateService = inject(HesTranslateService);
  private readonly timeAgoPipe = inject(TimeAgoPipe);
  private readonly isRtlLayout = isRtl();

  private readonly assigneeAvatarColors: UserProfileColors[] = [
    UserProfileColors.CORAL,
    UserProfileColors.GREEN,
    UserProfileColors.INDIGO,
    UserProfileColors.TEAL,
    UserProfileColors.BRAND,
  ];

  private readonly timelineClockIcon = faClock;
  private readonly escalateIcon = faArrowTurnUp;

  protected readonly escalationLadderVm =
    computed<SupportTicketEscalationLadderVm | null>(() => {
      const detail = this.ticketDetail();
      if (!detail?.ticketEscalations?.length) {
        return null;
      }

      const createdAt = detail.createdAt ? new Date(detail.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        return null;
      }

      const sortedEscalations = detail.ticketEscalations
        .slice()
        .sort((a, b) => a.levelNumber - b.levelNumber);
      const cumulativeDaysByLevel =
        this.buildEscalationCumulativeDays(sortedEscalations);
      const steps = sortedEscalations
        .map((escalation, index) =>
          this.buildEscalationStepVm(
            detail,
            escalation,
            createdAt,
            cumulativeDaysByLevel,
            index,
          ),
        )
        .filter((step): step is SupportTicketEscalationLadderStepVm =>
          Boolean(step),
        );

      if (!steps.length) {
        return null;
      }

      const action = this.escalateAction();

      return {
        title:
          this.translateService.t('support_tickets.escalation_ladder.title') ??
          'Escalation Ladder',
        steps,
        action: action
          ? {
              label:
                this.translateService.t(
                  'support_ticket.escalate_ticket.title',
                ) ?? 'Escalate',
              icon: this.escalateIcon,
            }
          : null,
      } satisfies SupportTicketEscalationLadderVm;
    });

  protected readonly escalationUnavailableLabel = computed(
    () =>
      this.translateService.t(
        'support_tickets.escalation_level_not_found.title',
      ) ?? 'Escalation ladder unavailable.',
  );

  protected onClose(): void {
    if (this.closeModal) {
      this.closeModal(null, 'close');
    }
  }

  onPrimaryClick(): void {
    this.onEscalate();
  }

  protected onEscalate(): void {
    const action = this.escalateAction();
    if (action) {
      action();
    }
    if (this.closeModal) {
      this.closeModal(null, 'confirm');
    }
  }

  private buildEscalationStepVm(
    detail: SupportHubTicketDetail,
    escalation: SupportHubTicketDetail['ticketEscalations'][number],
    createdAt: Date,
    cumulativeDaysByLevel: Map<number, number>,
    colorOffset: number,
  ): SupportTicketEscalationLadderStepVm | null {
    const personnels = escalation.ticketEscalationPersonnels ?? [];

    const isDefaultLevel =
      escalation.levelNumber === detail.firstEscalationLevelNumber;
    const title = isDefaultLevel
      ? (this.translateService.t(
          'support_ticket.default_escalation_level.title',
        ) ?? 'Default escalation level')
      : `${
          this.translateService.t('support_ticket.escalation_level.title') ??
          'Escalation Level'
        } ${escalation.levelNumber}`;

    let timeLabel: string | null = null;
    let timeTone: SupportTicketEscalationLadderTimeTone = 'default';

    const currentLevel = detail.currentEscalationLevelNumber;
    if (currentLevel !== null && currentLevel !== undefined) {
      if (escalation.levelNumber === currentLevel) {
        const entryDate =
          this.findEscalationActivityDate(detail, {
            toLevel: escalation.levelNumber,
          }) ?? (isDefaultLevel ? createdAt : null);
        if (entryDate) {
          const label = this.timeAgoPipe.transform(entryDate);
          timeLabel = label || null;
        }
        timeTone = 'default';
      } else if (escalation.levelNumber < currentLevel) {
        const exitDate = this.findEscalationActivityDate(detail, {
          fromLevel: escalation.levelNumber,
        });
        if (exitDate) {
          const label = this.timeAgoPipe.transform(exitDate);
          timeLabel = label || null;
        }
        timeTone = 'muted';
      } else {
        const cumulativeDays =
          cumulativeDaysByLevel.get(escalation.levelNumber) ?? 0;
        const dueDate = addDays(createdAt, cumulativeDays);
        const formatted = this.formatFutureEscalationTimeLabel(dueDate);
        timeLabel = formatted.text ?? null;
        timeTone = formatted.tone;
      }
    } else if (isDefaultLevel) {
      const label = this.timeAgoPipe.transform(createdAt);
      timeLabel = label || null;
      timeTone = 'default';
    }

    const dotTone: SupportTicketEscalationLadderDotTone =
      escalation.levelNumber < detail.currentEscalationLevelNumber
        ? 'completed'
        : escalation.levelNumber === detail.currentEscalationLevelNumber
          ? 'current'
          : 'pending';

    const personnelsVm = this.buildEscalationPersonnelVmList(
      detail,
      personnels,
      colorOffset,
    );

    return {
      id: `${escalation.id}`,
      title,
      timeLabel,
      timeTone,
      timeIcon: this.timelineClockIcon,
      dotTone,
      personnels: personnelsVm,
      emptyStateLabel: personnelsVm.length
        ? null
        : (this.translateService.t(
            'support_ticket.default_assignment_not_found.title',
          ) ?? 'No assignees configured.'),
    } satisfies SupportTicketEscalationLadderStepVm;
  }

  private buildEscalationPersonnelVmList(
    detail: SupportHubTicketDetail,
    personnels: SupportHubTicketDetail['ticketEscalations'][number]['ticketEscalationPersonnels'],
    colorOffset: number,
  ): SupportTicketEscalationLadderPersonnelVm[] {
    if (!personnels?.length) {
      return [];
    }

    return personnels.map((personnel, index) => {
      const rawName = personnel.displayName?.trim() ?? '';
      const name = rawName || '—';
      const avatarColor =
        this.assigneeAvatarColors[
          (colorOffset + index) % this.assigneeAvatarColors.length
        ] ?? UserProfileColors.NEUTRAL;
      const role =
        (personnel.roles ?? [])
          .map((item) => item.displayName?.trim())
          .filter(Boolean)
          .join(', ') || null;

      return {
        id: `${personnel.id}`,
        name,
        role,
        avatarColor,
      } satisfies SupportTicketEscalationLadderPersonnelVm;
    });
  }

  private buildEscalationCumulativeDays(
    escalations: SupportHubTicketDetail['ticketEscalations'],
  ): Map<number, number> {
    const cumulativeDaysByLevel = new Map<number, number>();
    let cumulativeDays = 0;

    for (const escalation of escalations) {
      cumulativeDaysByLevel.set(escalation.levelNumber, cumulativeDays);
      cumulativeDays += escalation.days ?? 0;
    }

    return cumulativeDaysByLevel;
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

  private formatFutureEscalationTimeLabel(dueDate: Date): {
    text: string | null;
    tone: SupportTicketEscalationLadderTimeTone;
  } {
    if (!dueDate || Number.isNaN(dueDate.getTime())) {
      return { text: null, tone: 'muted' };
    }

    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();

    if (diffMs < SupportTicketEscalationLadderModalComponent.DAY_IN_MS) {
      return { text: null, tone: 'muted' };
    }

    const daysLeft = Math.ceil(
      diffMs / SupportTicketEscalationLadderModalComponent.DAY_IN_MS,
    );
    const tone: SupportTicketEscalationLadderTimeTone =
      daysLeft <= 1 ? 'warning' : 'default';

    const text = this.isRtlLayout
      ? this.buildArabicDaysLeftLabel(daysLeft)
      : this.buildEnglishDaysLeftLabel(daysLeft);

    return { text, tone };
  }

  private buildEnglishDaysLeftLabel(daysLeft: number): string {
    const unit = daysLeft === 1 ? 'day' : 'days';
    return `${daysLeft} ${unit} left to escalate`;
  }

  private buildArabicDaysLeftLabel(daysLeft: number): string {
    if (daysLeft === 1) {
      return 'متبقي يوم واحد للتصعيد';
    }

    if (daysLeft === 2) {
      return 'متبقي يومان للتصعيد';
    }

    if (daysLeft >= 3 && daysLeft <= 10) {
      return `متبقي ${daysLeft} أيام للتصعيد`;
    }

    return `متبقي ${daysLeft} يومًا للتصعيد`;
  }
}
