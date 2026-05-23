import { TemplateRef, Type } from '@angular/core';
import {
  ColDef,
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
  SizeColumnsToFitProvidedWidthStrategy,
} from 'ag-grid-community';
import { Observable } from 'rxjs';
import { DsIcon } from '@ds/icon/icon.component';
import { DsAgGridPinnedPosition } from '../ag-grid-table/ds-ag-grid-table.model';
import { DsCellRendererParams } from '../ag-grid-table/ds-ag-grid-cell-renderer.component';
import { DsActionButtonConfig } from '../ag-grid-table/ds-ag-grid-action-button-cell.component';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '../filter-panel/ds-filter-panel.model';
import { IPagination } from '@shared/interfaces/api.interface';

// ============================================================================
// Mobile Slot Types - for mapping columns to mobile card sections
// ============================================================================

/**
 * Mobile slot types for mapping columns to card sections
 */
export type DsMobileSlot =
  | 'title' // Primary display name (single)
  | 'subtitle' // Secondary text below title (single)
  | 'badge' // Badge chips (multiple allowed)
  | 'metadata' // Key-value pairs in the details section
  | 'action'; // Action button (handled separately)

/**
 * Badge style variants for mobile badges
 */
export type DsBadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

// ============================================================================
// Column Configuration
// ============================================================================

/**
 * Mobile-specific configuration for a column
 * NOTE: Columns are HIDDEN on mobile by default. To show a column on mobile,
 * explicitly set the `slot` property (e.g., slot: 'title', 'subtitle', 'badge', or 'metadata').
 */
export interface DsColumnMobileConfig {
  /** Which slot this column maps to on mobile. If not set, column is hidden on mobile. */
  slot?: DsMobileSlot;
  /** Order within the slot (for metadata items) */
  order?: number;
  /** Badge variant style (only for badge slot) */
  badgeVariant?:
    | DsBadgeVariant
    | ((value: unknown, row: unknown) => DsBadgeVariant);
  /** Custom value formatter for mobile display */
  mobileValueFormatter?: (value: unknown, row: unknown) => string;
  /** Render subtitle as a badge chip. Set to true for default 'info' variant, or specify a variant. */
  subtitleAsBadge?: boolean | DsBadgeVariant;
  /** @deprecated No longer used. Columns are hidden by default unless slot is specified. */
  hideOnMobile?: boolean;
}

/**
 * Extended column definition that works for both table and mobile list
 * Extends AG Grid ColDef with mobile-specific configurations and RTL-aware pinned positioning
 */
export interface DsResponsiveColumn<T = unknown> extends Omit<
  ColDef,
  'field' | 'pinned'
> {
  /** Column field/key - maps to row data property */
  field: string;
  /** Display header text (used for table header and metadata labels) */
  headerName?: string;
  /** Header translation key (alternative to headerName) */
  headerKey?: string;
  /** RTL-aware pinned position: 'start' (left in LTR, right in RTL), 'end' (right in LTR, left in RTL), or physical 'left'/'right' */
  pinned?: DsAgGridPinnedPosition | boolean | null;
  /** Mobile-specific configuration */
  mobile?: DsColumnMobileConfig;
  /** Custom cell renderer component for table */
  cellRenderer?: Type<unknown>;
  /** Custom cell renderer params */
  cellRendererParams?: Record<string, unknown>;
  /**
   * Built-in design-system cell renderer config.
   * When set, the responsive table automatically uses `DsAgGridCellRendererComponent`
   * with these params — no need to import the renderer yourself.
   * Supports types: 'badge' (colored pill chips), 'phone', 'text'.
   */
  dsCell?: DsCellRendererParams;
  /** Value formatter for both table and mobile (unless mobile overrides) */
  valueFormatter?: (params: { value: unknown; data: T }) => string;
  /** Exclude this column from the "Customize Columns" modal (e.g., for columns that are already displayed as part of another cell) */
  excludeFromCustomization?: boolean;
  /**
   * When true, bypasses the default 320px max-width cap so the column auto-sizes
   * to fit its actual content. Use for custom cell renderers that need more space.
   */
  fitContent?: boolean;
  /**
   * Declarative action-button config. When set, the table automatically wires
   * `DsAgGridActionButtonCellComponent` — no need to import the renderer.
   * Use `size` to control button size (defaults to 'sm').
   */
  actionButtons?: {
    actions: DsActionButtonConfig<T>[];
    size?: 'sm' | 'md' | 'lg';
  };
}

// ============================================================================
// Action Configuration
// ============================================================================

/**
 * Row action item configuration
 */
export interface DsRowAction<T = unknown> {
  /** Unique action identifier */
  id: string;
  /** Icon for the action */
  icon?: DsIcon;
  /** Label text */
  label: string;
  /** Whether this is a primary action shown as button on mobile */
  isPrimaryMobile?: boolean;
  /** Action handler - receives the row data */
  action?: (row: T) => void;
  /** Visibility check - can be boolean or function returning boolean */
  visible?: boolean | ((row: T) => boolean);
  /** Disabled state - can be boolean or function returning boolean */
  disabled?: boolean | ((row: T) => boolean);
}

/**
 * Bulk action configuration
 */
export interface DsBulkAction<T = unknown> {
  id: string;
  label: string;
  icon?: DsIcon;
  /** Label shown when action is active/processing */
  activeLabel?: string;
  /** Whether the action is disabled - can be boolean or function receiving selected rows */
  disabled?: boolean | ((rows: T[]) => boolean);
  disabledReason?: string | ((rows: T[]) => string | undefined);
  action?: (rows: T[]) => void;
  visible?: boolean | ((rows: T[]) => boolean);
  /** Whether the action is currently loading (e.g. API call in progress) */
  loading?: boolean;
}

// ============================================================================
// Template Configuration
// ============================================================================

/**
 * Context provided to mobile item template
 */
export interface DsMobileItemContext<T = unknown> {
  /** The row data */
  $implicit: T;
  data: T;
  /** Computed title from columns */
  title: string;
  /** Computed subtitle from columns */
  subtitle: string;
  /** Computed badges */
  badges: Array<{ label: string; variant: DsBadgeVariant }>;
  /** Computed metadata key-value pairs */
  metadata: Array<{ label: string; value: string }>;
  /** Whether this row is selected */
  selected: boolean;
  /** Index of the row */
  index: number;
}

/**
 * Context provided to mobile footer template
 */
export interface DsMobileFooterContext<T = unknown> {
  $implicit: T;
  data: T;
  /** Row actions for this item */
  actions: DsRowAction<T>[];
}

// ============================================================================
// Sort Configuration
// ============================================================================

/**
 * Sort direction
 */
export type DsSortDirection = 'asc' | 'desc';

/**
 * Current sort state
 */
export interface DsSortState {
  /** Column field being sorted */
  field: string;
  /** Sort direction */
  direction: DsSortDirection;
}

/**
 * Sortable column option for mobile sort sheet
 */
export interface DsSortableColumn {
  /** Column field */
  field: string;
  /** Display label */
  label: string;
}

// ============================================================================
// Empty State Configuration
// ============================================================================

/**
 * Empty state configuration
 */
export interface DsEmptyStateConfig {
  /** Path to the empty state image */
  imagePath?: string;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Label for filtered by section */
  filteredByLabel?: string;
}

// ============================================================================
// Data Source Configuration
// ============================================================================

/**
 * Request parameters sent to the dataSource function
 * Contains all the info needed to fetch/filter/sort data
 */
export interface DsDataSourceRequest {
  /** Current page number (1-based) */
  page: number;
  /** Items per page */
  perPage: number;
  /** Current sort state */
  sort: DsSortState | null;
  /** All filter values as key-value pairs (same as DsFiltersValue) */
  filters: DsFiltersValue;
}

/**
 * Response shape from the dataSource function
 */
export interface DsDataSourceResponse<T> {
  /** Array of row data */
  data: T[];
  /** Pagination info (optional - if not provided, no pagination/infinite scroll) */
  pagination?: IPagination;
}

// ============================================================================
// Main Configuration
// ============================================================================

/**
 * Complete configuration for the responsive table/list component
 * This single config drives both desktop table and mobile list views
 */
export interface DsResponsiveTableConfig<T = Record<string, unknown>> {
  /** Column definitions - drive both table columns and mobile card mapping */
  columns: DsResponsiveColumn<T>[];

  /**
   * Data source function - receives request params and returns Observable of response.
   * When provided, the component handles all data fetching internally.
   * When not provided, use [rowData], [pagination], [loading] inputs for manual control.
   */
  dataSource?: (
    request: DsDataSourceRequest,
  ) => Observable<DsDataSourceResponse<T>>;

  /** Filter configurations shown in DsFilterPanel */
  filters?: DsFilterConfig[];

  /** Initial filter values to seed before first data fetch (dataSource mode only) */
  initialFilters?: DsFiltersValue;

  /** Row-level actions (shown in action menu) */
  rowActions?: DsRowAction<T>[];

  /** Bulk actions for multi-select */
  bulkActions?: DsBulkAction<T>[];

  /** Empty state configuration */
  emptyState?: DsEmptyStateConfig;

  /**
   * Mobile-specific overrides
   */
  mobile?: {
    /** Custom item template - replaces default card layout */
    itemTemplate?: TemplateRef<DsMobileItemContext<T>>;
    /** Custom footer template for card actions */
    footerTemplate?: TemplateRef<DsMobileFooterContext<T>>;
    /** Whether to show the details section background */
    showMetadataBackground?: boolean;
    /** Primary floating action button configuration */
    primaryAction?: {
      /** Label for the action */
      label: string;
      /** Icon for the button */
      icon?: DsIcon;
      /** Action handler */
      action?: () => void;
    };
    /** Enable sort button on mobile (shows between search and filter) */
    showSortButton?: boolean;
  };

  /**
   * Table-specific overrides
   */
  table?: {
    /** Default column definition overrides */
    defaultColDef?: Partial<ColDef>;
    /** Label for customize columns button */
    customizeColumnsLabel?: string;
    /** Show zoom controls (-A / +A). Defaults to true. */
    showZoom?: boolean;
    /** Enable pointer cursor on rows to indicate click action. Defaults to false. */
    rowClickable?: boolean;
    /** Show pagination footer. Defaults to true. Set to false to show all rows without pagination. */
    showPagination?: boolean;
    /** Auto-size strategy for columns - fitCellContents sizes columns to fit their content */
    autoSizeStrategy?:
      | SizeColumnsToFitGridStrategy
      | SizeColumnsToFitProvidedWidthStrategy
      | SizeColumnsToContentStrategy;
  };

  /**
   * Selection configuration
   */
  selection?: {
    /** Selection mode */
    mode?: 'single' | 'multiple' | 'none';
    /** Entity label for selection count (e.g., "Students") */
    entityLabel?: string;
    /** Label prefix for selection (e.g., "Select students to") */
    selectionLabel?: string;
    /** Callback to determine if a row can be selected. Rows that return false will have a disabled checkbox. */
    isRowSelectable?: (row: T) => boolean;
  };

  /**
   * Control state persistence (column order, visibility, filters, sort).
   * State is saved to localStorage and restored on page reload.
   * - `true` (default): Auto-generate key from URL
   * - `string`: Use custom namespace for storage key (e.g., 'students-tab')
   * - `false`: Disable persistence
   */
  persistState?: boolean | string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Event emitted when bulk action is triggered
 */
export interface DsBulkActionEvent<T = unknown> {
  action: DsBulkAction<T>;
  rows: T[];
}

/**
 * Event emitted when infinite scroll requests more data
 */
export interface DsLoadMoreEvent {
  pageNumber: number;
  itemsPerPage: number;
  /** Call this when loading is complete */
  complete: () => void;
  /** Call this to disable further loading */
  disable: () => void;
}

/**
 * Event emitted when sort changes
 */
export interface DsSortChangeEvent {
  /** Current sort state (null if no sort applied) */
  sort: DsSortState | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract title column from config
 */
export function getTitleColumn<T>(
  columns: DsResponsiveColumn<T>[],
): DsResponsiveColumn<T> | undefined {
  return columns.find((col) => col.mobile?.slot === 'title');
}

/**
 * Extract subtitle column from config
 */
export function getSubtitleColumn<T>(
  columns: DsResponsiveColumn<T>[],
): DsResponsiveColumn<T> | undefined {
  return columns.find((col) => col.mobile?.slot === 'subtitle');
}

/**
 * Extract badge columns from config
 */
export function getBadgeColumns<T>(
  columns: DsResponsiveColumn<T>[],
): DsResponsiveColumn<T>[] {
  return columns
    .filter((col) => col.mobile?.slot === 'badge')
    .sort((a, b) => (a.mobile?.order ?? 0) - (b.mobile?.order ?? 0));
}

/**
 * Extract metadata columns from config
 * Only columns explicitly marked with mobile.slot === 'metadata' will show on mobile
 */
export function getMetadataColumns<T>(
  columns: DsResponsiveColumn<T>[],
): DsResponsiveColumn<T>[] {
  return columns
    .filter((col) => col.mobile?.slot === 'metadata')
    .sort((a, b) => (a.mobile?.order ?? 999) - (b.mobile?.order ?? 999));
}

/**
 * Get value from row data by column field
 */
export function getColumnValue<T>(
  column: DsResponsiveColumn<T>,
  row: T,
): unknown {
  const field = column.field;
  if (!field) return undefined;

  // Support nested fields like "user.name"
  const parts = field.split('.');
  let value: unknown = row;
  for (const part of parts) {
    if (value == null) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/**
 * Format column value for display
 */
export function formatColumnValue<T>(
  column: DsResponsiveColumn<T>,
  row: T,
  forMobile = false,
): string {
  const rawValue = getColumnValue(column, row);

  // Use mobile-specific formatter if available and rendering for mobile
  if (forMobile && column.mobile?.mobileValueFormatter) {
    return column.mobile.mobileValueFormatter(rawValue, row);
  }

  // Use badge labelFn if available (dsCell badge config)
  if (column.dsCell?.type === 'badge' && column.dsCell.badge?.labelFn) {
    return column.dsCell.badge.labelFn(rawValue, row);
  }

  // Use general value formatter
  if (column.valueFormatter) {
    return column.valueFormatter({ value: rawValue, data: row });
  }

  // Default string conversion
  if (rawValue == null) return '';
  return String(rawValue);
}

/**
 * Resolve badge variant for a column value
 */
export function resolveBadgeVariant<T>(
  column: DsResponsiveColumn<T>,
  row: T,
): DsBadgeVariant {
  const variant = column.mobile?.badgeVariant;
  if (!variant) return 'default';
  if (typeof variant === 'function') {
    return variant(getColumnValue(column, row), row);
  }
  return variant;
}

/**
 * Get sortable columns for mobile sort sheet
 */
export function getSortableColumns<T>(
  columns: DsResponsiveColumn<T>[],
): DsSortableColumn[] {
  return columns
    .filter((col) => col.sortable === true && !col.hide)
    .map((col) => ({
      field: col.field,
      label: col.headerName ?? col.field,
    }));
}

/**
 * Convert DsResponsiveColumn to AG Grid ColDef
 */
export function toColDef<T>(column: DsResponsiveColumn<T>): ColDef {
  const { mobile, headerKey, ...colDef } = column;
  return colDef as ColDef;
}

/**
 * Convert array of DsResponsiveColumn to AG Grid ColDef array
 */
export function toColDefs<T>(columns: DsResponsiveColumn<T>[]): ColDef[] {
  return columns.map(toColDef);
}
