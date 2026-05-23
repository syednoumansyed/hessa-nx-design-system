import { Component, computed, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { DsButtonComponent } from '@ds/button/button.component';
import { isMobile } from '@shared/utils/platform';
import { DsModalSize } from './modal.types';
import type { DsIcon } from '@ds/icon/icon.component';

export type DsButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'dangerStroke'
  | 'dangerFill';

export type DsButtonSize = 'sm' | 'md' | 'lg';

export interface DsModalFooterButton {
  text: string;
  variant?: DsButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  iconStart?: DsIcon;
  iconEnd?: DsIcon;
}

@Component({
  selector: 'ds-modal-footer',
  standalone: true,
  imports: [NgClass, DsButtonComponent],
  template: `
    <div class="gap-ds-md" [ngClass]="containerClass()">
      @if (stackButtons() && isMobile && primaryButton()) {
        <ds-button
          [variant]="primaryButton()!.variant ?? 'primary'"
          [size]="buttonSize()"
          [fullWidth]="true"
          [disabled]="primaryButton()!.disabled ?? false"
          [loading]="primaryButton()!.loading ?? false"
          [iconStart]="primaryButton()!.iconStart"
          [iconEnd]="primaryButton()!.iconEnd"
          (click)="primaryClick.emit()"
        >
          {{ primaryButton()!.text }}
        </ds-button>
      }
      @if (stackButtons() && isMobile && secondaryButton()) {
        <ds-button
          [variant]="secondaryButton()!.variant ?? 'secondary'"
          [size]="buttonSize()"
          [fullWidth]="true"
          [disabled]="secondaryButton()!.disabled ?? false"
          [loading]="secondaryButton()!.loading ?? false"
          [iconStart]="secondaryButton()!.iconStart"
          [iconEnd]="secondaryButton()!.iconEnd"
          (click)="secondaryClick.emit()"
        >
          {{ secondaryButton()!.text }}
        </ds-button>
      }
      @if (!(stackButtons() && isMobile) && secondaryButton()) {
        <ds-button
          [variant]="secondaryButton()!.variant ?? 'secondary'"
          [size]="buttonSize()"
          [fullWidth]="useFullWidthButtons()"
          [disabled]="secondaryButton()!.disabled ?? false"
          [loading]="secondaryButton()!.loading ?? false"
          [iconStart]="secondaryButton()!.iconStart"
          [iconEnd]="secondaryButton()!.iconEnd"
          [cssClass]="'min-w-[10rem] overflow-hidden'"
          (click)="secondaryClick.emit()"
        >
          <span class="truncate">{{ secondaryButton()!.text }}</span>
        </ds-button>
      }

      @if (!(stackButtons() && isMobile) && primaryButton()) {
        <ds-button
          [variant]="primaryButton()!.variant ?? 'primary'"
          [size]="buttonSize()"
          [fullWidth]="useFullWidthButtons()"
          [disabled]="primaryButton()!.disabled ?? false"
          [loading]="primaryButton()!.loading ?? false"
          [iconStart]="primaryButton()!.iconStart"
          [iconEnd]="primaryButton()!.iconEnd"
          [cssClass]="'min-w-[10rem] overflow-hidden'"
          (click)="primaryClick.emit()"
        >
          <span class="truncate">{{ primaryButton()!.text }}</span>
        </ds-button>
      }
    </div>
  `,
})
export class DsModalFooterComponent {
  readonly primaryButton = input<DsModalFooterButton>();
  readonly secondaryButton = input<DsModalFooterButton>();
  readonly buttonSize = input<DsButtonSize>('md');
  readonly modalSize = input<DsModalSize>('lg');
  readonly forceFullWidthButtons = input<boolean>(false);
  readonly stackButtons = input<boolean>(false);

  readonly primaryClick = output<void>();
  readonly secondaryClick = output<void>();

  protected readonly isMobile = isMobile();

  protected readonly hasBothButtons = computed(
    () => !!this.primaryButton() && !!this.secondaryButton(),
  );

  /**
   * Determines if buttons should be full width
   * - If fullWidth input is true, always use full width
   * - sm modal: always full width (50/50 if two buttons, 100% if one)
   * - lg modal: full width only on mobile
   */
  protected readonly useFullWidthButtons = computed(() => {
    return (
      this.forceFullWidthButtons() || this.modalSize() === 'sm' || this.isMobile
    );
  });

  /**
   * Container class for button layout
   * - If fullWidth is true: grid layout
   * - sm modal: always grid layout (50/50 or 100%)
   * - lg modal desktop: justify-end (buttons on right)
   * - lg modal mobile: grid layout (50/50 or 100%)
   */
  protected readonly containerClass = computed(() => {
    if (this.stackButtons()) {
      return 'flex flex-col';
    }

    const isSmallModal = this.modalSize() === 'sm';

    if (isSmallModal || this.isMobile || this.forceFullWidthButtons()) {
      // Grid layout: 2 columns if two buttons, 1 column if one button
      return this.hasBothButtons() ? 'grid grid-cols-2' : 'grid grid-cols-1';
    }

    // Large modal on desktop: buttons on right side
    return 'flex justify-end';
  });
}
