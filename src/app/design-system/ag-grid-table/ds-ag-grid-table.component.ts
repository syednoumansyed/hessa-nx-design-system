import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ColDef,
  ColumnMovedEvent,
  DragStoppedEvent,
  GridApi,
  GridReadyEvent,
  IDatasource,
  IRowNode,
  RowClickedEvent,
  RowModelType,
  RowSelectionOptions,
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
  SizeColumnsToFitProvidedWidthStrategy,
  SortChangedEvent,
} from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { DsAgGridTableService } from './ds-ag-grid-table.service';
import { DsAgGridTableHeaderComponent } from './ds-ag-grid-table-header.component';
import {
  DsAgGridTableConfig,
  DsAgGridBulkAction,
  DsAgGridEmptyStateConfig,
  DsAgGridColDef,
  DsSelectionState,
  resolvePinnedPosition,
} from './ds-ag-grid-table.model';
import { DsAgGridCheckboxCellComponent } from './ds-ag-grid-checkbox-cell.component';
import { DsAgGridHeaderCheckboxComponent } from './ds-ag-grid-header-checkbox.component';
import { DsAgGridActionsCellComponent } from './ds-ag-grid-actions-cell.component';
import { DsAgGridTitleSubtitleHeaderComponent } from './ds-ag-grid-title-subtitle-header.component';
import {
  DsAgGridCustomizeColumnsComponent,
  DsAgGridColumnItem,
  DsAgGridCustomizeColumnsResult,
} from './ds-ag-grid-customize-columns.component';
import { DsFilterPanelComponent } from '@ds/filter-panel/ds-filter-panel.component';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faChevronLeft,
  faChevronRight,
  faChevronDown,
} from '@fortawesome/pro-solid-svg-icons';
import {
  IPagination,
  IPaginationParams,
} from '@shared/interfaces/api.interface';
import {
  NoDataCardComponent,
  NoDataFilterChip,
} from '@shared/components/no-data-card/no-data-card.component';
import { DsMenuComponent } from '@ds/popup/ds-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { DsModalService } from '@ds/modal';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import {
  DsAgGridNoRowsOverlayComponent,
  DsAgGridNoRowsOverlayParams,
} from './ds-ag-grid-no-rows-overlay.component';
import { DsAgGridLoadingOverlayComponent } from './ds-ag-grid-loading-overlay.component';
import { DsResponsiveTableStateService } from '../ds-responsive-table/ds-responsive-table-state.service';

@Component({
  selector: 'app-ds-ag-grid-table',
  standalone: true,
  imports: [
    CommonModule,
    AgGridModule,
    DsIconComponent,
    DsFilterPanelComponent,
    DsAgGridTableHeaderComponent,
    DsAgGridCheckboxCellComponent,
    DsAgGridHeaderCheckboxComponent,
    DsAgGridActionsCellComponent,
    DsAgGridTitleSubtitleHeaderComponent,
    DsAgGridNoRowsOverlayComponent,
    DsAgGridLoadingOverlayComponent,
    NoDataCardComponent,
    DsMenuComponent,
    DsTranslatePipe,
  ],
  templateUrl: './ds-ag-grid-table.component.html',
  styleUrls: ['./ds-ag-grid-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DsAgGridTableService],
})
export class DsAgGridTableComponent implements OnInit {
  title = input<string>('');
  selectionLabel = input<string>('Select students to');
  showSelectionCount = input<boolean>(true);
  selectionCount = input<number | null>(null);
  selectionEntityLabel = input<string>('Students');
  showCustomizeColumns = input<boolean>(false);
  pagination = input<IPagination | null>(null);
  showPagination = input<boolean>(true);
  itemsPerPage = input<number>(30);
  filters = input<DsFilterConfig[]>([]);
  filtersSelection = input<DsFiltersValue>({});

  showZoom = input<boolean>(true);
  zoomStep = input<number>(0.1);
  minZoom = input<number>(0.5);
  maxZoom = input<number>(1.3);
  initialZoom = input<number>(1);
  config = input.required<DsAgGridTableConfig<any>>();
  defaultColDef = input<ColDef | undefined>(undefined);
  rowData = input<any[]>([]);
  rowModelType = input<RowModelType>('clientSide');
  datasource = input<IDatasource | null>(null);
  cacheBlockSize = input<number>(30);
  rowSelection = input<'single' | 'multiple' | undefined>('multiple');
  suppressRowClickSelection = input<boolean>(true);
  selectionColumnEnabled = input<boolean>(true);

  /** Field name used to identify rows uniquely (for cross-page selection persistence) */
  rowIdField = input<string>('id');

  /** Callback to determine if a row can be selected. Rows that return false get a disabled checkbox. */
  isRowSelectable = input<((row: any) => boolean) | null>(null);

  /** AG Grid-compatible isRowSelectable callback that wraps the consumer's row-level predicate (for IRowNode). */
  private readonly agIsRowSelectable = (node: IRowNode): boolean => {
    const fn = this.isRowSelectable();
    if (!fn) return true;
    return fn(node.data);
  };

  /** Auto-size strategy for columns - fitCellContents sizes columns to fit their content */
  autoSizeStrategy = input<
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToFitProvidedWidthStrategy
    | SizeColumnsToContentStrategy
    | undefined
  >(undefined);

  // Empty state configuration
  emptyState = input<DsAgGridEmptyStateConfig | null>(null);
  loading = input<boolean>(false);

  /**
   * Whether the grid has been initialized (first API call completed).
   * When true, the grid structure (columns, headers) will always be shown,
   * with an empty overlay inside the grid when there's no data.
   * When false (default), empty state replaces the entire grid.
   */
  isGridInitialized = input<boolean>(false);

  /**
   * Control state persistence (column order, visibility, filters, sort).
   * State is saved to localStorage and restored on page reload.
   * - `true` (default): Auto-generate key from URL
   * - `string`: Use custom namespace for storage key (e.g., 'students-tab')
   * - `false`: Disable persistence
   */
  persistState = input<boolean | string>(true);

  /**
   * When true, AG Grid will NOT re-sort rows client-side.
   * Sort indicators on column headers still work and emit sortChanged events,
   * but the actual row order is preserved as-is from the server response.
   */
  serverSideSort = input<boolean>(false);
  rowClickable = input<boolean>(false);

  rowClicked = output<any>();
  selectionChanged = output<any[]>();
  paginationChanged = output<IPaginationParams>();
  filtersChange = output<DsFiltersValue>();
  zoomChange = output<number>();
  bulkActionClick = output<{
    action: DsAgGridBulkAction<any>;
    rows: any[];
  }>();
  closeSelection = output<void>();
  customizeColumnsClick = output<void>();
  clearFilters = output<void>();
  sortChanged = output<{ field: string; direction: 'asc' | 'desc' } | null>();

  /** Emits the cross-page selection state (all-selected vs some-selected with IDs) */
  selectionStateChanged = output<DsSelectionState>();

  /**
   * Whether "Select All" across ALL pages is active.
   * When true, all rows on every page are considered selected
   * except those tracked in excludedRowIds.
   */
  readonly allPagesSelected = signal<boolean>(false);

  /**
   * IDs of rows explicitly excluded when allPagesSelected is true.
   * When user unchecks a row while all-pages is selected, the ID is added here.
   */
  private readonly excludedRowIds = signal<Set<string>>(new Set());

  private readonly zoomLevel = signal<number>(1);
  private gridApi: GridApi | null = null;
  private readonly gridContainer =
    viewChild<ElementRef<HTMLDivElement>>('gridContainer');
  private readonly tableService = inject(DsAgGridTableService);
  private readonly translateService = inject(HesTranslateService);
  private readonly modalService = inject(DsModalService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tableStateService = inject(DsResponsiveTableStateService);

  /** Internal pagination state for client-side mode (when no external pagination provided) */
  private readonly internalPageNumber = signal<number>(1);
  private readonly internalItemsPerPage = signal<number>(30);

  /** Track previous row data length to detect filter changes */
  private previousRowDataLength = 0;

  /**
   * Persistent selection state - tracks selected row IDs across pagination.
   * Key: row ID (string), Value: the full row data
   */
  private readonly persistentSelection = signal<Map<string, any>>(new Map());

  /** Flag to prevent recursive selection updates */
  private isRestoringSelection = false;

  /** RTL mode signal - triggers re-computation of column definitions when direction changes */
  protected readonly isRtl = signal<boolean>(
    document.documentElement.dir === 'rtl',
  );

  /** Computed signal for customize columns label using translation key */
  protected readonly customizeColumnsLabel = computed(() =>
    this.translateService.t('global.customize_columns.title'),
  );

  /** Stores the current column customization (order and visibility) */
  private readonly columnCustomization = signal<DsAgGridColumnItem[] | null>(
    null,
  );

  /** Tracks if the table body is scrolled (for sticky header border) */
  protected readonly isScrolled = signal<boolean>(false);

  /** Per page options for pagination dropdown */
  protected readonly perPageOptions: PopupItem[] = [
    { id: '10', title: '10', selectable: true },
    { id: '30', title: '30', selectable: true },
    { id: '50', title: '50', selectable: true },
    { id: '100', title: '100', selectable: true },
    { id: '200', title: '200', selectable: true },
  ];

  /** Icons for pagination */
  protected readonly chevronLeftIcon = faChevronLeft;
  protected readonly chevronRightIcon = faChevronRight;
  protected readonly chevronDownIcon = faChevronDown;

  /** Default empty state configuration - uses translation keys */
  private readonly defaultEmptyStateImagePath =
    'assets/illustrations/no-search-result.svg';

  protected readonly bulkActions = computed(
    () => this.config().bulkActions ?? [],
  );

  /** AG Grid context - passes callbacks to custom header/cell components */
  protected readonly gridContext = computed(() => ({
    onSelectAllAcrossPages: (checked: boolean) => {
      const totalItems = this.pagination()?.totalItems;
      if (checked) {
        if (totalItems != null) {
          // Paginated: use "all pages" mode with exclusion tracking
          this.allPagesSelected.set(true);
          this.excludedRowIds.set(new Set());
          this.tableService.setAllPagesSelectedCount(totalItems);
        }
        // Always enable selection header
        this.tableService.selectionEnabled.set(true);
      } else {
        this.allPagesSelected.set(false);
        this.excludedRowIds.set(new Set());
        this.persistentSelection.set(new Map());
        this.tableService.setAllPagesSelectedCount(null);
        this.tableService.setSelectedRows([]);
      }
      this.emitSelectionState();
    },
    isAllPagesSelected: () => this.allPagesSelected(),
    hasExcludedIds: () => this.excludedRowIds().size > 0,
  }));

  /** Merges user-provided defaultColDef with our internal defaults (including custom header) */
  protected readonly effectiveDefaultColDef = computed<ColDef>(() => {
    const userDefaults = this.defaultColDef() ?? {};
    return {
      headerComponent: DsAgGridTitleSubtitleHeaderComponent,
      sortable: false,
      flex: 1,
      minWidth: 100,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      ...userDefaults,
      // When server-side sort is active, use a no-op comparator to prevent
      // AG Grid from re-ordering rows client-side. Sort indicators still work.
      ...(this.serverSideSort() ? { comparator: () => 0 } : {}),
    };
  });

  protected readonly effectiveColumnDefs = computed<ColDef[]>(() => {
    const tableConfig = this.config();
    const isRtlMode = this.isRtl();
    let cols: DsAgGridColDef[] = [...tableConfig.columns];
    const bulkActionsArr = tableConfig.bulkActions ?? [];
    const showSelectionColumn =
      this.selectionColumnEnabled() && bulkActionsArr.length > 0;
    const rowActionsFn = tableConfig.rowActions;

    // Apply column customization (order and visibility)
    const customization = this.columnCustomization();
    if (customization) {
      // Reorder columns based on customization
      const orderedCols: DsAgGridColDef[] = [];
      for (const customCol of customization) {
        if (!customCol.visible) continue; // Skip hidden columns
        const col = cols.find((c) => (c.colId ?? c.field) === customCol.id);
        if (col) {
          // Override hide property based on customization visibility
          orderedCols.push({ ...col, hide: false });
        }
      }
      // Add any columns not in customization (newly added columns)
      for (const col of cols) {
        const colId = col.colId ?? col.field;
        if (colId && !customization.some((c) => c.id === colId)) {
          orderedCols.push(col);
        }
      }
      cols = orderedCols;
    }

    // Set lockPinned on all columns to prevent pinning/unpinning via drag-drop
    // Set suppressMovable on pinned columns to hide drag handle
    cols = cols.map((col) => {
      if (col.pinned === 'start' || col.pinned === 'end') {
        return { ...col, suppressMovable: true, lockPinned: true };
      }
      // For unpinned columns, lockPinned prevents them from being pinned by dragging
      return { ...col, lockPinned: true };
    });

    // Add selection column at the beginning if bulk actions are enabled
    if (showSelectionColumn) {
      const selectionCol: DsAgGridColDef = {
        colId: '__ds_selection__',
        headerName: '',
        width: 48,
        maxWidth: 48,
        minWidth: 48,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        headerComponent: DsAgGridHeaderCheckboxComponent,
        cellRenderer: DsAgGridCheckboxCellComponent,
        pinned: 'start',
      };
      cols = [selectionCol, ...cols];
    }

    // Add actions column at the end if row actions are provided
    if (rowActionsFn) {
      const actionsCol: DsAgGridColDef = {
        colId: '__ds_actions__',
        headerName: '',
        width: 60,
        maxWidth: 60,
        minWidth: 60,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        pinned: 'end',
        lockPinned: true,
        cellRenderer: DsAgGridActionsCellComponent,
        cellClass: 'ds-ag-center-column',
        headerClass: 'ds-ag-center-header',
        cellRendererParams: {
          actions: rowActionsFn,
        },
      };
      cols = [...cols, actionsCol];
    }

    // Mark first/last pinned columns with CSS classes for border styling.
    // Classes are direction-agnostic ('start'/'end') so the same CSS works in LTR and RTL.
    // This avoids :first-child/:last-child which break when AG Grid reorders DOM elements.
    let firstPinnedStartIdx = -1;
    let lastPinnedStartIdx = -1;
    let firstPinnedEndIdx = -1;
    let lastPinnedEndIdx = -1;
    for (let i = 0; i < cols.length; i++) {
      if (cols[i].pinned === 'start') {
        if (firstPinnedStartIdx === -1) firstPinnedStartIdx = i;
        lastPinnedStartIdx = i;
      } else if (cols[i].pinned === 'end') {
        if (firstPinnedEndIdx === -1) firstPinnedEndIdx = i;
        lastPinnedEndIdx = i;
      }
    }
    if (firstPinnedStartIdx >= 0) {
      cols[firstPinnedStartIdx] = this.withColumnClass(
        cols[firstPinnedStartIdx],
        'ds-ag-pinned-start-first',
      );
    }
    if (lastPinnedStartIdx >= 0) {
      cols[lastPinnedStartIdx] = this.withColumnClass(
        cols[lastPinnedStartIdx],
        'ds-ag-pinned-start-last',
      );
    }
    if (firstPinnedEndIdx >= 0) {
      cols[firstPinnedEndIdx] = this.withColumnClass(
        cols[firstPinnedEndIdx],
        'ds-ag-pinned-end-first',
      );
    }
    if (lastPinnedEndIdx >= 0) {
      cols[lastPinnedEndIdx] = this.withColumnClass(
        cols[lastPinnedEndIdx],
        'ds-ag-pinned-end-last',
      );
    }

    // Wrap plain-text columns (no cellRenderer) in a <span> so CSS can
    // target text vs whitespace for cursor and user-select behavior.
    cols = cols.map((col) => {
      if (col.cellRenderer) return col; // custom renderer already wraps content
      return {
        ...col,
        cellRenderer: (params: {
          value: unknown;
          valueFormatted: string | null;
        }) => {
          const val =
            params.valueFormatted != null
              ? params.valueFormatted
              : params.value;
          if (val == null || val === '') return '';
          const span = document.createElement('span');
          span.className = 'ds-ag-cell-text';
          span.textContent = String(val);
          return span;
        },
      };
    });

    // Convert RTL-aware pinned positions ('start'/'end') to physical positions ('left'/'right')
    return cols.map((col) => ({
      ...col,
      pinned: resolvePinnedPosition(col.pinned, isRtlMode),
    })) as ColDef[];
  });

  protected readonly isClientSide = computed(() => {
    return this.rowModelType() === 'clientSide';
  });
  protected readonly selectionMode = computed<RowSelectionOptions | undefined>(
    () => {
      if (!(this.selectionColumnEnabled() && this.bulkActions().length > 0)) {
        return undefined;
      }
      const mode = this.rowSelection() === 'single' ? 'singleRow' : 'multiRow';
      const opts: RowSelectionOptions = {
        mode,
        checkboxes: false, // We use our own custom checkbox column
        headerCheckbox: false, // We use our own custom header checkbox
        isRowSelectable: this.agIsRowSelectable,
      };
      return opts;
    },
  );

  /** Returns paginated row data for client-side mode */
  protected readonly paginatedRowData = computed<any[]>(() => {
    const allData = this.rowData();
    if (!this.isClientSide() || !this.showPagination()) {
      return allData;
    }

    // If external pagination is provided, assume the data is already paginated
    if (this.pagination()) {
      return allData;
    }

    // Apply internal pagination
    const itemsPerPage = this.internalItemsPerPage();
    const pageNumber = this.internalPageNumber();
    const startIndex = (pageNumber - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return allData.slice(startIndex, endIndex);
  });

  protected readonly effectivePagination = computed<IPagination | null>(() => {
    // Hide pagination if explicitly disabled
    if (!this.showPagination()) return null;

    // Use external pagination if provided
    const paginate = this.pagination();
    if (paginate) return paginate;

    // For client-side mode, compute pagination using internal state
    if (!this.isClientSide()) return null;
    const totalItems = this.rowData().length;
    if (!totalItems) return null;

    const itemsPerPage = this.internalItemsPerPage();
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const pageNumber = Math.min(this.internalPageNumber(), totalPages);

    return {
      itemsPerPage,
      pageNumber,
      totalItems,
      totalPages,
    };
  });

  protected readonly pagesList = computed<(number | -1)[]>(() => {
    const paginate = this.effectivePagination();
    if (!paginate || paginate.totalPages <= 1) return [];
    return this.generatePageList(paginate.totalPages, paginate.pageNumber);
  });

  protected readonly paginationSummary = computed<string>(() => {
    const paginate = this.effectivePagination();
    if (!paginate) return '';
    if (paginate.totalItems === 0)
      return this.translateService.translate('global.pagination_summary.txt', {
        start: 0,
        end: 0,
        total: 0,
      });
    const start = (paginate.pageNumber - 1) * paginate.itemsPerPage + 1;
    const end = Math.min(
      paginate.pageNumber * paginate.itemsPerPage,
      paginate.totalItems,
    );
    return this.translateService.translate('global.pagination_summary.txt', {
      start,
      end,
      total: paginate.totalItems,
    });
  });

  protected readonly zoomValue = computed(() => this.zoomLevel());
  protected readonly isZoomAtMin = computed(
    () => this.zoomLevel() <= this.minZoom(),
  );
  protected readonly isZoomAtMax = computed(
    () => this.zoomLevel() >= this.maxZoom(),
  );

  /** Zoom percentage for display (e.g., "100%") */
  protected readonly zoomPercentage = computed(
    () => `${Math.round(this.zoomLevel() * 100)}%`,
  );

  /** Currently selected per page value for the dropdown */
  protected readonly selectedPerPageValue = computed<string[]>(() => {
    const paginate = this.effectivePagination();
    if (!paginate) return [];
    return [String(paginate.itemsPerPage)];
  });

  /** Merges user-provided empty state config with defaults (using translations) */
  protected readonly effectiveEmptyState =
    computed<Required<DsAgGridEmptyStateConfig> | null>(() => {
      const config = this.emptyState();
      if (!config) return null;
      return {
        imagePath: config.imagePath ?? this.defaultEmptyStateImagePath,
        title:
          config.title ??
          this.translateService.translate('global.no_records.txt'),
        description: config.description ?? '',
        filteredByLabel:
          config.filteredByLabel ??
          this.translateService.translate('support.hub.filter.label'),
      };
    });

  /** Translated label for clear filters button */
  protected readonly clearFiltersLabel = computed(() =>
    this.translateService.translate('global.clear_filters.btn'),
  );

  /** No rows overlay component for AG Grid */
  protected readonly noRowsOverlayComponent = DsAgGridNoRowsOverlayComponent;

  /** Loading overlay component for AG Grid */
  protected readonly loadingOverlayComponent = DsAgGridLoadingOverlayComponent;

  /** Params for the no rows overlay component - updates reactively */
  protected readonly noRowsOverlayParams = computed<
    Partial<DsAgGridNoRowsOverlayParams>
  >(() => {
    const emptyConfig = this.effectiveEmptyState();
    return {
      imagePath: emptyConfig?.imagePath,
      title: emptyConfig?.title,
      description: emptyConfig?.description,
      filteredByLabel: emptyConfig?.filteredByLabel,
      filterChips: this.hasActiveFilters() ? this.activeFilterChips() : [],
      clearFiltersLabel: this.clearFiltersLabel(),
      onClearFilters: () => this.onClearFilters(),
    };
  });

  /** Checks if there is no data (regardless of initialization state) */
  private readonly hasNoData = computed<boolean>(() => {
    // For client-side, check rowData
    if (this.isClientSide()) {
      return this.rowData().length === 0;
    }

    // For server-side, rely on pagination totalItems
    const paginate = this.pagination();
    return paginate ? paginate.totalItems === 0 : true;
  });

  /**
   * Determines if the table should show the GLOBAL empty state placeholder.
   * This replaces the entire grid and is shown ONLY before the grid is initialized.
   */
  protected readonly showEmptyState = computed<boolean>(() => {
    if (this.loading()) return false;
    const emptyConfig = this.emptyState();
    if (!emptyConfig) return false;

    // If grid is initialized, don't show global empty state (show grid with overlay instead)
    if (this.isGridInitialized()) return false;

    return this.hasNoData();
  });

  /**
   * Determines if the grid should show an empty overlay INSIDE the grid area.
   * This keeps the grid structure visible (columns, headers) but shows empty message inside.
   */
  protected readonly showGridEmptyOverlay = computed<boolean>(() => {
    if (this.loading()) return false;
    const emptyConfig = this.emptyState();
    if (!emptyConfig) return false;

    // Only show grid overlay after initialization
    if (!this.isGridInitialized()) return false;

    return this.hasNoData();
  });

  /** Whether any rows are currently selected (across all pages) */
  protected readonly hasSelectedRows = computed(
    () => this.allPagesSelected() || this.persistentSelection().size > 0,
  );

  /** Whether bulk action selection mode is active */
  protected readonly isSelectionActive = this.tableService.selectionEnabled;

  /** Reference to the sticky bulk action bar for height measurement */
  private readonly bulkActionBar = viewChild('bulkActionBar', {
    read: ElementRef,
  });

  /** Set CSS variable for bulk action bar height so AG Grid header offsets below it */
  private readonly bulkBarHeightEffect = effect(() => {
    const isActive = this.isSelectionActive();
    const barEl = this.bulkActionBar()?.nativeElement as
      | HTMLElement
      | undefined;
    const container = this.gridContainer()?.nativeElement;
    if (!container) return;

    if (isActive && barEl) {
      requestAnimationFrame(() => {
        const height = barEl.offsetHeight;
        container.style.setProperty(
          '--ds-bulk-action-bar-height',
          `${height}px`,
        );
      });
    } else {
      container.style.removeProperty('--ds-bulk-action-bar-height');
    }
  });

  /** Determines if any filters are currently applied (including search) */
  protected readonly hasActiveFilters = computed<boolean>(() => {
    const selection = this.filtersSelection();
    return Object.keys(selection).some((key) => {
      const value = selection[key];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      // For numbers, dates, or other truthy values
      return value !== undefined && value !== null;
    });
  });

  /** Converts active filters to chips for the empty state display (including search) */
  protected readonly activeFilterChips = computed<NoDataFilterChip[]>(() => {
    const chips: NoDataFilterChip[] = [];
    const selection = this.filtersSelection();
    const filterConfigs = this.filters();

    for (const config of filterConfigs) {
      const value = selection[config.key];
      if (value == null || (Array.isArray(value) && value.length === 0))
        continue;

      // For search type, show search label
      if (config.type === 'search') {
        const searchValue = typeof value === 'string' ? value.trim() : '';
        if (searchValue) {
          chips.push({
            label: searchValue,
            removable: true,
            onRemove: () => this.removeFilter(config.key),
          });
        }
        continue;
      }

      // For chip-selector type, get labels from options
      if (config.type === 'chip-selector') {
        if (Array.isArray(value)) {
          for (const v of value) {
            const option = config.options.find((opt) => opt.value === v);
            chips.push({
              label: option?.displayedValue ?? String(v),
              removable: true,
              onRemove: () => this.removeChipSelectorValue(config.key, v),
            });
          }
        } else {
          const option = config.options.find((opt) => opt.value === value);
          chips.push({
            label: option?.displayedValue ?? String(value),
            removable: true,
            onRemove: () => this.removeFilter(config.key),
          });
        }
        continue;
      }

      // For school-structure type, show entity name
      if (config.type === 'school-structure' && Array.isArray(value)) {
        for (const v of value) {
          const entity = v as { id: number; type: string; name?: string };
          chips.push({
            label: entity.name ?? config.label,
            removable: true,
            onRemove: () => this.removeFilter(config.key),
          });
        }
        continue;
      }

      // For select type, look up display name from chipLabel override or static options
      if (config.type === 'select') {
        if (config.chipLabel) {
          chips.push({
            label: config.chipLabel,
            removable: true,
            onRemove: () => this.removeFilter(config.key),
          });
        } else if (config.config?.options && Array.isArray(value)) {
          // Multi-select: individual chip per selected value
          for (const id of value) {
            const option = config.config.options.find(
              (opt) => String(opt.id) === String(id),
            );
            chips.push({
              label: option?.display ?? String(id),
              removable: true,
              onRemove: () => this.removeChipSelectorValue(config.key, id),
            });
          }
        } else if (config.config?.options) {
          const option = config.config.options.find(
            (opt) => String(opt.id) === String(value),
          );
          chips.push({
            label: option?.display
              ? `${config.label}: ${option.display}`
              : `${config.label}: ${String(value)}`,
            removable: true,
            onRemove: () => this.removeFilter(config.key),
          });
        } else {
          chips.push({
            label: `${config.label}: ${String(value)}`,
            removable: true,
            onRemove: () => this.removeFilter(config.key),
          });
        }
        continue;
      }

      // For date type, format as dd/MM/yyyy
      if (config.type === 'date') {
        const d = value instanceof Date ? value : new Date(value as any);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        chips.push({
          label: `${config.label}: ${day}/${month}/${year}`,
          removable: true,
          onRemove: () => this.removeFilter(config.key),
        });
        continue;
      }

      // For date-range type, format as dd/MM/yyyy - dd/MM/yyyy
      if (config.type === 'date-range') {
        const r = value as { from: Date; to: Date } | null;
        if (r?.from && r?.to) {
          const fmt = (d: Date) => {
            const raw = d instanceof Date ? d : new Date(d);
            return `${raw.getDate().toString().padStart(2, '0')}/${(raw.getMonth() + 1).toString().padStart(2, '0')}/${raw.getFullYear()}`;
          };
          chips.push({
            label: `${config.label}: ${fmt(r.from)} - ${fmt(r.to)}`,
            removable: true,
            onRemove: () => this.removeFilter(config.key),
          });
        }
        continue;
      }

      // For other filter types, use filter label with value
      chips.push({
        label: `${config.label}: ${String(value)}`,
        removable: true,
        onRemove: () => this.removeFilter(config.key),
      });
    }

    return chips;
  });

  ngOnInit(): void {
    // Load saved state from localStorage if persistence is enabled
    this.loadSavedState();

    // Watch for document direction changes to update RTL state
    const observer = new MutationObserver(() => {
      const currentDir = document.documentElement.dir === 'rtl';
      if (this.isRtl() !== currentDir) {
        this.isRtl.set(currentDir);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    });

    // Clean up observer when component is destroyed
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  protected onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.refreshDatasource();
    // Force-apply column classes (ds-ag-pinned-*) on initial grid ready.
    // The columnClassRefreshEffect only fires when effectiveColumnDefs changes,
    // so if colDefs stabilised before gridApi was set the header/cell classes
    // need an explicit refresh here to guarantee they are rendered in the DOM.
    setTimeout(() => {
      this.gridApi?.refreshHeader();
      this.gridApi?.redrawRows();
    }, 0);
  }

  /** Re-apply auto-size strategy when row data changes so columns fit updated content
   *  (e.g. "Active" → "Deactivated" badge needs more width).
   *  When empty, just fit columns to grid width so all headers remain visible. */
  protected onRowDataUpdated(): void {
    const rowCount = this.gridApi?.getDisplayedRowCount() ?? 0;
    if (rowCount === 0) {
      // No rows — distribute columns to fill grid width so all headers are visible
      this.gridApi?.sizeColumnsToFit();
    } else {
      this.reApplyAutoSizeStrategy();
    }
  }

  /** Apply sort state programmatically (e.g. to revert after a failed API call) */
  public applySortState(
    sort: { field: string; direction: 'asc' | 'desc' } | null,
  ): void {
    if (!this.gridApi) return;
    const columnState = this.gridApi.getColumnState().map((col) => ({
      ...col,
      sort: col.colId === sort?.field ? sort.direction : null,
      sortIndex: col.colId === sort?.field ? 0 : null,
    }));
    this.gridApi.applyColumnState({ state: columnState });
  }

  /** Handle AG Grid sort change — extract the active sort column and emit */
  protected onSortChanged(event: SortChangedEvent): void {
    const columnState = event.api.getColumnState();
    const sortedCol = columnState.find((col) => col.sort != null);
    if (sortedCol && sortedCol.sort) {
      this.sortChanged.emit({
        field: sortedCol.colId,
        direction: sortedCol.sort as 'asc' | 'desc',
      });
    } else {
      this.sortChanged.emit(null);
    }
  }

  /** Handle column reorder via drag — update customization to reflect new order.
   *  Preserves hidden columns from existing customization so they don't reappear. */
  protected onDragStopped(event: DragStoppedEvent): void {
    const current = this.columnCustomization();
    const columnState = event.api.getColumnState();
    const tableConfig = this.config();
    const newOrder: DsAgGridColumnItem[] = [];

    // Build customization from AG Grid's visible column state
    for (const colState of columnState) {
      // Skip internal columns (selection, actions)
      if (colState.colId.startsWith('__ds_')) continue;

      let customItem: DsAgGridColumnItem;
      if (current) {
        const existingCustom = current.find((c) => c.id === colState.colId);
        if (existingCustom) {
          customItem = { ...existingCustom };
        } else {
          // New column not in customization yet
          const col = tableConfig.columns.find(
            (c) => (c.colId ?? c.field) === colState.colId,
          );
          if (!col) continue;
          const excludeFromCustomization = (col as any)
            .excludeFromCustomization;
          if (excludeFromCustomization) continue;
          const isPinned = !!col.lockPinned;
          customItem = {
            id: colState.colId,
            name: col.headerName ?? colState.colId,
            visible: !col.hide,
            canHide: !isPinned,
            canReorder: !isPinned,
          };
        }
      } else {
        // No existing customization - build from table config
        const col = tableConfig.columns.find(
          (c) => (c.colId ?? c.field) === colState.colId,
        );
        if (!col) continue;
        const excludeFromCustomization = (col as any).excludeFromCustomization;
        if (excludeFromCustomization) continue;

        const isPinned = !!col.lockPinned;
        customItem = {
          id: colState.colId,
          name: col.headerName ?? colState.colId,
          visible: !col.hide,
          canHide: !isPinned,
          canReorder: !isPinned,
        };
      }
      newOrder.push(customItem);
    }

    // Preserve hidden columns from existing customization.
    // AG Grid only knows about visible columns (hidden ones were excluded from
    // effectiveColumnDefs), so they won't appear in columnState.
    // Append them to keep their visibility state intact.
    if (current) {
      const visibleIds = new Set(newOrder.map((c) => c.id));
      for (const customCol of current) {
        if (!visibleIds.has(customCol.id)) {
          newOrder.push({ ...customCol });
        }
      }
    }

    this.columnCustomization.set(newOrder);
  }

  /** Handle row click: if click landed on actual rendered text, select it for copying.
   *  If click landed on whitespace (empty area after text), emit row click for navigation. */
  protected onRowClicked(event: RowClickedEvent): void {
    const mouseEvent = event.event as MouseEvent | undefined;
    const target = mouseEvent?.target as HTMLElement | undefined;
    if (!mouseEvent || !target) {
      this.rowClicked.emit(event.data);
      return;
    }

    // Suppress row click entirely for checkbox and actions columns
    // These columns have their own interactive behavior (toggle / menu)
    const cell = target.closest('.ag-cell') as HTMLElement | null;
    const colId = cell?.getAttribute('col-id');
    if (colId === '__ds_selection__' || colId === '__ds_actions__') {
      return;
    }

    // Check if click landed on actual visible text within the cell.
    // Use the closest text element to the click target (handles title/subtitle separately),
    // falling back to .line-clamp-2 or first child element.
    const clickedText = target.closest(
      '.ds-ag-cell-text, .line-clamp-2',
    ) as HTMLElement | null;
    const textContainer =
      clickedText ??
      (cell?.querySelector(
        '.ds-ag-cell-text, .line-clamp-2',
      ) as HTMLElement | null) ??
      (cell?.firstElementChild as HTMLElement | null);
    if (textContainer && this.isClickOnText(mouseEvent, textContainer)) {
      // Select the clicked text element for easy copying
      const range = document.createRange();
      range.selectNodeContents(clickedText ?? textContainer);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return; // Don't emit row click — text was selected
    }

    // Click was on whitespace — emit row click for navigation
    this.rowClicked.emit(event.data);
  }

  /** Check if a click event landed on actual rendered text within an element.
   *  Walks text nodes and checks if click coordinates fall within their bounding rects. */
  private isClickOnText(event: MouseEvent, element: HTMLElement): boolean {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNode(node);
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /** Tracks if bulk action bar is stuck at top (scrolled past its natural position) */
  protected readonly isBulkBarStuck = signal(false);

  protected onBodyScroll(event: Event): void {
    const target = event.target as HTMLElement;
    this.isScrolled.set(target.scrollTop > 0);

    // Check if bulk action bar is stuck by comparing scroll position to header height
    const barEl = this.bulkActionBar()?.nativeElement as
      | HTMLElement
      | undefined;
    if (barEl && this.isSelectionActive()) {
      const headerEl = target.querySelector(
        '.ds-ag-grid-table-header',
      ) as HTMLElement;
      const headerHeight = headerEl?.offsetHeight ?? 0;
      this.isBulkBarStuck.set(target.scrollTop >= headerHeight);
    } else {
      this.isBulkBarStuck.set(false);
    }
  }

  protected onSelectionChanged(): void {
    // Skip if we're restoring selection (to prevent recursive updates)
    if (this.isRestoringSelection) return;

    const idField = this.rowIdField();
    const currentPageRows = this.gridApi?.getSelectedRows() ?? [];
    const currentPageRowIds = new Set(
      currentPageRows.map((row) => String(row[idField])),
    );

    // Get all visible rows to track deselections
    const visibleRows: any[] = [];
    this.gridApi?.forEachNode((node) => {
      if (node.data) visibleRows.push(node.data);
    });

    // Handle "all pages selected" mode: track exclusions only
    if (this.allPagesSelected()) {
      const newExcluded = new Set(this.excludedRowIds());
      for (const row of visibleRows) {
        const rowId = String(row[idField]);
        if (!currentPageRowIds.has(rowId)) {
          // Row was deselected → add to exclusions
          newExcluded.add(rowId);
        } else {
          // Row was re-selected → remove from exclusions
          newExcluded.delete(rowId);
        }
      }
      this.excludedRowIds.set(newExcluded);
      // Update the display count: totalItems - excluded
      const totalItems = this.pagination()?.totalItems;
      if (totalItems != null) {
        this.tableService.setAllPagesSelectedCount(
          totalItems - newExcluded.size,
        );
      }
      // Emit the updated selection state and refresh the header checkbox
      this.emitSelectionState();
      setTimeout(() => this.gridApi?.refreshHeader(), 0);
      return; // Don't update persistentSelection in all-pages mode
    }

    // Update persistent selection (non-all-pages mode only)
    const newSelection = new Map(this.persistentSelection());

    // Add newly selected rows from current page
    for (const row of currentPageRows) {
      const rowId = String(row[idField]);
      newSelection.set(rowId, row);
    }

    // Remove deselected rows (rows that are visible but not selected)
    for (const row of visibleRows) {
      const rowId = String(row[idField]);
      if (!currentPageRowIds.has(rowId)) {
        newSelection.delete(rowId);
      }
    }

    this.persistentSelection.set(newSelection);

    // Get all selected rows (from all pages)
    const allSelectedRows = Array.from(newSelection.values());
    this.tableService.setSelectedRows(allSelectedRows);
    this.selectionChanged.emit(allSelectedRows);
    this.emitSelectionState();
  }

  /** Emits the current selection state for cross-page bulk operations */
  private emitSelectionState(): void {
    if (this.allPagesSelected()) {
      this.selectionStateChanged.emit({
        mode: 'all',
        selectedIds: [],
        excludedIds: Array.from(this.excludedRowIds()),
      });
    } else {
      const selectedIds = Array.from(this.persistentSelection().keys());
      this.selectionStateChanged.emit({
        mode: selectedIds.length > 0 ? 'some' : 'none',
        selectedIds,
        excludedIds: [],
      });
    }
  }

  /** Returns the row ID callback for AG Grid */
  protected getRowId = (params: { data: any }): string => {
    const idField = this.rowIdField();
    return String(params.data[idField]);
  };

  protected onBulkActionClick(payload: {
    action: DsAgGridBulkAction<any>;
    rows: any[];
  }): void {
    this.bulkActionClick.emit(payload);
  }

  protected onCloseSelection(): void {
    this.clearSelection();
  }

  /** Programmatically clear all selection state and deselect all rows */
  public clearSelection(): void {
    this.tableService.clearSelection();
    this.persistentSelection.set(new Map());
    this.allPagesSelected.set(false);
    this.excludedRowIds.set(new Set());
    this.gridApi?.deselectAll();
    this.closeSelection.emit();
    this.emitSelectionState();
  }

  protected async onCustomizeColumns(): Promise<void> {
    // Build column items for the modal
    const tableConfig = this.config();
    const currentCustomization = this.columnCustomization();

    // Start with the original columns
    let columns: DsAgGridColumnItem[];

    if (currentCustomization) {
      // Use existing customization
      columns = currentCustomization.map((col) => ({ ...col }));
    } else {
      // Build from table config, filtering out columns excluded from customization
      columns = tableConfig.columns
        .filter((col) => {
          // Exclude columns marked with excludeFromCustomization (e.g., columns shown as part of another cell)
          const excludeFromCustomization = (
            col as ColDef & { excludeFromCustomization?: boolean }
          ).excludeFromCustomization;
          return !excludeFromCustomization;
        })
        .map((col) => {
          const colId = col.colId ?? col.field ?? '';
          const isPinned = !!col.lockPinned;
          return {
            id: colId,
            name: col.headerName ?? colId,
            visible: !col.hide,
            canHide: !isPinned, // Pinned columns cannot be hidden
            canReorder: !isPinned, // Pinned columns cannot be reordered
          };
        });
    }

    const modalRef = await this.modalService.open<
      { columns: DsAgGridColumnItem[] },
      DsAgGridCustomizeColumnsResult
    >({
      component: DsAgGridCustomizeColumnsComponent,
      componentProps: { columns },
      headerConfig: {
        title:
          this.translateService.translate('global.custom_columns.txt') ||
          'Custom columns',
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.translateService.translate('global.save.btn') || 'Save',
        },
        fullWidthButtons: true,
      },
      size: 'lg',
      contentClass: 'px-ds-xl py-ds-xl',
    });

    const result = await modalRef.onDismiss();

    if (result.role === 'confirm' && result.data) {
      this.columnCustomization.set(result.data.columns);
    }

    // Also emit the event for external handling if needed
    this.customizeColumnsClick.emit();
  }

  protected onFiltersChange(value: DsFiltersValue): void {
    this.filtersChange.emit(value);
  }

  protected onClearFilters(): void {
    this.clearFilters.emit();
  }

  /** Removes a filter by key and emits the updated selection */
  protected removeFilter(key: string): void {
    const current = this.filtersSelection();
    const updated = { ...current };
    delete updated[key];
    this.filtersChange.emit(updated);
  }

  /** Removes a specific value from a chip-selector filter */
  protected removeChipSelectorValue(key: string, valueToRemove: unknown): void {
    const current = this.filtersSelection();
    const currentValue = current[key];
    if (!Array.isArray(currentValue)) return;

    const filteredValue = currentValue.filter((v) => v !== valueToRemove);
    const updated: DsFiltersValue = {
      ...current,
      [key]: filteredValue as typeof currentValue,
    };
    this.filtersChange.emit(updated);
  }

  protected zoomOut(): void {
    // Round to avoid floating-point precision issues (0.8 - 0.1 = 0.7000000000000001)
    const rawNext = this.zoomLevel() - this.zoomStep();
    const next = this.clampZoom(Math.round(rawNext * 100) / 100);
    this.zoomLevel.set(next);
    this.zoomChange.emit(next);
    this.saveZoom(next);
  }

  protected zoomIn(): void {
    // Round to avoid floating-point precision issues
    const rawNext = this.zoomLevel() + this.zoomStep();
    const next = this.clampZoom(Math.round(rawNext * 100) / 100);
    this.zoomLevel.set(next);
    this.zoomChange.emit(next);
    this.saveZoom(next);
  }

  /** Reset zoom to 100% (called on double-click) */
  protected resetZoom(): void {
    const defaultZoom = 1;
    if (this.zoomLevel() !== defaultZoom) {
      this.zoomLevel.set(defaultZoom);
      this.zoomChange.emit(defaultZoom);
      this.saveZoom(defaultZoom);
    }
  }

  /** Persist zoom level to localStorage */
  private saveZoom(zoom: number): void {
    const persistState = this.persistState();
    if (persistState === false) return;
    const namespace =
      typeof persistState === 'string' ? persistState : undefined;
    this.tableStateService.saveState({ zoom }, namespace);
  }

  protected paginateBackward(): void {
    const paginate = this.effectivePagination();
    if (!paginate || paginate.pageNumber <= 1) return;

    const newPageNumber = paginate.pageNumber - 1;

    // Update internal state if no external pagination is provided
    if (!this.pagination()) {
      this.internalPageNumber.set(newPageNumber);
    }

    this.paginationChanged.emit({
      pageNumber: newPageNumber,
      itemsPerPage: paginate.itemsPerPage,
    });
  }

  protected paginateForward(): void {
    const paginate = this.effectivePagination();
    if (!paginate || paginate.pageNumber >= paginate.totalPages) return;

    const newPageNumber = paginate.pageNumber + 1;

    // Update internal state if no external pagination is provided
    if (!this.pagination()) {
      this.internalPageNumber.set(newPageNumber);
    }

    this.paginationChanged.emit({
      pageNumber: newPageNumber,
      itemsPerPage: paginate.itemsPerPage,
    });
  }

  protected paginateToPage(pageNumber: number): void {
    const paginate = this.effectivePagination();
    if (!paginate || pageNumber < 1 || pageNumber > paginate.totalPages) return;

    // Update internal state if no external pagination is provided
    if (!this.pagination()) {
      this.internalPageNumber.set(pageNumber);
    }

    this.paginationChanged.emit({
      pageNumber,
      itemsPerPage: paginate.itemsPerPage,
    });
  }

  protected onPerPageChange(item: PopupItem): void {
    const paginate = this.effectivePagination();
    if (!paginate || !item.id) return;

    const newItemsPerPage = parseInt(item.id, 10);
    if (isNaN(newItemsPerPage)) return;

    // Update internal state if no external pagination is provided
    if (!this.pagination()) {
      this.internalItemsPerPage.set(newItemsPerPage);
      this.internalPageNumber.set(1); // Reset to first page
    }

    this.paginationChanged.emit({
      pageNumber: 1, // Reset to first page when changing items per page
      itemsPerPage: newItemsPerPage,
    });
  }

  private refreshDatasource(): void {
    const datasource = this.datasource();
    if (this.gridApi && datasource && this.rowModelType() === 'infinite') {
      this.gridApi.setGridOption('datasource', datasource);
    }
  }

  private generatePageList(
    totalPages: number,
    currentPage: number,
  ): (number | -1)[] {
    if (totalPages < 6) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3 || currentPage >= totalPages - 2) {
      const pageList: (number | -1)[] = [];
      for (let i = 1; i <= 3; i++) pageList.push(i);
      pageList.push(-1);
      for (let i = totalPages - 2; i <= totalPages; i++) pageList.push(i);
      return pageList;
    }

    return [
      1,
      -1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      -1,
      totalPages,
    ];
  }

  /** Appends a CSS class to a column's headerClass and cellClass */
  private withColumnClass(
    col: DsAgGridColDef,
    className: string,
  ): DsAgGridColDef {
    const append = (
      existing: string | string[] | undefined,
    ): string | string[] => {
      if (!existing) return className;
      if (Array.isArray(existing)) return [...existing, className];
      return `${existing} ${className}`;
    };
    return {
      ...col,
      headerClass: append(col.headerClass as string | string[] | undefined),
      cellClass: append(col.cellClass as string | string[] | undefined),
    };
  }

  /** Re-applies the auto-size strategy after dynamic column changes (e.g. customize columns).
   *  AG Grid only applies autoSizeStrategy on initial render; this ensures columns stay sized
   *  to content (fitCellContents) or grid width (fitGridWidth) after column def updates.
   *  For fitCellContents, only calls sizeColumnsToFit() if columns don't fill the grid width
   *  (i.e., there's empty space after hiding columns). */
  private reApplyAutoSizeStrategy(): void {
    const strategy = this.autoSizeStrategy();
    if (!this.gridApi || !strategy) return;

    if (strategy.type === 'fitCellContents') {
      this.gridApi.autoSizeAllColumns();
      // Only fill available width if columns don't already fill the grid
      // (avoids shrinking columns after drag when they should overflow with scroll)
      setTimeout(() => {
        if (!this.gridApi) return;
        const columnState = this.gridApi.getColumnState();
        const totalWidth = columnState
          .filter((col) => !col.hide)
          .reduce((sum, col) => sum + (col.width || 0), 0);
        const gridElement = this.gridContainer()?.nativeElement;
        if (!gridElement) return;
        // Calculate target width accounting for zoom:
        // At zoom 1.3, columns should fill containerWidth / 1.3 so they render
        // as full width visually after zoom is applied.
        const zoom = this.zoomLevel() || 1;
        const gridWidth = gridElement.offsetWidth / zoom;

        // Only call sizeColumnsToFit if there's empty space
        if (totalWidth < gridWidth) {
          this.gridApi.sizeColumnsToFit();
        }
      }, 0);
    } else if (strategy.type === 'fitGridWidth') {
      this.gridApi.sizeColumnsToFit();
    }
  }

  private clampZoom(value: number): number {
    return Math.min(this.maxZoom(), Math.max(this.minZoom(), value));
  }

  /** Refresh AG Grid header/cells when column definitions change to ensure updated headerClass/cellClass are applied.
   *  AG Grid preserves existing column state and may not re-render with new classes on column def updates.
   *  Also re-applies the auto-size strategy so horizontal scroll is preserved after customize columns. */
  private readonly columnClassRefreshEffect = effect(() => {
    this.effectiveColumnDefs();
    if (this.gridApi) {
      setTimeout(() => {
        this.gridApi?.refreshHeader();
        this.gridApi?.redrawRows();
        this.reApplyAutoSizeStrategy();
      }, 0);
    }
  });

  private readonly datasourceEffect = effect(() => {
    this.datasource();
    this.rowModelType();
    this.refreshDatasource();
  });

  private readonly zoomEffect = effect(() => {
    const next = this.clampZoom(this.initialZoom());
    this.zoomLevel.set(next);
  });

  /** Refresh grid layout when zoom changes.
   *  The wrapper stays at 100% width. After CSS zoom is applied:
   *  - At zoom >= 1 (zoom in): size columns to fill (containerWidth / zoom) to prevent white space
   *  - At zoom < 1 (zoom out): let columns stay at content width so more columns fit naturally */
  private readonly zoomRefreshEffect = effect(() => {
    const zoom = this.zoomLevel();
    if (!this.gridApi) return;

    // Wait for CSS zoom to be applied and trigger layout recalc
    setTimeout(() => {
      if (!this.gridApi) return;

      const gridElement = this.gridContainer()?.nativeElement;
      if (gridElement) {
        // Force layout recalculation before measuring (helps Safari)
        void gridElement.offsetHeight;
        void gridElement.offsetWidth;
      }

      const strategy = this.autoSizeStrategy();
      if (strategy?.type === 'fitCellContents') {
        // For fitCellContents: auto-size to content first
        this.gridApi.autoSizeAllColumns();

        // At zoom out (< 1): fill remaining space if columns don't fill the grid
        if (zoom < 1) {
          setTimeout(() => {
            if (!this.gridApi) return;
            const currentState = this.gridApi.getColumnState();
            const totalWidth = currentState
              .filter((c) => !c.hide)
              .reduce((sum, c) => sum + (c.width || 0), 0);
            const gridWidth = (gridElement?.offsetWidth ?? 0) / zoom;
            if (totalWidth < gridWidth) {
              this.gridApi.sizeColumnsToFit();
            }
          }, 150);
          return;
        }

        // Then scale columns to fill the zoom-adjusted width (zoom >= 1 only)
        setTimeout(() => {
          if (!this.gridApi) return;

          const allColumns = this.gridApi.getAllDisplayedColumns();
          if (!allColumns || allColumns.length === 0) return;

          // Get current column state and total width
          const currentState = this.gridApi.getColumnState();
          const currentTotal = currentState
            .filter((c) => !c.hide)
            .reduce((sum, c) => sum + (c.width || 0), 0);

          // Get container width (wrapper offsetWidth = 100% of parent)
          const wrapperElement = gridElement?.querySelector(
            '.ds-ag-grid-table-zoom-wrapper',
          ) as HTMLElement;
          const containerWidth =
            wrapperElement?.offsetWidth || gridElement?.offsetWidth || 1000;

          // Calculate target width accounting for zoom:
          // At zoom 1.3, we want columns to fill containerWidth / 1.3 internally,
          // so after zoom they render as containerWidth visually.
          const targetWidth = containerWidth / zoom;

          if (currentTotal >= targetWidth) {
            // Columns already fill or exceed target width
            return;
          }

          // Calculate scale factor to reach target width
          const scaleFactor = targetWidth / currentTotal;

          // Apply proportional widths to all columns
          const newState = currentState.map((col) => {
            if (col.hide) return col;
            const newWidth = Math.floor((col.width || 0) * scaleFactor);
            return { ...col, width: newWidth };
          });

          this.gridApi.applyColumnState({ state: newState });
        }, 150);
      } else {
        // For fitGridWidth or no strategy: just fit to width
        this.gridApi.sizeColumnsToFit();
      }
    }, 350);
  });

  /** Push overlay params to service so the overlay component can read them reactively */
  private readonly overlayParamsEffect = effect(() => {
    const params = this.noRowsOverlayParams();
    this.tableService.noRowsOverlayParams.set(params);
  });

  /** Show/hide AG Grid loading overlay via gridOption when loading state changes */
  private readonly loadingOverlayEffect = effect(() => {
    const isLoading = this.loading();
    if (!this.gridApi) return;
    this.gridApi.setGridOption('loading', isLoading);
  });

  /** Sync internal items per page with input value */
  private readonly itemsPerPageEffect = effect(() => {
    const inputValue = this.itemsPerPage();
    this.internalItemsPerPage.set(inputValue);
  });

  /** Reset page to 1 when rowData changes (e.g., filters are applied) */
  private readonly rowDataChangeEffect = effect(() => {
    const currentLength = this.rowData().length;
    // Only reset if data count changed (indicates filtering)
    if (this.previousRowDataLength !== currentLength) {
      this.previousRowDataLength = currentLength;
      // Only reset if not on page 1 already
      if (this.internalPageNumber() !== 1) {
        this.internalPageNumber.set(1);
      }
    }
  });

  /**
   * Restore selection when paginated data changes.
   * This ensures rows that were selected on other pages remain selected
   * when navigating back to their page.
   */
  private readonly selectionRestorationEffect = effect(() => {
    // Only react to paginated data changes (page navigation / data refresh).
    // Read other signals untracked so that changes to persistentSelection
    // or excludedRowIds (from onSelectionChanged) do NOT re-trigger this
    // effect — that would cause circular updates.
    const paginatedData = this.paginatedRowData();

    const selection = untracked(() => this.persistentSelection());
    const allPages = untracked(() => this.allPagesSelected());
    const excluded = untracked(() => this.excludedRowIds());

    // Only restore if we have persistent selections (or all-pages mode) and grid is ready
    if (!this.gridApi || (selection.size === 0 && !allPages)) return;

    const idField = this.rowIdField();

    // Set the flag BEFORE setTimeout so that any selectionChanged events
    // fired by AG Grid during data update (before our restoration runs)
    // are also suppressed. Without this, AG Grid clears selections when
    // new rowData arrives, fires selectionChanged with 0 selected rows,
    // and our handler incorrectly treats all rows as user-deselected.
    this.isRestoringSelection = true;

    // Use setTimeout to ensure grid has rendered the new data
    setTimeout(() => {
      this.gridApi?.forEachNode((node) => {
        if (node.data) {
          const rowId = String(node.data[idField]);
          let isSelected: boolean;
          if (allPages) {
            // In all-pages mode, select everything except excluded IDs
            isSelected = !excluded.has(rowId);
          } else {
            isSelected = selection.has(rowId);
          }
          node.setSelected(isSelected, false, 'api');
        }
      });
      // Delay resetting the flag so AG Grid's async selectionChanged
      // events (triggered by setSelected) are also suppressed.
      setTimeout(() => {
        this.isRestoringSelection = false;
        // Refresh header to ensure checkbox reflects correct state
        // after restoration completes.
        this.gridApi?.refreshHeader();
      }, 0);
    }, 0);
  });

  /** Effect to auto-save column customization changes to localStorage */
  private readonly statePersistenceEffect = effect(() => {
    const persistState = this.persistState();
    if (persistState === false) return;

    const customization = this.columnCustomization();
    if (!customization) return;

    const namespace =
      typeof persistState === 'string' ? persistState : undefined;

    // Save column customization to localStorage
    this.tableStateService.saveState(
      {
        columnCustomization: {
          columns: customization.map((col, index) => ({
            id: col.id,
            visible: col.visible,
            order: index,
          })),
        },
      },
      namespace,
    );
  });

  /**
   * Load saved state from localStorage and apply to component
   */
  private loadSavedState(): void {
    const persistState = this.persistState();
    if (persistState === false) return;

    const namespace =
      typeof persistState === 'string' ? persistState : undefined;
    const savedState = this.tableStateService.loadState(namespace);

    // Apply saved column customization
    if (savedState.columnCustomization) {
      const tableConfig = this.config();
      const merged = this.tableStateService.mergeColumnState(
        savedState.columnCustomization.columns,
        tableConfig.columns,
      );
      this.columnCustomization.set(merged);
    }

    // Restore saved zoom level
    if (savedState.zoom != null) {
      this.zoomLevel.set(this.clampZoom(savedState.zoom));
    }
  }
}
