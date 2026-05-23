import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import {
  faChevronLeft,
  faCircleInfo,
} from '@fortawesome/pro-regular-svg-icons';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { UserProfileColors } from '@shared/enums';
import { LayoutService } from '@layout/layout.service';
import type { DsIcon } from '@ds/icon/icon.component';

export interface SupportHubDetailHeaderConfig {
  readonly fullName: string;
  readonly role?: string | null;
  readonly avatarColor: UserProfileColors;
  readonly avatarUrl?: string | null;
  readonly avatarIcon?: DsIcon | null;
  readonly avatarIconCssClass?: string | null;
  readonly badgeText?: string | null;
  readonly canNavigateToProfile?: boolean;
  readonly title?: string | null;
  readonly subtitle?: string | null;
  readonly highlightBadges?: ReadonlyArray<string | null | undefined>;
  readonly showBackButton?: boolean;
  readonly showProfileButton?: boolean;
  readonly backLabel?: string | null;
  readonly profileLabel?: string | null;
}

@Component({
  selector: 'app-support-hub-detail-header',
  standalone: true,
  imports: [CommonModule, AvatarComponent, DsButtonComponent, DsIconComponent],
  templateUrl: './support-hub-detail-header.component.html',
})
export class SupportHubDetailHeaderComponent {
  private readonly layoutService = inject(LayoutService);
  readonly config = input.required<SupportHubDetailHeaderConfig>();

  readonly viewProfile = output<void>();
  readonly back = output<void>();

  protected readonly infoIcon = faCircleInfo;
  protected readonly backIcon = faChevronLeft;
  protected readonly isSplitView = computed(
    () => this.layoutService.windowClass() !== 'compact',
  );
  protected readonly showBackButton = computed(
    () => (this.config().showBackButton ?? true) && !this.isSplitView(),
  );
  protected readonly showProfileButton = computed(
    () => this.config().showProfileButton ?? true,
  );
  protected readonly title = computed(() => {
    const header = this.config();
    const candidate = (header.title ?? header.fullName ?? '').trim();
    return candidate.length ? candidate : '—';
  });
  protected readonly subtitle = computed<string | null>(() => {
    const header = this.config();
    const text = (header.subtitle ?? header.role ?? '').trim();
    return text.length ? text : null;
  });
  protected readonly avatarIcon = computed(
    () => this.config().avatarIcon ?? null,
  );
  protected readonly avatarIconCssClass = computed(
    () => this.config().avatarIconCssClass ?? null,
  );
  protected readonly highlightBadges = computed<string[]>(() => {
    const header = this.config();
    const highlights = (header.highlightBadges ?? [])
      .map((badge) => (badge ?? '').trim())
      .filter((badge): badge is string => badge.length > 0);

    if (highlights.length > 0) {
      return highlights;
    }

    const badgeText = (header.badgeText ?? '').trim();
    return badgeText.length ? [badgeText] : [];
  });
  protected readonly hasHighlightBadges = computed(
    () => this.highlightBadges().length > 0,
  );
  protected readonly canNavigateToProfile = computed(
    () => !!this.config().canNavigateToProfile,
  );
  protected readonly backLabel = computed(() => {
    const label = (this.config().backLabel ?? '').trim();
    return label.length ? label : 'Back to tickets';
  });
  protected readonly profileLabel = computed(() => {
    const label = (this.config().profileLabel ?? '').trim();
    return label.length ? label : 'View profile';
  });

  protected onViewProfile(): void {
    if (!this.canNavigateToProfile()) {
      return;
    }

    this.viewProfile.emit();
  }

  protected onBack(): void {
    this.back.emit();
  }
}
