import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChild,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@layout/layout.service';
import {
  IPagination,
  IPaginationParams,
} from '@shared/interfaces/api.interface';
import { NoDataFilterChip } from '@shared/components/no-data-card/no-data-card.component';
import {
  DsResponsiveTableConfig,
  DsRowAction,
  DsBulkAction,
  DsBulkActionEvent,
  DsLoadMoreEvent,
  DsSortState,
  DsSortChangeEvent,
  DsSortableColumn,
  DsDataSourceRequest,
  getSortableColumns,
} from './ds-responsive-table.model';
import { DsMobileListComponent } from './mobile/ds-mobile-list.component';
import { DsMobileBulkActionsBarComponent } from './mobile/ds-mobile-bulk-actions-bar.component';
import { DsMobileFloatingActionsComponent } from './mobile/ds-mobile-floating-actions.component';
import { DsResponsiveMenuSheetComponent } from '../popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '../popup/types/popup.interface';
import { DsMobileSortButtonComponent } from './mobile/ds-mobile-sort-button.component';
import { DsMobileSortModalContentComponent } from './mobile/ds-mobile-sort-modal-content.component';
import { DsAgGridTableComponent } from '../ag-grid-table/ds-ag-grid-table.component';
import {
  DsAgGridTableConfig,
  DsAgGridBulkAction,
  DsAgGridColDef,
  DsSelectionState,
} from '../ag-grid-table/ds-ag-grid-table.model';
import {
  ColDef,
  SizeColumnsToFitGridStrategy,
  SizeColumnsToFitProvidedWidthStrategy,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import {
  DsAgGridCellRendererComponent,
  DsCellRendererParams,
} from '../ag-grid-table/ds-ag-grid-cell-renderer.component';
import { DsAgGridActionButtonCellComponent } from '../ag-grid-table/ds-ag-grid-action-button-cell.component';
import { DsFilterPanelComponent } from '@ds/filter-panel/ds-filter-panel.component';
import {
  DsDateFilterConfig,
  DsDateRangeFilterConfig,
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';
import { DsModalService } from '@ds/modal/modal.service';
import { DsResponsiveTableStateService } from './ds-responsive-table-state.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';

/**
 * Directive for header prefix content projection.
 * Usage: <ng-template dsHeaderPrefix>...</ng-template>
 */
@Directive({
  selector: '[dsHeaderPrefix]',
  standalone: true,
})
export class DsHeaderPrefixDirective {
  constructor(public templateRef: TemplateRef<unknown>) {}
}

/**
 * Directive for header suffix content projection.
 * Usage: <ng-template dsHeaderSuffix>...</ng-template>
 */
@Directive({
  selector: '[dsHeaderSuffix]',
  standalone: true,
})
export class DsHeaderSuffixDirective {
  constructor(public templateRef: TemplateRef<unknown>) {}
}

@Component({
  selector: 'ds-responsive-table',
  standalone: true,
  imports: [
    CommonModule,
    DsMobileListComponent,
    DsMobileBulkActionsBarComponent,
    DsMobileFloatingActionsComponent,
    DsMobileSortButtonComponent,
    DsAgGridTableComponent,
    DsFilterPanelComponent,
  ],
  template: `
    <div class="flex h-full min-h-0 w-full flex-col">
      @if (isMobileView()) {
        <!-- Mobile View -->
        <div class="flex h-full flex-col">
          <!-- Mobile list with prefix content, filters, and list - all in scrollable area -->
          <ds-mobile-list
            class="min-h-0 flex-1"
            #mobileList
            [rowData]="effectiveRowData()"
            [columns]="responsiveColumns()"
            [rowActions]="rowActions()"
            [bulkActions]="bulkActions()"
            [emptyState]="config().emptyState ?? null"
            [filterChips]="activeFilterChips()"
            [pagination]="effectivePagination()"
            [loading]="effectiveLoading()"
            [showMetadataBackground]="
              config().mobile?.showMetadataBackground ?? true
            "
            [itemTemplate]="config().mobile?.itemTemplate ?? null"
            [footerTemplate]="config().mobile?.footerTemplate ?? null"
            [selectionMode]="selectionMode()"
            [isRowSelectable]="config().selection?.isRowSelectable ?? null"
            [headerPrefixTemplate]="headerPrefixTemplate?.templateRef ?? null"
            [headerSuffixTemplate]="headerSuffixTemplate?.templateRef ?? null"
            [filters]="effectiveFilters()"
            [filtersSelection]="effectiveFiltersSelection()"
            [sortableColumns]="sortableColumns()"
            [currentSort]="currentSort()"
            [showSortButton]="showMobileSortButton()"
            (selectionChanged)="onMobileSelectionChanged($event)"
            (rowActionClick)="onMobileRowActionClick($event)"
            (loadMore)="onLoadMore($event)"
            (clearFilters)="onClearFilters()"
            (filtersChange)="onFiltersChange($event)"
            (sortButtonClick)="onSortButtonClick()"
          />

          <!-- Floating action buttons - only show when not in selection mode -->
          @if (!selectionMode()) {
            <ds-mobile-floating-actions
              [primaryAction]="config().mobile?.primaryAction ?? null"
              [bulkActions]="showSelectionUI() ? bulkActions() : []"
              (primaryActionClick)="onPrimaryActionClick($event)"
              (bulkActionsMenuClick)="onBulkActionsMenuClick()"
            />
          }

          <!-- Bulk actions bar - shows only when in selection mode with active action and selection UI is enabled -->
          @if (showSelectionUI()) {
            <ds-mobile-bulk-actions-bar
              [selectionCount]="
                mobileAllPagesSelected()
                  ? selectableItemCount() - mobileExcludedIds().length
                  : selectedRows().length
              "
              [totalCount]="totalItemCount()"
              [selectableCount]="selectableItemCount()"
              [selectedRows]="selectedRows()"
              [activeAction]="activeAction()"
              [selectedLabel]="selectionEntityLabel()"
              [selectAllLabel]="selectAllLabel()"
              [allSelected]="
                mobileAllPagesSelected() && mobileExcludedIds().length === 0
              "
              (actionClick)="onBulkActionClick($event)"
              (selectAll)="onSelectAll()"
              (deselectAll)="onDeselectAll()"
              (close)="onCloseSelection()"
            />
          }
        </div>
      } @else {
        <!-- Desktop View (AG Grid Table) -->
        <app-ds-ag-grid-table
          class="w-full flex-1"
          [config]="tableConfig()"
          [rowData]="effectiveRowData()"
          [serverSideSort]="!!config().dataSource"
          [pagination]="effectivePagination()"
          [filters]="effectiveFilters()"
          [filtersSelection]="effectiveFiltersSelection()"
          [emptyState]="config().emptyState ?? null"
          [loading]="effectiveLoading()"
          [isGridInitialized]="effectiveGridInitialized()"
          [selectionColumnEnabled]="showSelectionUI()"
          [selectionLabel]="
            config().selection?.selectionLabel ??
            translationService.translate('global.select_items_to.txt')
          "
          [selectionEntityLabel]="selectionEntityLabel()"
          [showZoom]="config().table?.showZoom !== false"
          [showPagination]="config().table?.showPagination !== false"
          [showCustomizeColumns]="true"
          [defaultColDef]="effectiveTableDefaultColDef()"
          [autoSizeStrategy]="effectiveAutoSizeStrategy()"
          [persistState]="config().persistState ?? true"
          [isRowSelectable]="config().selection?.isRowSelectable ?? null"
          (selectionChanged)="onTableSelectionChanged($event)"
          (selectionStateChanged)="selectionStateChanged.emit($event)"
          (paginationChanged)="onPaginationChange($event)"
          (filtersChange)="onFiltersChange($event)"
          (bulkActionClick)="onBulkActionClick($event)"
          (closeSelection)="onCloseSelection()"
          (clearFilters)="onClearFilters()"
          [rowClickable]="config().table?.rowClickable === true"
          (rowClicked)="onRowClick($event)"
          (sortChanged)="onAgGridSortChanged($event)"
        >
          <!-- Pass through content projections to ag-grid-table -->
          @if (headerPrefixTemplate) {
            <div dsAgGridHeaderPrefix class="contents">
              <ng-container
                *ngTemplateOutlet="headerPrefixTemplate.templateRef"
              />
            </div>
          }
          @if (headerSuffixTemplate) {
            <div dsAgGridHeaderSuffix class="contents">
              <ng-container
                *ngTemplateOutlet="headerSuffixTemplate.templateRef"
              />
            </div>
          }
          <div dsAgGridFooter class="contents">
            <ng-content select="[dsFooter]" />
          </div>
        </app-ds-ag-grid-table>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      width: 100%;
      min-height: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsResponsiveTableComponent<T = Record<string, unknown>> {
  // ============================================================================
  // Content Children (for template-based content projection)
  // ============================================================================

  /** Header prefix template - allows same content in both mobile and desktop */
  @ContentChild(DsHeaderPrefixDirective)
  headerPrefixTemplate?: DsHeaderPrefixDirective;

  /** Header suffix template - allows same content in both mobile and desktop */
  @ContentChild(DsHeaderSuffixDirective)
  headerSuffixTemplate?: DsHeaderSuffixDirective;

  // ============================================================================
  // Inputs
  // ============================================================================

  /** Main configuration object */
  readonly config = input.required<DsResponsiveTableConfig<T>>();

  /** Row data */
  readonly rowData = input<T[]>([]);

  /** Pagination info */
  readonly pagination = input<IPagination | null>(null);

  /** Filter configurations */
  readonly filters = input<DsFilterConfig[]>([]);

  /** Current filter values */
  readonly filtersSelection = input<DsFiltersValue>({});

  /** Loading state */
  readonly loading = input<boolean>(false);

  // ============================================================================
  // Outputs
  // ============================================================================

  /** Selection change */
  readonly selectionChanged = output<T[]>();

  /** Pagination change (for desktop) */
  readonly paginationChanged = output<IPaginationParams>();

  /** Load more (for mobile infinite scroll) */
  readonly loadMore = output<DsLoadMoreEvent>();

  /** Filters change */
  readonly filtersChange = output<DsFiltersValue>();

  /** Clear filters */
  readonly clearFilters = output<void>();

  /** Bulk action click */
  readonly bulkActionClick = output<DsBulkActionEvent<T>>();

  /** Row click */
  readonly rowClicked = output<T>();

  /** Row action click */
  readonly rowActionClick = output<{ row: T; action: DsRowAction<T> }>();

  /** Sort change (mobile only) */
  readonly sortChanged = output<DsSortChangeEvent>();

  /** Cross-page selection state (all-selected vs some-selected with IDs) */
  readonly selectionStateChanged = output<DsSelectionState>();

  // ============================================================================
  // View Children
  // ============================================================================

  @ViewChild('mobileList')
  private mobileList?: DsMobileListComponent<T>;

  @ViewChild(DsAgGridTableComponent)
  private agGridTable?: DsAgGridTableComponent;

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly layoutService = inject(LayoutService);
  private readonly modalService = inject(DsModalService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tableStateService = inject(DsResponsiveTableStateService);
  private readonly toasterService = inject(HesToasterService);
  protected readonly translationService = inject(DS_TRANSLATION_TOKEN);

  /** Whether we're on mobile/tablet portrait (viewport < 992px) - shows mobile list */
  /** Tablet landscape (≥992px) and desktop show AG Grid table */
  protected readonly isMobileView = this.layoutService.isMobileOrTablet;

  /** Selected rows */
  protected readonly selectedRows = signal<T[]>([]);

  /** Whether "select all across pages" is active on mobile */
  protected readonly mobileAllPagesSelected = signal(false);

  /** IDs excluded from "select all" (unchecked after select all) */
  protected readonly mobileExcludedIds = signal<string[]>([]);

  /** Whether mobile selection mode is active */
  protected readonly selectionMode = signal<boolean>(false);

  /** Currently active bulk action (selected from the sheet) */
  protected readonly activeAction = signal<DsBulkAction<T> | null>(null);

  /** Current sort state */
  protected readonly currentSort = signal<DsSortState | null>(null);

  /** Last sort state that produced a successful API response.
   *  Used to revert when the backend rejects a sort column. */
  private readonly lastSuccessfulSort = signal<DsSortState | null>(null);

  /** Guard flag: skip onAgGridSortChanged while we programmatically revert sort */
  private _isRevertingSort = false;

  // --- DataSource mode internal state ---
  /** Internal filter values (used when dataSource is provided) */
  private readonly internalFiltersSelection = signal<DsFiltersValue>({});

  /** Internal row data (populated by dataSource) */
  private readonly internalRowData = signal<T[]>([]);

  /** Internal pagination (populated by dataSource) */
  private readonly internalPagination = signal<IPagination | null>(null);

  /** Internal loading state (managed when dataSource is provided) */
  private readonly internalLoading = signal<boolean>(false);

  /** Whether the grid has been initialized (first API call completed) */
  protected readonly isGridInitialized = signal<boolean>(false);

  /** Whether initial filters have been seeded and first fetch can proceed */
  private readonly _readyToFetch = signal(false);

  /** Current page number for dataSource requests */
  private readonly currentPage = signal<number>(1);

  /** User-selected per page (null = use viewport default) */
  private readonly userSelectedPerPage = signal<number | null>(null);

  /** Items per page - user selection takes priority, otherwise 30 for desktop / 10 for mobile */
  private readonly currentPerPage = computed(
    () => this.userSelectedPerPage() ?? (this.isMobileView() ? 10 : 30),
  );

  /** Whether dataSource mode is active */
  private readonly isDataSourceMode = computed(
    () => !!this.config().dataSource,
  );

  // ============================================================================
  // Computed - Effective values (choose between input and internal based on mode)
  // ============================================================================

  /** Effective filters - from config or input */
  protected readonly effectiveFilters = computed<DsFilterConfig[]>(
    () => this.config().filters ?? this.filters(),
  );

  /** Effective filter selection - internal when dataSource mode, input otherwise */
  protected readonly effectiveFiltersSelection = computed<DsFiltersValue>(() =>
    this.isDataSourceMode()
      ? this.internalFiltersSelection()
      : this.filtersSelection(),
  );

  /** Effective row data - internal when dataSource mode, input otherwise */
  protected readonly effectiveRowData = computed<T[]>(() =>
    this.isDataSourceMode() ? this.internalRowData() : this.rowData(),
  );

  /** Effective pagination - internal when dataSource mode, input otherwise */
  protected readonly effectivePagination = computed<IPagination | null>(() =>
    this.isDataSourceMode() ? this.internalPagination() : this.pagination(),
  );

  /** Effective loading state - internal when dataSource mode, input otherwise */
  protected readonly effectiveLoading = computed<boolean>(() =>
    this.isDataSourceMode() ? this.internalLoading() : this.loading(),
  );

  /**
   * Effective grid initialized state.
   * In dataSource mode: uses internal tracking after first API call.
   * In non-dataSource mode: considers grid initialized when not loading (external data management complete).
   */
  protected readonly effectiveGridInitialized = computed<boolean>(() => {
    if (this.isDataSourceMode()) {
      return this.isGridInitialized();
    }
    // In non-dataSource mode, consider initialized when not loading
    // This allows consumers to show table structure with empty overlay after their data fetch completes
    return !this.loading();
  });

  // ============================================================================
  // Computed - Derived from config
  // ============================================================================

  /** Extract columns from config */
  protected readonly responsiveColumns = computed(() => this.config().columns);

  /** Extract row actions from config */
  protected readonly rowActions = computed(
    () => this.config().rowActions ?? [],
  );

  /** Extract bulk actions from config */
  protected readonly bulkActions = computed<DsBulkAction<T>[]>(
    () => this.config().bulkActions ?? [],
  );

  /** Whether to show selection UI (checkboxes, selection count, bulk actions menu) */
  protected readonly showSelectionUI = computed(
    () => this.bulkActions().length > 0,
  );

  /** Whether to show the mobile sort button - defaults to true */
  protected readonly showMobileSortButton = computed(
    () => this.config().mobile?.showSortButton ?? true,
  );

  /** Get sortable columns for the sort sheet */
  protected readonly sortableColumns = computed<DsSortableColumn[]>(() =>
    getSortableColumns(this.config().columns),
  );

  /** Selection entity label */
  protected readonly selectionEntityLabel = computed(
    () => this.config().selection?.entityLabel ?? 'items',
  );

  protected readonly selectAllLabel = computed(() => {
    const text = this.translationService.translate('global.select_all.txt');
    return text === 'global.select_all.txt' ? 'Select all' : text;
  });

  /** Total item count for select all */
  protected readonly totalItemCount = computed(() => {
    const pag = this.effectivePagination();
    return pag?.totalItems ?? this.effectiveRowData().length;
  });

  /** Count of rows that can be selected (respects isRowSelectable) */
  protected readonly selectableItemCount = computed(() => {
    const isSelectable = this.config().selection?.isRowSelectable;
    if (!isSelectable) return this.effectiveRowData().length;
    return this.effectiveRowData().filter((row) => isSelectable(row)).length;
  });

  /** Convert responsive columns to AG Grid ColDefs for table */
  protected readonly tableConfig = computed<DsAgGridTableConfig<T>>(() => {
    const cfg = this.config();
    const activeSort = this.currentSort();

    // Convert responsive columns to DsAgGridColDef (supports RTL-aware pinned positioning)
    const columns: DsAgGridColDef[] = cfg.columns.map((col) => {
      // Strip config-level sort — currentSort (potentially from localStorage) takes precedence
      const {
        mobile,
        headerKey,
        dsCell,
        actionButtons,
        sort: _configSort,
        fitContent,
        ...colDef
      } = col;

      // Wire up the built-in cell renderer:
      // - actionButtons columns: use the generic action-button cell renderer
      // - dsCell columns: use the specified type/config
      // - plain text columns (no custom renderer): use the text renderer for line-clamp + overflow control
      if (actionButtons) {
        colDef.cellRenderer = DsAgGridActionButtonCellComponent;
        colDef.cellRendererParams = actionButtons as Record<string, unknown>;
      } else if (!colDef.cellRenderer) {
        colDef.cellRenderer = DsAgGridCellRendererComponent;
        colDef.cellRendererParams =
          dsCell ?? ({ type: 'text' } as DsCellRendererParams);
      }

      // Cap pinned columns at 320px so they don't swallow the viewport
      if (colDef.pinned && !colDef.maxWidth) {
        colDef.maxWidth = 320;
      }

      // Cap columns at 320px unless the consumer explicitly opts out via fitContent.
      // This is applied per-column (not via defaultColDef) so that fitContent: true
      // can fully bypass the cap — defaultColDef maxWidth cannot be overridden per-column.
      if (!fitContent && !colDef.maxWidth) {
        colDef.maxWidth = 320;
      }

      // Apply active sort to the matching column
      const colId = col.colId || col.field;
      if (activeSort && colId === activeSort.field) {
        (colDef as DsAgGridColDef).sort = activeSort.direction;
      }

      return colDef as DsAgGridColDef;
    });

    // Convert bulk actions
    const bulkActions: DsAgGridBulkAction<T>[] = (cfg.bulkActions ?? []).map(
      (action) => ({
        id: action.id,
        label: action.label,
        icon: action.icon,
        activeLabel: action.activeLabel,
        disabled: action.disabled,
        disabledReason: action.disabledReason,
        action: action.action,
        visible: action.visible,
        loading: action.loading,
      }),
    );

    // Convert row actions to popup items
    // Wrap callbacks to match PopupItem signature (optional param)
    const rowActions = cfg.rowActions?.map((action) => {
      const visibleFn = action.visible;
      const disabledFn = action.disabled;
      const actionFn = action.action;

      return {
        id: action.id,
        title: action.label,
        icon: action.icon,
        action: actionFn ? (data?: T) => actionFn(data as T) : undefined,
        visible:
          typeof visibleFn === 'function'
            ? (data?: T) => visibleFn(data as T)
            : visibleFn,
        disabled:
          typeof disabledFn === 'function'
            ? (data?: T) => disabledFn(data as T)
            : disabledFn,
      };
    });

    return {
      columns,
      bulkActions,
      rowActions,
    };
  });

  /** Merge consumer-provided defaultColDef with responsive-table defaults.
   *  The 320px cap is applied per-column in tableConfig() so that fitContent: true
   *  columns can bypass it. defaultColDef only sets wrapText and minWidth. */
  protected readonly effectiveTableDefaultColDef = computed<ColDef>(() => {
    const userDefaults = this.config().table?.defaultColDef ?? {};
    return {
      wrapText: true,
      minWidth: 160,
      ...userDefaults,
    };
  });

  /** Smart autoSizeStrategy:
   *  Default is `fitGridWidth` — columns stretch to fill the full grid width.
   *  Consumers can override via `config.table.autoSizeStrategy`. */
  protected readonly effectiveAutoSizeStrategy = computed<
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToFitProvidedWidthStrategy
    | SizeColumnsToContentStrategy
    | undefined
  >(() => {
    return this.config().table?.autoSizeStrategy ?? { type: 'fitGridWidth' };
  });

  /** Compute active filter chips for empty state */
  protected readonly activeFilterChips = computed<NoDataFilterChip[]>(() => {
    const chips: NoDataFilterChip[] = [];
    const selection = this.effectiveFiltersSelection();
    const filterConfigs = this.effectiveFilters();

    for (const filterConfig of filterConfigs) {
      const value = selection[filterConfig.key];
      if (value == null || (Array.isArray(value) && value.length === 0))
        continue;

      if (filterConfig.type === 'search') {
        const searchValue = typeof value === 'string' ? value.trim() : '';
        if (searchValue) {
          chips.push({
            label: searchValue,
            removable: true,
            onRemove: () => this.removeFilter(filterConfig.key),
          });
        }
        continue;
      }

      if (filterConfig.type === 'chip-selector') {
        if (Array.isArray(value)) {
          for (const v of value) {
            const option = filterConfig.options.find((opt) => opt.value === v);
            chips.push({
              label: option?.displayedValue ?? String(v),
              removable: true,
              onRemove: () => this.removeChipSelectorValue(filterConfig.key, v),
            });
          }
        } else {
          const option = filterConfig.options.find(
            (opt) => opt.value === value,
          );
          chips.push({
            label: option?.displayedValue ?? String(value),
            removable: true,
            onRemove: () => this.removeFilter(filterConfig.key),
          });
        }
        continue;
      }

      if (filterConfig.type === 'school-structure' && Array.isArray(value)) {
        for (const v of value) {
          const entity = v as { id: number; type: string; name?: string };
          chips.push({
            label: entity.name ?? filterConfig.label,
            removable: true,
            onRemove: () => this.removeFilter(filterConfig.key),
          });
        }
        continue;
      }

      // For select type, look up display name from chipLabel override or static options
      if (filterConfig.type === 'select') {
        if (filterConfig.chipLabel) {
          chips.push({
            label: filterConfig.chipLabel,
            removable: true,
            onRemove: () => this.removeFilter(filterConfig.key),
          });
        } else if (filterConfig.config?.options && Array.isArray(value)) {
          // Multi-select: create individual chips per selected value
          for (const id of value) {
            const option = filterConfig.config.options.find(
              (opt) => String(opt.id) === String(id),
            );
            chips.push({
              label: option?.display ?? String(id),
              removable: true,
              onRemove: () =>
                this.removeChipSelectorValue(filterConfig.key, id),
            });
          }
        } else if (filterConfig.config?.options) {
          // Single select
          const option = filterConfig.config.options.find(
            (opt) => String(opt.id) === String(value),
          );
          chips.push({
            label: option?.display
              ? `${filterConfig.label}: ${option.display}`
              : `${filterConfig.label}: ${String(value)}`,
            removable: true,
            onRemove: () => this.removeFilter(filterConfig.key),
          });
        } else {
          chips.push({
            label: `${filterConfig.label}: ${String(value)}`,
            removable: true,
            onRemove: () => this.removeFilter(filterConfig.key),
          });
        }
        continue;
      }

      // For date type, format as dd/MM/yyyy
      if (filterConfig.type === 'date') {
        const d = value instanceof Date ? value : new Date(value as any);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        chips.push({
          label: `${filterConfig.label}: ${day}/${month}/${year}`,
          removable: true,
          onRemove: () => this.removeFilter(filterConfig.key),
        });
        continue;
      }

      // For date-range type, format as dd/MM/yyyy - dd/MM/yyyy
      if (filterConfig.type === 'date-range') {
        const r = value as { from: Date; to: Date } | null;
        if (r?.from && r?.to) {
          const fmt = (d: Date) => {
            const raw = d instanceof Date ? d : new Date(d);
            return `${raw.getDate().toString().padStart(2, '0')}/${(raw.getMonth() + 1).toString().padStart(2, '0')}/${raw.getFullYear()}`;
          };
          chips.push({
            label: `${filterConfig.label}: ${fmt(r.from)} - ${fmt(r.to)}`,
            removable: true,
            onRemove: () => this.removeFilter(filterConfig.key),
          });
        }
        continue;
      }

      chips.push({
        label: `${filterConfig.label}: ${String(value)}`,
        removable: true,
        onRemove: () => this.removeFilter(filterConfig.key),
      });
    }

    return chips;
  });

  /** Build the dataSource request from current state */
  private readonly dataSourceRequest = computed<DsDataSourceRequest>(() => {
    return {
      page: this.currentPage(),
      perPage: this.currentPerPage(),
      sort: this.currentSort(),
      filters: this.effectiveFiltersSelection(),
    };
  });

  // ============================================================================
  // Public API
  // ============================================================================

  /** Returns the field names of currently visible columns (respects user customization).
   *  Useful for building export payloads that only include displayed columns. */
  getVisibleColumnFields(): string[] {
    // Use AG Grid API to get actually displayed columns (respects customization + hide state)
    const gridApi = (this.agGridTable as any)?.gridApi;
    if (gridApi) {
      return gridApi
        .getAllDisplayedColumns()
        .map((col: any) => col.getColDef()?.field)
        .filter((f: any): f is string => !!f && f !== '__ds_selection__');
    }
    // Fallback: use config columns that aren't hidden
    return this.config()
      .columns.filter((col) => !col.hide)
      .map((col) => col.field)
      .filter((f): f is string => !!f);
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  protected onMobileSelectionChanged(rows: T[]): void {
    const prevRows = this.selectedRows();
    this.selectedRows.set(rows);
    this.selectionChanged.emit(rows);

    if (this.mobileAllPagesSelected()) {
      const currentIds = new Set(rows.map((r) => String((r as any)['id'])));
      const prevIds = new Set(prevRows.map((r) => String((r as any)['id'])));

      // Find newly unchecked rows
      const unchecked = [...prevIds].filter((id) => !currentIds.has(id));
      // Find re-checked rows (were excluded, now selected again)
      const rechecked = [...currentIds].filter((id) => !prevIds.has(id));

      if (unchecked.length > 0 || rechecked.length > 0) {
        let excluded = this.mobileExcludedIds();
        // Add newly unchecked
        excluded = [...excluded, ...unchecked];
        // Remove re-checked
        const recheckedSet = new Set(rechecked);
        excluded = excluded.filter((id) => !recheckedSet.has(id));
        this.mobileExcludedIds.set(excluded);
        this.selectionStateChanged.emit({
          mode: 'all',
          selectedIds: [],
          excludedIds: excluded,
        });
      }
      // When only count increased (new rows auto-selected), state stays 'all' — no emit needed
    } else {
      // Normal individual selection
      this.selectionStateChanged.emit({
        mode: rows.length > 0 ? 'some' : 'none',
        selectedIds: rows.map((r) => String((r as any)['id'])),
        excludedIds: [],
      });
    }
  }

  protected onTableSelectionChanged(rows: T[]): void {
    this.selectedRows.set(rows);
    this.selectionChanged.emit(rows);
  }

  protected onMobileRowActionClick(event: {
    row: T;
    action: DsRowAction<T>;
  }): void {
    this.rowActionClick.emit(event);
  }

  protected onPaginationChange(params: IPaginationParams): void {
    if (this.isDataSourceMode()) {
      // In dataSource mode, update internal state - effect will trigger fetch
      if (params.pageNumber !== undefined) {
        this.currentPage.set(params.pageNumber);
      }
      if (params.itemsPerPage !== undefined) {
        this.userSelectedPerPage.set(params.itemsPerPage);
      }
    }
    this.paginationChanged.emit(params);
  }

  protected onLoadMore(event: DsLoadMoreEvent): void {
    if (this.isDataSourceMode()) {
      // In dataSource mode, fetch next page and append
      this.fetchNextPage(event);
    } else {
      this.loadMore.emit(event);
    }
  }

  protected onFiltersChange(value: DsFiltersValue): void {
    if (this.isDataSourceMode()) {
      // Stamp explicit null on any scope key missing from the emitted value so that
      // the persisted state can distinguish "user cleared this scope filter" (null)
      // from "old localStorage entry that never had this key" (absent → backfilled).
      const initialFilters = this.config().initialFilters ?? {};
      const merged: DsFiltersValue = { ...value };
      for (const key of Object.keys(initialFilters)) {
        if (!(key in merged)) {
          merged[key] = null;
        }
      }
      // Only reset page if filters actually changed — avoids spurious
      // page-1 resets when the filter panel re-emits the same values
      // (e.g. after a pagination-triggered re-render cycle).
      const current = this.internalFiltersSelection();
      if (JSON.stringify(merged) === JSON.stringify(current)) return;
      this.internalFiltersSelection.set(merged);
      this.currentPage.set(1);
      // Effect will trigger fetch
    }
    // Scroll mobile list to top so first page results are visible
    this.mobileList?.scrollToTop();
    this.filtersChange.emit(value);
  }

  protected onClearFilters(): void {
    if (this.isDataSourceMode()) {
      // Reset filters to defaults (date/date-range defaultValue) or empty.
      const defaults: DsFiltersValue = {};
      for (const config of this.config().filters ?? []) {
        if (
          config.type === 'date' &&
          (config as DsDateFilterConfig).defaultValue != null
        ) {
          defaults[config.key] = (config as DsDateFilterConfig).defaultValue!;
        } else if (
          config.type === 'date-range' &&
          (config as DsDateRangeFilterConfig).defaultValue != null
        ) {
          defaults[config.key] = (
            config as DsDateRangeFilterConfig
          ).defaultValue!;
        }
      }
      this.internalFiltersSelection.set(defaults);
      this.currentSort.set(null);
      this.currentPage.set(1);
      // Effect will trigger fetch
    }
    // Scroll mobile list to top so first page results are visible
    this.mobileList?.scrollToTop();
    this.clearFilters.emit();
  }

  protected onBulkActionClick(event: DsBulkActionEvent<T>): void {
    this.bulkActionClick.emit(event);
  }

  protected onSelectAll(): void {
    // Select all loaded rows visually
    this.mobileList?.selectAll();
    this.mobileAllPagesSelected.set(true);
    this.mobileExcludedIds.set([]);
    // Emit "all selected across pages" state (same as desktop)
    this.selectionStateChanged.emit({
      mode: 'all',
      selectedIds: [],
      excludedIds: [],
    });
  }

  protected onDeselectAll(): void {
    this.mobileList?.clearSelection();
    this.selectedRows.set([]);
    this.mobileAllPagesSelected.set(false);
    this.mobileExcludedIds.set([]);
    this.selectionChanged.emit([]);
    this.selectionStateChanged.emit({
      mode: 'none',
      selectedIds: [],
      excludedIds: [],
    });
  }

  protected onCloseSelection(): void {
    this.selectedRows.set([]);
    this.mobileAllPagesSelected.set(false);
    this.mobileExcludedIds.set([]);
    this.mobileList?.clearSelection();
    this.selectionChanged.emit([]);
    // Exit selection mode
    this.selectionMode.set(false);
    this.activeAction.set(null);
  }

  protected onRowClick(row: T): void {
    this.rowClicked.emit(row);
  }

  /** Handle AG Grid column header sort clicks */
  protected onAgGridSortChanged(
    sortInfo: { field: string; direction: 'asc' | 'desc' } | null,
  ): void {
    // Skip when we're programmatically reverting sort after a failed API call
    if (this._isRevertingSort) return;

    const newSort: DsSortState | null = sortInfo
      ? { field: sortInfo.field, direction: sortInfo.direction }
      : null;
    this.currentSort.set(newSort);
    if (this.isDataSourceMode()) {
      this.currentPage.set(1); // Reset to first page on sort change
    }
    this.sortChanged.emit({ sort: newSort });
  }

  // ============================================================================
  // Mobile Selection Mode Handlers
  // ============================================================================

  /** Handle primary action click from floating button */
  protected onPrimaryActionClick(action: {
    label: string;
    action?: () => void;
  }): void {
    // The primary action's handler is called directly by the floating actions component
    // No additional handling needed here unless we want to emit an event
  }

  /** Handle bulk actions menu button click - opens modal using DsResponsiveMenuSheetComponent */
  protected async onBulkActionsMenuClick(): Promise<void> {
    const allData = this.effectiveRowData();
    const bulkActions = this.bulkActions();

    // Store selected action reference
    let selectedAction: DsBulkAction<T> | null = null;

    // Convert bulk actions to PopupItem format, pre-evaluating visibility against allRowData
    const menuItems: PopupItem[] = bulkActions
      .filter((action) => {
        // Evaluate visibility against all data (show if action is potentially relevant)
        if (typeof action.visible === 'function') {
          return action.visible(allData);
        }
        return action.visible !== false;
      })
      .map((action) => ({
        id: action.id,
        title: action.label,
        icon: action.icon,
      }));

    const modalRef = await this.modalService.open<
      {
        items: ReadonlyArray<PopupItem>;
        closeOnSelect: boolean;
        onItemSelected: (item: PopupItem) => void;
      },
      void
    >({
      component: DsResponsiveMenuSheetComponent,
      componentProps: {
        items: menuItems,
        closeOnSelect: true,
        onItemSelected: (item: PopupItem) => {
          // Find the original bulk action by id
          selectedAction = bulkActions.find((a) => a.id === item.id) ?? null;
        },
      },
      headerConfig: {
        title: this.translationService.translate('global.actions.title'),
        showCloseButton: true,
      },
      size: 'lg',
      contentClass: 'p-0',
      mobileHandle: true,
    });

    await modalRef.onDismiss();

    // If an action was selected, enter selection mode
    if (selectedAction) {
      this.activeAction.set(selectedAction);
      this.selectionMode.set(true);
    }
  }

  // ============================================================================
  // Mobile Sort Handlers
  // ============================================================================

  /** Handle sort button click - opens sort modal */
  protected async onSortButtonClick(): Promise<void> {
    const modalRef = await this.modalService.open<
      {
        columns: DsSortableColumn[];
        currentSort: DsSortState | null;
      },
      DsSortState | null
    >({
      component: DsMobileSortModalContentComponent,
      componentProps: {
        columns: this.sortableColumns(),
        currentSort: this.currentSort(),
      },
      headerConfig: {
        title: this.translationService.translate('general.sort_by.txt'),
        showCloseButton: true,
      },
      size: 'sm',
      mobileHandle: true,
    });

    const result = await modalRef.onDismiss();

    if (result.role === 'sort' && result.data) {
      this.currentSort.set(result.data);
      if (this.isDataSourceMode()) {
        this.currentPage.set(1); // Reset to first page on sort change
      }
      this.mobileList?.scrollToTop();
      this.sortChanged.emit({ sort: result.data });
    } else if (result.role === 'clear') {
      this.currentSort.set(null);
      if (this.isDataSourceMode()) {
        this.currentPage.set(1);
      }
      this.mobileList?.scrollToTop();
      this.sortChanged.emit({ sort: null });
    }
  }

  // ============================================================================
  // Filter Helpers
  // ============================================================================

  private removeFilter(key: string): void {
    const current = this.effectiveFiltersSelection();
    const updated = { ...current };
    delete updated[key];
    this.onFiltersChange(updated);
  }

  private removeChipSelectorValue(key: string, valueToRemove: unknown): void {
    const current = this.effectiveFiltersSelection();
    const currentValue = current[key];
    if (!Array.isArray(currentValue)) return;

    const filteredValue = currentValue.filter((v) => v !== valueToRemove);
    const updated: DsFiltersValue = {
      ...current,
      [key]: filteredValue as typeof currentValue,
    };
    this.onFiltersChange(updated);
  }

  // ============================================================================
  // DataSource Methods
  // ============================================================================

  /** Fetch data using the dataSource function */
  private fetchData(): void {
    const dataSource = this.config().dataSource;
    if (!dataSource) return;

    const request = this.dataSourceRequest();
    this.internalLoading.set(true);

    dataSource(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.internalRowData.set(response.data);
          this.internalPagination.set(response.pagination ?? null);
          this.internalLoading.set(false);
          // Track last successful sort for error recovery
          this.lastSuccessfulSort.set(this.currentSort());
          // Mark grid as initialized after first successful fetch
          if (!this.isGridInitialized()) {
            this.isGridInitialized.set(true);
          }
          // Reset mobile infinite scroll so it can load more pages
          this.mobileList?.resetInfiniteScroll();
        },
        error: (err: unknown) => {
          this.internalLoading.set(false);
          const httpStatus = (err as { status?: number })?.status;
          // 404 means "no data" — treat it like an empty response, not a sort error
          const isNoDataError = httpStatus === 404;
          // Revert sort to last successful state if it changed
          // (e.g. backend rejected the sort column with 422).
          // Skip sort revert for 404 since that's just "no data found".
          const lastGoodSort = this.lastSuccessfulSort();
          const current = this.currentSort();
          if (
            !isNoDataError &&
            JSON.stringify(current) !== JSON.stringify(lastGoodSort)
          ) {
            this.toasterService.error(
              'Sorting by this column is not supported. Reverting to previous sort.',
            );
            this._isRevertingSort = true;
            this.agGridTable?.applySortState(
              lastGoodSort
                ? {
                    field: lastGoodSort.field,
                    direction: lastGoodSort.direction,
                  }
                : null,
            );
            this._isRevertingSort = false;
            this.currentSort.set(lastGoodSort);
            return;
          }
          // No data or other non-sort error — show empty state
          this.internalRowData.set([]);
          // Keep pagination footer visible with zero totals
          this.internalPagination.set({
            totalItems: 0,
            totalPages: 0,
            pageNumber: 1,
            itemsPerPage: this.currentPerPage(),
          });
          if (!this.isGridInitialized()) {
            this.isGridInitialized.set(true);
          }
        },
      });
  }

  /** Fetch next page for mobile infinite scroll */
  private fetchNextPage(event: DsLoadMoreEvent): void {
    const dataSource = this.config().dataSource;
    if (!dataSource) {
      event.complete();
      return;
    }

    const request: DsDataSourceRequest = {
      ...this.dataSourceRequest(),
      page: event.pageNumber,
      perPage: event.itemsPerPage,
    };

    dataSource(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Append new data to existing
          const currentData = this.internalRowData();
          this.internalRowData.set([...currentData, ...response.data]);
          this.internalPagination.set(response.pagination ?? null);
          event.complete();

          // Disable if no more pages
          if (
            !response.pagination ||
            event.pageNumber >= response.pagination.totalPages
          ) {
            event.disable();
          }
        },
        error: () => {
          event.complete();
        },
      });
  }

  /** Seed internalFiltersSelection and initial sort from config (or localStorage) before first fetch */
  private readonly seedInitialFiltersEffect = effect(
    () => {
      if (this._readyToFetch()) return;
      const cfg = this.config();

      // Load saved state from localStorage if persistence is enabled
      const persistState = cfg.persistState ?? true;
      if (persistState !== false) {
        const namespace =
          typeof persistState === 'string' ? persistState : undefined;
        const savedState = this.tableStateService.loadState(namespace);

        // Apply saved filters (if any), converting date strings back to Date objects.
        // Use the stored state exactly as saved — scope keys (school, academic year) are
        // stored as part of the filter state and managed externally (tab components update
        // them when scope changes while the page is active). This prevents a global scope
        // change on a different page from silently overriding the user's saved filter state.
        const initialFilters = cfg.initialFilters ?? {};
        // null means no saved state (first visit); {} means user explicitly cleared all filters
        if (savedState.filters != null) {
          // Merge initialFilters as base so scope keys absent from old saved state
          // get backfilled; explicit nulls from onFiltersChange override them.
          const filters = { ...initialFilters, ...savedState.filters };
          for (const fc of cfg.filters ?? []) {
            if (fc.type === 'date' && filters[fc.key] != null) {
              const val = filters[fc.key];
              if (typeof val === 'string' || typeof val === 'number') {
                filters[fc.key] = new Date(val) as any;
              }
            }
            if (fc.type === 'date-range' && filters[fc.key] != null) {
              const val = filters[fc.key] as any;
              if (val?.from) val.from = new Date(val.from);
              if (val?.to) val.to = new Date(val.to);
            }
          }
          this.internalFiltersSelection.set(filters);
        } else {
          // No saved state — first visit. Use initialFilters (current scope) as the default.
          if (Object.keys(initialFilters).length > 0) {
            this.internalFiltersSelection.set(initialFilters);
          }
        }

        // Apply saved sort (if any)
        if (savedState.sort) {
          this.currentSort.set(savedState.sort);
        } else {
          // No saved sort - seed from column definitions
          const sortedCol = cfg.columns.find(
            (c) => c.sort === 'asc' || c.sort === 'desc',
          );
          if (sortedCol) {
            this.currentSort.set({
              field: sortedCol.field,
              direction: sortedCol.sort as 'asc' | 'desc',
            });
          }
        }
      } else {
        // Persistence disabled - use config defaults
        const initialFilters = cfg.initialFilters;
        if (initialFilters && Object.keys(initialFilters).length > 0) {
          this.internalFiltersSelection.set(initialFilters);
        }
        const sortedCol = cfg.columns.find(
          (c) => c.sort === 'asc' || c.sort === 'desc',
        );
        if (sortedCol) {
          this.currentSort.set({
            field: sortedCol.field,
            direction: sortedCol.sort as 'asc' | 'desc',
          });
        }
      }

      this._readyToFetch.set(true);
    },
    { allowSignalWrites: true },
  );

  /** Effect to trigger dataSource fetch when request changes */
  private readonly dataSourceEffect = effect(() => {
    // Only run in dataSource mode
    if (!this.isDataSourceMode()) return;

    // Wait for initial filters to be seeded
    if (!this._readyToFetch()) return;

    // Track the request - this will re-run when any of the request params change
    this.dataSourceRequest();

    // Fetch data — untracked so that config() read inside fetchData()
    // does not become a dependency of this effect (avoids duplicate fetches
    // when config changes for non-data reasons like viewChild availability)
    untracked(() => this.fetchData());
  });

  /** Effect to auto-save filter and sort state to localStorage */
  private readonly statePersistenceEffect = effect(() => {
    const cfg = this.config();
    const persistState = cfg.persistState ?? true;
    if (persistState === false) return;

    // Wait for initial state to be seeded before saving
    if (!this._readyToFetch()) return;

    // Don't persist while loading — the sort might be rejected by the backend.
    // Once the fetch succeeds or the sort is reverted, this effect re-runs.
    if (this.internalLoading()) return;

    const namespace =
      typeof persistState === 'string' ? persistState : undefined;

    // Save filters and sort to localStorage
    this.tableStateService.saveState(
      {
        filters: this.internalFiltersSelection(),
        sort: this.currentSort(),
      },
      namespace,
    );
  });

  // ============================================================================
  // Public API
  // ============================================================================

  /** Get currently selected rows */
  public getSelectedRows(): T[] {
    return this.selectedRows();
  }

  /** Clear selection */
  public clearSelection(): void {
    this.onCloseSelection();
    // Also clear the AG Grid table's internal selection state
    this.agGridTable?.clearSelection();
  }

  /** Reset mobile infinite scroll */
  public resetInfiniteScroll(): void {
    this.mobileList?.resetInfiniteScroll();
  }

  /** Refresh data (only works in dataSource mode) */
  public refresh(): void {
    if (this.isDataSourceMode()) {
      this.fetchData();
    }
  }

  /** Reset to first page, scroll mobile to top, and re-fetch data */
  public refreshFromFirstPage(): void {
    if (this.isDataSourceMode()) {
      this.currentPage.set(1);
      this.mobileList?.resetInfiniteScroll();
      this.fetchData();
    }
  }

  /** Set filter values programmatically */
  public setFilters(filters: DsFiltersValue): void {
    this.onFiltersChange(filters);
  }

  /** Update specific filter keys, merging with existing filters.
   *  Safe to call before the config input is set (e.g. from parent effects
   *  that fire before Angular binds required inputs). */
  public updateFilters(partial: DsFiltersValue): void {
    const current = this.internalFiltersSelection();
    const merged = { ...current, ...partial };
    // Skip if merged values are identical to current (prevents duplicate API
    // calls when scope effects fire with values already loaded from localStorage)
    if (JSON.stringify(merged) === JSON.stringify(current)) return;
    this.internalFiltersSelection.set(merged);
    // Only reset page and emit after the component is fully initialised
    // (config input bound and initial filters seeded).  Before that,
    // seedInitialFiltersEffect will overwrite with initialFilters anyway.
    if (this._readyToFetch()) {
      this.currentPage.set(1);
      this.filtersChange.emit(merged);
    }
  }
}
