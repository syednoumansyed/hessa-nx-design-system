import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { DsIconComponent, type DsIcon } from '@ds/icon/icon.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { UserProfileColors } from '@shared/enums';

export type SupportTicketEscalationLadderTimeTone =
  | 'default'
  | 'warning'
  | 'muted';

export type SupportTicketEscalationLadderDotTone =
  | 'current'
  | 'completed'
  | 'pending';

export interface SupportTicketEscalationLadderPersonnelVm {
  readonly id: string;
  readonly name: string;
  readonly role: string | null;
  readonly avatarColor: UserProfileColors;
}

export interface SupportTicketEscalationLadderStepVm {
  readonly id: string;
  readonly title: string;
  readonly timeLabel: string | null;
  readonly timeTone: SupportTicketEscalationLadderTimeTone;
  readonly timeIcon: DsIcon;
  readonly dotTone: SupportTicketEscalationLadderDotTone;
  readonly personnels: readonly SupportTicketEscalationLadderPersonnelVm[];
  readonly emptyStateLabel?: string | null;
}

export interface SupportTicketEscalationLadderActionVm {
  readonly label: string;
  readonly icon: DsIcon;
}

export interface SupportTicketEscalationLadderVm {
  readonly title: string;
  readonly steps: readonly SupportTicketEscalationLadderStepVm[];
  readonly action?: SupportTicketEscalationLadderActionVm | null;
}

@Component({
  selector: 'app-support-ticket-escalation-ladder',
  standalone: true,
  templateUrl: './support-ticket-escalation-ladder.component.html',
  imports: [CommonModule, DsIconComponent, AvatarComponent],
})
export class SupportTicketEscalationLadderComponent {
  readonly ladder = input.required<SupportTicketEscalationLadderVm>();

  protected dotClasses(tone: SupportTicketEscalationLadderDotTone): string[] {
    const base = [
      'flex',
      'items-center',
      'justify-center',
      'rounded-full',
      'shrink-0',
    ];

    switch (tone) {
      case 'completed':
        return [...base, 'h-4', 'w-4', 'bg-icon-action'];
      case 'current':
        return [
          ...base,
          'h-4',
          'w-4',
          'border-2',
          'border-icon-action',
          'bg-transparent',
        ];
      case 'pending':
      default:
        return [...base, 'h-4', 'w-4', 'bg-stroke-black-12'];
    }
  }

  protected timeToneClasses(
    tone: SupportTicketEscalationLadderTimeTone,
  ): string[] {
    switch (tone) {
      case 'warning':
        return ['text-content-error'];
      case 'muted':
        return ['text-emphasis-mid'];
      case 'default':
      default:
        return ['text-emphasis-high'];
    }
  }
}
