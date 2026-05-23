import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';
import { DsMobileListCardComponent } from './ds-mobile-list-card.component';
import {
  DsResponsiveColumn,
  DsRowAction,
  DsBulkAction,
  DsEmptyStateConfig,
  DsLoadMoreEvent,
  DsMobileItemContext,
  DsMobileFooterContext,
  DsSortState,
  DsSortableColumn,
} from '../ds-responsive-table.model';
import {
  NoDataCardComponent,
  NoDataFilterChip,
} from '@shared/components/no-data-card/no-data-card.component';
import { IPagination } from '@shared/interfaces/api.interface';
import { DsFilterPanelComponent } from '@ds/filter-panel/ds-filter-panel.component';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';
import { DsMobileSortButtonComponent } from './ds-mobile-sort-button.component';

@Component({
  selector: 'ds-mobile-list',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSpinner,
    DsMobileListCardComponent,
    NoDataCardComponent,
    DsFilterPanelComponent,
    DsMobileSortButtonComponent,
  ],
  host: {
    class: 'block h-full',
  },
  template: `
    <div class="relative flex h-full flex-col bg-surface-page">
      <!-- List content - ion-content always rendered for filters -->
      <ion-content #ionContent class="ds-mobile-list-content flex-1">
        <!-- Header prefix content - scrolls with list -->
        @if (headerPrefixTemplate()) {
          <ng-container *ngTemplateOutlet="headerPrefixTemplate()" />
        }

        <!-- Filters - sticky within the scrollable area (always shown) -->
        @if (filters().length > 0) {
          <div
            class="ds-mobile-sticky-filters sticky top-0 z-10 -mx-ds-xl bg-surface-page px-ds-xl py-ds-lg"
            [class.pt-ds-xl]="!headerPrefixTemplate()"
          >
            <app-ds-filter-panel
              [filters]="filters()"
              [selection]="filtersSelection()"
              (filtersChange)="onFiltersChangeInternal($event)"
            >
              <!-- Sort button - only show when sortable columns exist and showSortButton is true -->
              @if (showSortButton() && sortableColumns().length > 0) {
                <ds-mobile-sort-button
                  dsFilterPanelExtraButtons
                  [currentSort]="currentSort()"
                  (sortButtonClick)="sortButtonClick.emit()"
                />
              }
            </app-ds-filter-panel>
          </div>
        }

        <!-- Header suffix content - after filters, before list -->
        @if (headerSuffixTemplate()) {
          <ng-container *ngTemplateOutlet="headerSuffixTemplate()" />
        }

        @if (rowData().length === 0 && !loading()) {
          <!-- Empty state - shown inside scrollable area below filters -->
          @if (effectiveEmptyState(); as empty) {
            <div
              class="centered-flex flex-1 p-ds-xl"
              [class.pt-ds-xl]="
                !headerPrefixTemplate() && filters().length === 0
              "
            >
              <app-no-data-card
                [noBgStyle]="true"
                [mainImagePath]="empty.imagePath"
                [title]="empty.title"
                [description]="empty.description"
                [filteredBy]="filterChips()"
                [filteredByLabel]="empty.filteredByLabel"
                [clearFiltersButton]="
                  filterChips().length > 0
                    ? {
                        label: 'global.clear_filters.btn',
                        onAction: onClearFiltersClick.bind(this),
                      }
                    : undefined
                "
              />
            </div>
          }
        } @else {
          <div
            class="flex flex-col gap-ds-lg"
            [class.pt-ds-xl]="!headerPrefixTemplate() && filters().length === 0"
          >
            @for (
              item of rowData();
              track trackByFn($index, item);
              let i = $index
            ) {
              <ds-mobile-list-card
                [data]="item"
                [columns]="columns()"
                [actions]="rowActions()"
                [selected]="isRowSelected(item)"
                [selectionDisabled]="!isItemSelectable(item)"
                [index]="i"
                [showSelection]="showSelection()"
                [showMetadataBackground]="showMetadataBackground()"
                [itemTemplate]="itemTemplate()"
                [footerTemplate]="footerTemplate()"
                (selectionChange)="onRowSelectionChange(item, $event)"
                (actionClick)="onRowActionClick(item, $event)"
              />
            }
          </div>

          <!-- Infinite scroll -->
          <ion-infinite-scroll
            (ionInfinite)="onInfiniteScroll($event)"
            [disabled]="infiniteScrollDisabled()"
            class="mt-ds-xl"
          >
            <ion-infinite-scroll-content loadingSpinner="bubbles" />
          </ion-infinite-scroll>
        }
      </ion-content>

      <!-- Loading overlay -->
      @if (loading() && rowData().length === 0) {
        <div class="centered-flex absolute inset-0 z-10 bg-white/80">
          <ion-spinner name="bubbles" />
        </div>
      }
    </div>
  `,
  styles: `
    .ds-mobile-list-content {
      --padding-start: var(--ds-spacing-xl, 16px);
      --padding-end: var(--ds-spacing-xl, 16px);
      --padding-top: 0; /* Remove top padding so sticky filters stick closely to header */
      --padding-bottom: var(--ds-spacing-xl, 16px);
    }

    :host {
      display: block;
      height: 100%;
    }

    /* Sticky filters within ion-content scrollable area */
    .ds-mobile-sticky-filters {
      /* The negative margin compensates for ion-content padding so the sticky element spans full width */
      /* The sticky top-0 is relative to the scroll container (ion-content's inner scroll) */
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsMobileListComponent<T = Record<string, unknown>> {
  // ============================================================================
  // Inputs
  // ============================================================================

  /** Row data array */
  readonly rowData = input<T[]>([]);

  /** Column definitions */
  readonly columns = input<DsResponsiveColumn<T>[]>([]);

  /** Row actions */
  readonly rowActions = input<DsRowAction<T>[]>([]);

  /** Bulk actions (for determining if selection should be shown) */
  readonly bulkActions = input<DsBulkAction<T>[]>([]);

  /** Empty state configuration */
  readonly emptyState = input<DsEmptyStateConfig | null>(null);

  /** Filter chips to show in empty state */
  readonly filterChips = input<NoDataFilterChip[]>([]);

  /** Pagination info */
  readonly pagination = input<IPagination | null>(null);

  /** Loading state */
  readonly loading = input<boolean>(false);

  /** Whether to show metadata background */
  readonly showMetadataBackground = input<boolean>(true);

  /** Custom item template */
  readonly itemTemplate = input<TemplateRef<DsMobileItemContext<T>> | null>(
    null,
  );

  /** Custom footer template */
  readonly footerTemplate = input<TemplateRef<DsMobileFooterContext<T>> | null>(
    null,
  );

  /** Header prefix template - content to show at the top of the scrollable area */
  readonly headerPrefixTemplate = input<TemplateRef<unknown> | null>(null);

  /** Header suffix template - content to show after filters and before the list */
  readonly headerSuffixTemplate = input<TemplateRef<unknown> | null>(null);

  // ============================================================================
  // Filter Inputs
  // ============================================================================

  /** Filter configurations */
  readonly filters = input<DsFilterConfig[]>([]);

  /** Current filter values */
  readonly filtersSelection = input<DsFiltersValue>({});

  /** Sortable columns for the sort button */
  readonly sortableColumns = input<DsSortableColumn[]>([]);

  /** Current sort state */
  readonly currentSort = input<DsSortState | null>(null);

  /** Whether to show the sort button */
  readonly showSortButton = input<boolean>(true);

  /** Whether selection mode is active (checkboxes visible) */
  readonly selectionMode = input<boolean>(false);

  /** Callback to determine if a row can be selected. Rows that return false get a disabled checkbox. */
  readonly isRowSelectable = input<((row: T) => boolean) | null>(null);

  /** Track function for ngFor */
  readonly trackBy = input<(index: number, item: T) => unknown>(
    (index: number, item: T) =>
      (item as Record<string, unknown>)['id'] ?? index,
  );

  // ============================================================================
  // Outputs
  // ============================================================================

  /** Emitted when row selection changes */
  readonly selectionChanged = output<T[]>();

  /** Emitted when a row action is clicked */
  readonly rowActionClick = output<{ row: T; action: DsRowAction<T> }>();

  /** Emitted when more data needs to be loaded */
  readonly loadMore = output<DsLoadMoreEvent>();

  /** Emitted when clear filters is clicked */
  readonly clearFilters = output<void>();

  /** Emitted when filter values change */
  readonly filtersChange = output<DsFiltersValue>();

  /** Emitted when sort button is clicked */
  readonly sortButtonClick = output<void>();

  // ============================================================================
  // View Children
  // ============================================================================

  @ViewChild('ionContent') private ionContent?: IonContent;

  // ============================================================================
  // Internal State
  // ============================================================================

  /** Selected rows */
  private readonly selectedRows = signal<Set<T>>(new Set());

  /** Whether infinite scroll is disabled */
  protected readonly infiniteScrollDisabled = signal<boolean>(false);

  /** Pending infinite scroll event */
  private pendingScrollEvent: InfiniteScrollCustomEvent | null = null;

  // ============================================================================
  // Computed
  // ============================================================================

  /** Whether to show selection checkboxes - depends on selection mode being active */
  protected readonly showSelection = computed(() => {
    return this.selectionMode();
  });

  /** Effective empty state config with defaults */
  protected readonly effectiveEmptyState = computed(() => {
    const config = this.emptyState();
    if (!config) return null;
    return {
      imagePath:
        config.imagePath ?? 'assets/illustrations/no-search-result.svg',
      title: config.title ?? 'No results found',
      description: config.description ?? '',
      filteredByLabel: config.filteredByLabel ?? 'support.hub.filter.label',
    };
  });

  // ============================================================================
  // Methods
  // ============================================================================

  /** Track function wrapper */
  protected trackByFn(index: number, item: T): unknown {
    return this.trackBy()(index, item);
  }

  /** Check if a row is selectable (based on isRowSelectable callback) */
  protected isItemSelectable(row: T): boolean {
    const fn = this.isRowSelectable();
    if (!fn) return true;
    return fn(row);
  }

  /** Check if a row is selected */
  protected isRowSelected(row: T): boolean {
    return this.selectedRows().has(row);
  }

  /** Handle row selection change */
  protected onRowSelectionChange(row: T, selected: boolean): void {
    if (!this.isItemSelectable(row)) return;
    const current = new Set(this.selectedRows());
    if (selected) {
      current.add(row);
      // Re-checked — remove from exclusions
      this.excludedRows.delete(row);
    } else {
      current.delete(row);
      // Track as excluded so auto-select doesn't re-check it
      if (this.allSelectedMode) {
        this.excludedRows.add(row);
      }
    }
    this.selectedRows.set(current);
    this.selectionChanged.emit(Array.from(current));
  }

  /** Handle row action click */
  protected onRowActionClick(row: T, action: DsRowAction<T>): void {
    this.rowActionClick.emit({ row, action });
  }

  /** Handle infinite scroll event */
  protected onInfiniteScroll(event: InfiniteScrollCustomEvent): void {
    const pagination = this.pagination();
    if (!pagination) {
      event.target.complete();
      return;
    }

    const nextPage = pagination.pageNumber + 1;
    if (nextPage > pagination.totalPages) {
      event.target.disabled = true;
      this.infiniteScrollDisabled.set(true);
      return;
    }

    this.pendingScrollEvent = event;

    this.loadMore.emit({
      pageNumber: nextPage,
      itemsPerPage: pagination.itemsPerPage,
      complete: () => {
        this.pendingScrollEvent?.target.complete();
        this.pendingScrollEvent = null;
      },
      disable: () => {
        if (this.pendingScrollEvent) {
          this.pendingScrollEvent.target.disabled = true;
        }
        this.infiniteScrollDisabled.set(true);
        this.pendingScrollEvent = null;
      },
    });
  }

  /** Handle clear filters click */
  protected onClearFiltersClick(): void {
    this.clearFilters.emit();
  }

  /** Handle filter values change */
  protected onFiltersChangeInternal(value: DsFiltersValue): void {
    this.filtersChange.emit(value);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /** Get currently selected rows */
  public getSelectedRows(): T[] {
    return Array.from(this.selectedRows());
  }

  /** Clear all selections */
  public clearSelection(): void {
    this.allSelectedMode = false;
    this.excludedRows.clear();
    this.selectedRows.set(new Set());
    this.selectionChanged.emit([]);
  }

  /** Whether "select all across pages" mode is active */
  private allSelectedMode = false;

  /** Rows excluded from "select all" (user manually unchecked) */
  private excludedRows = new Set<T>();

  /** Select all selectable rows and enable auto-select for new rows */
  public selectAll(): void {
    this.allSelectedMode = true;
    this.excludedRows.clear();
    this.applySelectAll();
  }

  /** Apply select all to current rowData, respecting excluded rows */
  private applySelectAll(): void {
    const fn = this.isRowSelectable();
    const selectable = fn
      ? this.rowData().filter((row) => fn(row))
      : this.rowData();
    const all = new Set(
      selectable.filter((row) => !this.excludedRows.has(row)),
    );
    this.selectedRows.set(all);
    this.selectionChanged.emit(Array.from(all));
  }

  /** Auto-select new rows when they load during "select all" mode */
  private readonly autoSelectNewRows = effect(() => {
    const data = this.rowData(); // track rowData changes
    if (this.allSelectedMode && data.length > 0) {
      untracked(() => this.applySelectAll());
    }
  });

  /** Reset infinite scroll state */
  public resetInfiniteScroll(): void {
    this.infiniteScrollDisabled.set(false);
  }

  /** Scroll the list content to the top */
  public scrollToTop(): void {
    this.ionContent?.scrollToTop(300);
  }
}
