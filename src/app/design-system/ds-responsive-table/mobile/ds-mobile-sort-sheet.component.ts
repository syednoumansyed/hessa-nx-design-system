import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faXmark,
  faArrowUpLong,
  faArrowDownLong,
  faCheck,
} from '@fortawesome/pro-solid-svg-icons';
import {
  DsSortableColumn,
  DsSortDirection,
  DsSortState,
} from '../ds-responsive-table.model';

/**
 * Bottom sheet component for selecting sort column and direction
 * Opens when the mobile sort button is clicked
 */
@Component({
  selector: 'ds-mobile-sort-sheet',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div class="bg-black/50 fixed inset-0 z-[99]" (click)="onClose()"></div>

      <!-- Sheet -->
      <div
        class="pb-safe fixed inset-x-0 bottom-0 z-[100] rounded-t-3xl bg-surface-primary"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-stroke-mid px-ds-xl py-ds-lg"
        >
          <h3 class="text-ds-lg font-extrabold text-emphasis-high">
            {{ title() }}
          </h3>
          <button
            type="button"
            class="centered-flex h-8 w-8 cursor-pointer rounded-full border-none bg-surface-secondary text-emphasis-high"
            (click)="onClose()"
            aria-label="Close"
          >
            <app-ds-icon [icon]="closeIcon" size="md" />
          </button>
        </div>

        <!-- Sort options list -->
        <div class="flex max-h-[60vh] flex-col overflow-y-auto p-ds-xl">
          @for (column of columns(); track column.field) {
            <div class="border-b border-stroke-low last:border-b-0">
              <!-- Column name with sort direction options -->
              <div class="py-ds-md">
                <span class="text-ds-sm font-semibold text-emphasis-mid">
                  {{ column.label }}
                </span>
              </div>

              <!-- Sort direction buttons -->
              <div class="flex gap-ds-md pb-ds-lg">
                <!-- Ascending -->
                <button
                  type="button"
                  class="ds-sort-option"
                  [class.is-active]="isActive(column.field, 'asc')"
                  (click)="onSortSelect(column, 'asc')"
                >
                  <app-ds-icon [icon]="ascIcon" size="sm" />
                  <span>{{ ascendingLabel() }}</span>
                  @if (isActive(column.field, 'asc')) {
                    <app-ds-icon
                      [icon]="checkIcon"
                      size="sm"
                      class="ml-auto text-content-success"
                    />
                  }
                </button>

                <!-- Descending -->
                <button
                  type="button"
                  class="ds-sort-option"
                  [class.is-active]="isActive(column.field, 'desc')"
                  (click)="onSortSelect(column, 'desc')"
                >
                  <app-ds-icon [icon]="descIcon" size="sm" />
                  <span>{{ descendingLabel() }}</span>
                  @if (isActive(column.field, 'desc')) {
                    <app-ds-icon
                      [icon]="checkIcon"
                      size="sm"
                      class="ml-auto text-content-success"
                    />
                  }
                </button>
              </div>
            </div>
          }

          <!-- Clear sort button -->
          @if (currentSort()) {
            <button
              type="button"
              class="mt-ds-lg flex w-full cursor-pointer items-center justify-center gap-ds-sm rounded-ds-lg border-2 border-stroke-mid bg-transparent px-ds-lg py-ds-md text-ds-base font-semibold text-emphasis-high"
              (click)="onClearSort()"
            >
              {{ clearLabel() }}
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .ds-sort-option {
      display: flex;
      align-items: center;
      gap: var(--ds-spacing-sm, 6px);
      flex: 1;
      padding: var(--ds-spacing-md, 10px) var(--ds-spacing-lg, 14px);
      border: 2px solid var(--stroke-color-mid-emphasis, #e5e6e7);
      border-radius: var(--ds-corner-radius-md, 8px);
      background-color: transparent;
      color: var(--content-high-emphasis, #131517);
      font-size: var(--font-size-sm, 12px);
      font-weight: var(--font-weight-semibold, 600);
      cursor: pointer;
      transition: all 150ms ease;

      &:hover {
        background-color: var(--surface-secondary, #f5f5f5);
      }

      &.is-active {
        background-color: var(--surface-brand-surface-light, #f6f3fb);
        border-color: var(--stroke-color-brand-strong, #7c3ff1);
        color: var(--surface-pastel-foreground-brand, #7c3ff1);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsMobileSortSheetComponent {
  /** Whether the sheet is open */
  readonly open = input<boolean>(false);

  /** Title for the sheet */
  readonly title = input<string>('Sort by');

  /** Sortable columns */
  readonly columns = input<DsSortableColumn[]>([]);

  /** Current sort state */
  readonly currentSort = input<DsSortState | null>(null);

  /** Label for ascending sort */
  readonly ascendingLabel = input<string>('A to Z');

  /** Label for descending sort */
  readonly descendingLabel = input<string>('Z to A');

  /** Label for clear sort button */
  readonly clearLabel = input<string>('Clear sort');

  /** Emitted when sort is selected */
  readonly sortSelected = output<DsSortState>();

  /** Emitted when sort is cleared */
  readonly sortCleared = output<void>();

  /** Emitted when the sheet should close */
  readonly closeSheet = output<void>();

  protected readonly closeIcon = faXmark;
  protected readonly ascIcon = faArrowUpLong;
  protected readonly descIcon = faArrowDownLong;
  protected readonly checkIcon = faCheck;

  /** Check if a specific sort is currently active */
  protected isActive(field: string, direction: DsSortDirection): boolean {
    const current = this.currentSort();
    return current?.field === field && current?.direction === direction;
  }

  protected onSortSelect(
    column: DsSortableColumn,
    direction: DsSortDirection,
  ): void {
    this.sortSelected.emit({ field: column.field, direction });
    this.closeSheet.emit();
  }

  protected onClearSort(): void {
    this.sortCleared.emit();
    this.closeSheet.emit();
  }

  protected onClose(): void {
    this.closeSheet.emit();
  }
}
