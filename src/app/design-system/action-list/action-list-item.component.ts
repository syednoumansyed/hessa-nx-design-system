import { Component, input, output, computed } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import {
  DsActionListItemConfig,
  DsActionListItemSupportingTextConfig,
} from './action-list.interface';
import {
  faCheckCircle,
  faChevronRight,
} from '@fortawesome/pro-regular-svg-icons';
import { faCheckCircle as faCheckCircleSolid } from '@fortawesome/pro-solid-svg-icons';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
import { NgClass } from '@angular/common';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

@Component({
  selector: 'ds-action-list-item',
  standalone: true,
  imports: [AvatarComponent, DsIconComponent, NgClass, DsTranslatePipe],
  template: `
    <div
      class="flex items-center rounded-ds-xl border-4 p-ds-xl"
      [ngClass]="containerClasses()"
      [attr.data-testid]="'ds-list-item-' + (config().id || 'default')"
      [attr.data-active]="isActive()"
      (click)="onItemClick()"
    >
      <!-- Avatar Section -->
      @if (config().avatar) {
        <div class="me-3 flex-shrink-0">
          <app-ds-avatar
            [fullName]="avatarName()"
            [imageUrl]="avatarImageUrl()"
            size="sm"
          />
        </div>
      }

      <!-- Content Section -->
      <div class="min-w-0 flex-1">
        <!-- Upper Supporting Text -->
        @if (config().upperSupportingText) {
          <p class="single-line-caption-mid-emphasis text-emphasis-mid">
            {{ config().upperSupportingText | dsTranslate }}
          </p>
        }

        <!-- Main Title -->
        <p class="content-md-high-emphasis truncate text-emphasis-high">
          {{ config().title | dsTranslate }}
        </p>

        <!-- Supporting Text with Icon and Count -->
        @if (supportingTextItems().length) {
          <div class="flex gap-ds-md">
            @for (supporting of supportingTextItems(); track supporting) {
              <div class="flex items-center gap-1">
                <!-- Icon -->
                @if (supporting.icon) {
                  <app-ds-icon
                    [icon]="supporting.icon"
                    [class]="getSupportingIconClass(supporting)"
                    class="h-4 w-4"
                  />
                }

                <!-- Text -->
                <span
                  class="single-line-Caption-mid-emphasis"
                  [class]="getSupportingTextClass(supporting)"
                >
                  {{ supporting.text | dsTranslate }}
                </span>

                <!-- Count Badge -->
                @if (supporting.count !== undefined) {
                  <span
                    class="single-line-caption-high-emphasis inline-flex h-4 min-w-4 items-center justify-center rounded-full px-[2px] text-surface-on-notification-badge"
                    [class]="getSupportingCountClass(supporting)"
                  >
                    {{ supporting.count }}
                  </span>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Arrow -->
      @if (showArrow()) {
        <div
          class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full p-1"
          [ngClass]="[
            endIconCssClass(),
            shouldRotateIcon() ? 'rtl:rotate-180' : ''
          ]"
        >
          <app-ds-icon [icon]="endIcon()" [size]="endIconSize()" />
        </div>
      }
    </div>
  `,
})
export class DsActionListItemComponent {
  config = input.required<DsActionListItemConfig>();
  disabled = input<boolean>(false);
  active = input<boolean>(false);
  itemClick = output<DsActionListItemConfig>();

  protected readonly faChevronRight = faChevronRight;
  protected readonly faCheckCircle = faCheckCircle;
  protected readonly faCheckCircleSolid = faCheckCircleSolid;

  readonly isActive = computed(() => {
    return this.active() || this.config().isActive;
  });
  readonly showArrow = computed(() => {
    const { showArrow } = this.endIconConfig() || {};
    return !!showArrow;
  });

  readonly avatarName = computed(() => {
    return this.config().avatar?.fullName || this.config().title || '';
  });

  readonly avatarImageUrl = computed(() => {
    return this.config().avatar?.imageUrl || null;
  });

  readonly endIconConfig = computed(() => {
    return this.config().endIconConfig;
  });

  readonly shouldRotateIcon = computed(() => {
    return !this.endIconConfig()?.disableRtlRotate;
  });

  readonly endIconSize = computed(() => {
    return this.endIconConfig()?.size ?? 16;
  });

  readonly endIcon = computed((): DsIcon => {
    const iconConfig = this.endIconConfig();
    if (iconConfig?.icon) {
      return iconConfig.icon;
    }
    return this.faChevronRight;
  });

  readonly endIconCssClass = computed(() => {
    const cfg = this.endIconConfig();
    if (!cfg) return '';
    if (!cfg.icon) return 'bg-pastels-purple-200';
    return cfg.cssClass ?? ''; // always return a string
  });

  readonly supportingTextItems = computed(
    (): DsActionListItemSupportingTextConfig[] => {
      const supporting = this.config().supportingText;
      if (!supporting) {
        return [];
      }
      return Array.isArray(supporting) ? supporting : [supporting];
    },
  );

  // New computed classes (replaces previous inline ngClass object)
  readonly containerClasses = computed(() => {
    const c = this.config();
    const classes: string[] = [];

    // Border logic (unchanged)
    if (this.isActive() && !c.showActiveBorder) {
      classes.push('border-stroke-brand-light');
    }
    if (c.showActiveBorder) {
      classes.push('border-indigo-200');
    }
    if (!c.showActiveBorder && !this.isActive()) {
      classes.push('border-black-04');
    }

    // Background logic with bgColor override when not active
    if (c.showActiveBg) {
      classes.push('bg-indigo-50');
    } else if (this.isActive() && !c.showActiveBg) {
      classes.push('bg-surface-brand-subtle');
    } else if (!this.isActive()) {
      classes.push(c.bgColor ? `bg-${c.bgColor}` : 'bg-surface-secondary');
    }

    return classes;
  });

  getSupportingIconClass(item?: DsActionListItemSupportingTextConfig): string {
    const variant = item?.variant ?? 'default';

    switch (variant) {
      case 'success':
        return 'text-neutral-cool-500';
      case 'danger':
        return 'text-icon-error';
      default:
        return 'text-gray-500';
    }
  }

  getSupportingTextClass(item?: DsActionListItemSupportingTextConfig): string {
    const variant = item?.variant ?? 'default';

    switch (variant) {
      case 'success':
        return 'text-content-success';
      case 'danger':
        return 'text-content-error';
      default:
        return 'text-gray-600';
    }
  }

  getSupportingCountClass(item?: DsActionListItemSupportingTextConfig): string {
    const variant = item?.variant ?? 'default';

    switch (variant) {
      case 'success':
        return 'bg-surface-success';
      case 'danger':
        return 'bg-surface-notification-badge';
      default:
        return 'bg-gray-500';
    }
  }

  onItemClick(): void {
    if (!this.disabled()) {
      this.itemClick.emit(this.config());
    }
  }
}
