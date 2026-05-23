import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { UserProfileColors, UserType } from '@shared/enums';
import {
  faCircleCheck,
  faEllipsisVertical,
  faRotate,
  faTriangleExclamation,
} from '@fortawesome/pro-regular-svg-icons';
import { ObjId } from '@shared/interfaces/common.interface';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

export type SupportTicketStatusTone =
  | 'open'
  | 'reopened'
  | 'escalated'
  | 'resolved';
export type SupportTicketCategoryTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'brand';

export interface SupportTicketStatusConfig {
  readonly label: string;
  readonly tone?: SupportTicketStatusTone;
  readonly icon?: DsIcon;
  readonly iconColorClass?: string;
  readonly backgroundClass?: string;
  readonly textClass?: string;
}

export interface SupportTicketCategoryConfig {
  readonly label: string;
  readonly tone?: SupportTicketCategoryTone;
  readonly icon?: DsIcon;
  readonly iconColorClass?: string;
  readonly backgroundClass?: string;
  readonly textClass?: string;
}

export interface SupportTicketSchoolInfo {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: DsIcon;
}

export interface SupportTicketAssigneeInfo {
  readonly name: string;
  readonly names?: ReadonlyArray<string>;
  readonly label?: string;
}

export interface SupportTicketDetailedAssignee {
  readonly id: number | string;
  readonly name: string;
  readonly role?: string | null;
  readonly avatarColor?: UserProfileColors;
}

export interface SupportTicketEscalationInfo {
  readonly label: string;
}

export interface SupportTicketFooterProfile {
  readonly displayName: string;
  readonly imageUrl?: string | null;
  readonly color?: UserProfileColors;
}

export interface SupportTicketCardStudent {
  readonly id: number;
  readonly displayName: string;
}

export interface SupportTicketCardConfig {
  readonly ticketNumber: string;
  readonly createdOn: string;
  readonly subCategory: string;
  readonly status: SupportTicketStatusConfig;
  readonly isResolved?: boolean;
  readonly isPrivateRequest?: boolean;
  readonly category?: SupportTicketCategoryConfig;
  readonly description: string;
  readonly school?: SupportTicketSchoolInfo;
  readonly initiatorDisplayName?: string;
  readonly isInitiatorTicket?: boolean;
  readonly students?: ReadonlyArray<SupportTicketCardStudent>;
  readonly assignee?: SupportTicketAssigneeInfo;
  readonly assigneesDetail?: ReadonlyArray<SupportTicketDetailedAssignee>;
  readonly escalation?: SupportTicketEscalationInfo;
  readonly requester?: {
    readonly id?: ObjId;
    readonly name: string;
    readonly role?: string;
    readonly userType?: UserType;
    readonly avatarUrl?: string | null;
    readonly avatarColor?: UserProfileColors;
    readonly badgeText?: string;
  };
  readonly menu?: ReadonlyArray<PopupItem>;
  readonly footerProfiles?: ReadonlyArray<SupportTicketFooterProfile>;
}

export interface SupportTicketMenuSelection {
  readonly ticket: SupportTicketCardConfig;
  readonly item: PopupItem;
}

interface BadgeStyleModel {
  readonly backgroundClass: string;
  readonly textClass: string;
  readonly icon?: DsIcon;
  readonly iconColorClass?: string;
}

@Component({
  selector: 'app-support-ticket-card',
  standalone: true,
  templateUrl: './support-ticket-card.component.html',
  imports: [
    NgClass,
    DsIconComponent,
    AvatarComponent,
    DsResponsiveMenuComponent,
    TimeAgoPipe,
    DsTranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportTicketCardComponent {
  private readonly statusToneStyles: Record<
    SupportTicketStatusTone,
    BadgeStyleModel
  > = {
    open: {
      backgroundClass: 'bg-surface-pastel-background-blue',
      textClass: 'text-surface-pastel-foreground-blue',
    },
    reopened: {
      backgroundClass: 'bg-surface-pastel-background-indigoRich',
      textClass: 'text-surface-pastel-foreground-indigo',
      icon: faRotate,
      iconColorClass: 'text-surface-pastel-foreground-indigo',
    },
    escalated: {
      backgroundClass: 'bg-surface-pastel-background-red',
      textClass: 'text-surface-pastel-foreground-red',
      icon: faTriangleExclamation,
      iconColorClass: 'text-surface-pastel-foreground-red',
    },
    resolved: {
      backgroundClass: 'bg-surface-pastel-background-emeraldRich',
      textClass: 'text-surface-pastel-foreground-green',
    },
  };

  private readonly categoryToneStyles: Record<
    SupportTicketCategoryTone,
    BadgeStyleModel
  > = {
    success: {
      backgroundClass: 'bg-surface-pastel-background-green',
      textClass: 'text-surface-pastel-foreground-green',
      icon: faCircleCheck,
      iconColorClass: 'text-surface-pastel-foreground-green',
    },
    info: {
      backgroundClass: 'bg-surface-pastel-background-blue',
      textClass: 'text-surface-pastel-foreground-blue',
      icon: faCircleCheck,
      iconColorClass: 'text-surface-pastel-foreground-blue',
    },
    warning: {
      backgroundClass: 'bg-surface-pastel-background-orange',
      textClass: 'text-surface-pastel-foreground-orange',
      icon: faTriangleExclamation,
      iconColorClass: 'text-surface-pastel-foreground-orange',
    },
    danger: {
      backgroundClass: 'bg-surface-pastel-background-red',
      textClass: 'text-surface-pastel-foreground-red',
      icon: faTriangleExclamation,
      iconColorClass: 'text-surface-pastel-foreground-red',
    },
    brand: {
      backgroundClass: 'bg-surface-brand-surface-light',
      textClass: 'text-surface-pastel-foreground-brand',
      icon: faCircleCheck,
      iconColorClass: 'text-surface-pastel-foreground-brand',
    },
  };

  readonly ticket = input.required<SupportTicketCardConfig>();
  readonly selectable = input(false, { transform: booleanAttribute });
  readonly selected = input(false, { transform: booleanAttribute });

  readonly ticketSelected = output<SupportTicketCardConfig>();
  readonly menuClick = output<SupportTicketCardConfig>();
  readonly menuItemSelected = output<SupportTicketMenuSelection>();

  protected readonly statusVm = computed(() => {
    const { status } = this.ticket();
    const toneStyle = status.tone
      ? this.statusToneStyles[status.tone]
      : undefined;

    return {
      label: status.label,
      backgroundClass:
        status.backgroundClass ??
        toneStyle?.backgroundClass ??
        'bg-surface-pastel-background-blue',
      textClass:
        status.textClass ??
        toneStyle?.textClass ??
        'text-surface-pastel-foreground-blue',
      icon: status.icon ?? toneStyle?.icon,
      iconColorClass:
        status.iconColorClass ??
        toneStyle?.iconColorClass ??
        status.textClass ??
        toneStyle?.textClass ??
        'text-surface-pastel-foreground-blue',
    };
  });

  protected readonly categoryVm = computed(() => {
    const category = this.ticket().category;
    if (!category) return null;

    const toneStyle = category.tone
      ? this.categoryToneStyles[category.tone]
      : undefined;

    return {
      label: category.label,
      backgroundClass:
        category.backgroundClass ??
        toneStyle?.backgroundClass ??
        'bg-surface-pastel-background-green',
      textClass:
        category.textClass ??
        toneStyle?.textClass ??
        'text-surface-pastel-foreground-green',
      icon: category.icon ?? toneStyle?.icon,
      iconColorClass:
        category.iconColorClass ??
        toneStyle?.iconColorClass ??
        category.textClass ??
        toneStyle?.textClass ??
        'text-surface-pastel-foreground-green',
    };
  });

  protected readonly schoolVm = computed(() => {
    const { school } = this.ticket();
    if (!school) {
      return null;
    }

    return {
      title: school.title,
      subtitle: school.subtitle,
    };
  });

  protected readonly assigneeVm = computed(() => {
    const assignee = this.ticket().assignee;
    if (!assignee) {
      return null;
    }

    const names = assignee.names ?? [assignee.name];
    const visibleCount = this.getVisibleCount(names);
    const visible = names.slice(0, visibleCount);
    const remaining = names.length - visibleCount;

    return {
      label: assignee.label,
      name: assignee.name,
      visible,
      remaining: remaining > 0 ? remaining : 0,
    };
  });

  private readonly maxCharBudget = 30;

  protected readonly footerProfilesVm = computed(() => {
    const profiles = this.ticket().footerProfiles;
    if (!profiles || profiles.length === 0) {
      return null;
    }

    const displayNames = profiles.map((p) => p.displayName);
    const visibleCount = this.getVisibleCount(displayNames);

    const visible = profiles.slice(0, visibleCount).map((profile, index) => ({
      id: `${profile.displayName}-${index}`,
      displayName: profile.displayName,
      imageUrl: profile.imageUrl ?? null,
      color: profile.color ?? UserProfileColors.NEUTRAL,
    }));

    const remaining = profiles.length - visibleCount;

    return {
      visible,
      remaining: remaining > 0 ? remaining : 0,
    };
  });

  private readonly separatorLength = 2; // ", "

  private getVisibleCount(names: readonly string[]): number {
    if (names.length <= 1) return names.length;

    let charCount = 0;
    let count = 0;

    for (const name of names) {
      const separator = count > 0 ? this.separatorLength : 0;
      if (
        count > 0 &&
        charCount + separator + name.length > this.maxCharBudget
      ) {
        break;
      }
      charCount += separator + name.length;
      count++;
    }

    return Math.max(1, count);
  }

  protected readonly menuVm = computed(() => {
    const ticket = this.ticket();
    if (ticket.isInitiatorTicket) {
      return null;
    }
    const items = ticket.menu ?? [];
    const visibleItems = items.filter((item) => item.visible !== false);
    if (visibleItems.length === 0) {
      return null;
    }

    return {
      icon: faEllipsisVertical,
      ariaLabel: 'Ticket actions',
      backgroundClass: 'bg-surface-action',
      iconColorClass: 'text-icon-high',
      items: visibleItems,
    };
  });

  protected onCardClick(): void {
    if (!this.selectable()) return;
    this.ticketSelected.emit(this.ticket());
  }

  protected onMenuItemSelected(item: PopupItem): void {
    const ticket = this.ticket();
    this.menuItemSelected.emit({ ticket, item });
  }

  protected onMenuOpened(): void {
    this.menuClick.emit(this.ticket());
  }
}
