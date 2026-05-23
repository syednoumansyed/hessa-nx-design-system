import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { DsBulkAction, DsBulkActionEvent } from '../ds-responsive-table.model';

@Component({
  selector: 'ds-mobile-bulk-actions-bar',
  standalone: true,
  imports: [CommonModule, DsIconComponent, DsButtonComponent],
  template: `
    @if (visible()) {
      <div
        class="ds-bulk-actions-bar pb-safe-lg fixed inset-x-0 bottom-0 z-[100] bg-[#312431] p-ds-xl"
      >
        <div class="flex items-center gap-ds-lg">
          <div class="flex flex-1 flex-wrap items-center gap-ds-md">
            <span
              class="single-line-sm-high-emphasis whitespace-nowrap text-content-high-inverse"
            >
              {{ selectionCount() }} {{ selectedLabel() }}
              {{ selectedSuffix() }}
            </span>
            @if (allSelected()) {
              <button
                type="button"
                class="cursor-pointer border-none bg-transparent p-ds-md text-ds-base font-extrabold text-brand-200 underline"
                (click)="onDeselectAllClick()"
              >
                {{ deselectAllLabel() }}
              </button>
            } @else if (selectableCount() > 0) {
              <button
                type="button"
                class="cursor-pointer border-none bg-transparent p-ds-md text-ds-base font-extrabold text-brand-200 underline"
                (click)="onSelectAllClick()"
              >
                {{ selectAllLabel() }}
              </button>
            }

            <!-- Show only the active action button -->
            @if (activeAction(); as action) {
              <ds-button
                [variant]="'tertiary'"
                [size]="'sm'"
                [disabled]="isActionDisabled(action)"
                (click)="onActionClick(action)"
              >
                {{ action.label }}
              </ds-button>
            }
          </div>

          <button
            type="button"
            class="centered-flex h-6 w-6 shrink-0 cursor-pointer border-none bg-transparent p-0 text-content-high-inverse"
            (click)="onCloseClick()"
            aria-label="Close selection"
          >
            <app-ds-icon [icon]="closeIcon" size="lg" />
          </button>
        </div>
      </div>
    }
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsMobileBulkActionsBarComponent<T = unknown> {
  /** Number of selected items */
  readonly selectionCount = input<number>(0);

  /** Total number of items (for select all) */
  readonly totalCount = input<number>(0);

  /** Number of selectable items (respects isRowSelectable) */
  readonly selectableCount = input<number>(0);

  /** Selected rows */
  readonly selectedRows = input<T[]>([]);

  /** The currently active/selected bulk action */
  readonly activeAction = input<DsBulkAction<T> | null>(null);

  /** Label for "Selected" text */
  readonly selectedLabel = input<string>('Selected');

  /** Label for "Select all" button */
  readonly selectAllLabel = input<string>('Select all');

  /** Emitted when an action is clicked */
  readonly actionClick = output<DsBulkActionEvent<T>>();

  /** Emitted when select all is clicked */
  readonly selectAll = output<void>();

  /** Emitted when deselect all is clicked */
  readonly deselectAll = output<void>();

  /** Emitted when close is clicked */
  readonly close = output<void>();

  /** Close icon */
  protected readonly closeIcon = faCircleXmark;

  /** "selected" suffix label */
  private readonly translationService = inject(DS_TRANSLATION_TOKEN);
  readonly selectedSuffix = input<string>(
    this.translationService.translate('global.selected.txt'),
  );

  /** Deselect all label */
  readonly deselectAllLabel = input<string>('Deselect all');

  /** Whether the bar should be visible - now depends on having an active action */
  protected readonly visible = computed(() => {
    return this.activeAction() !== null;
  });

  /** Whether all rows (across pages) are selected — set by parent */
  readonly allSelected = input(false);

  /** Check if an action is disabled */
  protected isActionDisabled(action: DsBulkAction<T>): boolean {
    // Check disabled property (supports both boolean and function)
    if (action.disabled !== undefined) {
      const isDisabled =
        typeof action.disabled === 'function'
          ? action.disabled(this.selectedRows())
          : action.disabled;
      if (isDisabled) return true;
    }

    // Check disabledReason as fallback
    if (typeof action.disabledReason === 'function') {
      return !!action.disabledReason(this.selectedRows());
    }
    return !!action.disabledReason;
  }

  protected onActionClick(action: DsBulkAction<T>): void {
    this.actionClick.emit({
      action,
      rows: this.selectedRows(),
    });
    action.action?.(this.selectedRows());
  }

  protected onSelectAllClick(): void {
    this.selectAll.emit();
  }

  protected onDeselectAllClick(): void {
    this.deselectAll.emit();
  }

  protected onCloseClick(): void {
    this.close.emit();
  }
}
