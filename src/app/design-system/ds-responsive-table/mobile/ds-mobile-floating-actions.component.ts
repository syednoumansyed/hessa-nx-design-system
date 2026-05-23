import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIcon } from '@ds/icon/icon.component';
import { faPlus, faEllipsisVertical } from '@fortawesome/pro-solid-svg-icons';
import { DsBulkAction } from '../ds-responsive-table.model';

/**
 * Primary action configuration for mobile floating button
 */
export interface MobilePrimaryAction {
  label: string;
  icon?: DsIcon;
  action?: () => void;
}

/**
 * Floating action buttons for mobile view
 * Shows primary action button and bulk actions menu trigger
 */
@Component({
  selector: 'ds-mobile-floating-actions',
  standalone: true,
  imports: [CommonModule, DsButtonComponent],
  template: `
    <div
      class="fixed z-50 flex flex-col items-end gap-ds-md"
      style="bottom: calc(var(--ds-spacing-xl, 16px) + env(safe-area-inset-bottom, 0px)); inset-inline-end: var(--ds-spacing-xl, 16px)"
    >
      <!-- Bulk actions button (three dots) -->
      @if (bulkActions().length > 0) {
        <ds-button
          variant="secondary"
          size="lg"
          [iconStart]="ellipsisIcon"
          cssClass="!min-w-[54px]"
          (click)="onBulkActionsClick()"
          [title]="'Bulk actions'"
        ></ds-button>
      }

      <!-- Primary action button -->
      @if (primaryAction(); as action) {
        <ds-button
          variant="primary"
          size="lg"
          [iconStart]="action.icon ?? plusIcon"
          cssClass="!min-w-[54px]"
          (click)="onPrimaryActionClick(action)"
          [title]="action.label"
        ></ds-button>
      }
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsMobileFloatingActionsComponent<T = unknown> {
  /** Primary action configuration */
  readonly primaryAction = input<MobilePrimaryAction | null>(null);

  /** Bulk actions available */
  readonly bulkActions = input<DsBulkAction<T>[]>([]);

  /** Emitted when primary action is clicked */
  readonly primaryActionClick = output<MobilePrimaryAction>();

  /** Emitted when bulk actions menu should open */
  readonly bulkActionsMenuClick = output<void>();

  protected readonly plusIcon = faPlus;
  protected readonly ellipsisIcon = faEllipsisVertical;

  protected onPrimaryActionClick(action: MobilePrimaryAction): void {
    this.primaryActionClick.emit(action);
    action.action?.();
  }

  protected onBulkActionsClick(): void {
    this.bulkActionsMenuClick.emit();
  }
}
