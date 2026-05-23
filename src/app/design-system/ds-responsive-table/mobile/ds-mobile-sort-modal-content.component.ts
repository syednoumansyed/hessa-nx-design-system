import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  faArrowUpLong,
  faArrowDownLong,
  faCheck,
} from '@fortawesome/pro-solid-svg-icons';
import {
  DsSortableColumn,
  DsSortDirection,
  DsSortState,
} from '../ds-responsive-table.model';
import { DsModalContentProps } from '@ds/modal/modal.types';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';

/**
 * Modal content component for sort selection
 * Used with DsModalService - receives closeModal function via props
 */
@Component({
  selector: 'ds-mobile-sort-modal-content',
  standalone: true,
  imports: [CommonModule, DsIconComponent, DsButtonComponent],
  template: `
    <!-- Sort options list -->
    <div class="flex flex-col">
      @for (column of columns(); track column.field) {
        <div class="border-b border-stroke-low last:border-b-0">
          <!-- Column name -->
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
                  class="ml-auto text-surface-pastel-foreground-brand"
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
                  class="ml-auto text-surface-pastel-foreground-brand"
                />
              }
            </button>
          </div>
        </div>
      }
    </div>
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
export class DsMobileSortModalContentComponent implements DsModalContentProps {
  private readonly translationService = inject(DS_TRANSLATION_TOKEN);

  /** Sortable columns - passed from componentProps */
  readonly columns = input<DsSortableColumn[]>([]);

  /** Current sort state - passed from componentProps */
  readonly currentSort = input<DsSortState | null>(null);

  /** Label for ascending sort — auto-localized based on active language */
  readonly ascendingLabel = computed(() =>
    this.translationService.getActiveLang() === 'ar' ? 'أ إلى ي ↑' : 'A to Z ↑',
  );

  /** Label for descending sort — auto-localized based on active language */
  readonly descendingLabel = computed(() =>
    this.translationService.getActiveLang() === 'ar' ? 'ي إلى أ ↓' : 'Z to A ↓',
  );

  /** Close modal function - injected by DsModalService */
  closeModal!: (data?: unknown, role?: string) => void;

  protected readonly ascIcon = faArrowUpLong;
  protected readonly descIcon = faArrowDownLong;
  protected readonly checkIcon = faCheck;

  /** Track selected sort locally (for UI feedback before closing) */
  protected readonly selectedSort = computed(() => this.currentSort());

  /** Check if a specific sort is currently active */
  protected isActive(field: string, direction: DsSortDirection): boolean {
    const current = this.currentSort();
    return current?.field === field && current?.direction === direction;
  }

  protected onSortSelect(
    column: DsSortableColumn,
    direction: DsSortDirection,
  ): void {
    const sortState: DsSortState = { field: column.field, direction };
    this.closeModal(sortState, 'sort');
  }

  protected onClearSort(): void {
    this.closeModal(null, 'clear');
  }
}
