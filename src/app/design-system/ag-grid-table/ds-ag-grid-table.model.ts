import { ColDef } from 'ag-grid-community';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { DsIcon } from '@ds/icon/icon.component';
import { DsAgGridTitleSubtitleCellComponent } from './ds-ag-grid-title-subtitle-cell.component';
import { DsAgGridTitleSubtitleHeaderComponent } from './ds-ag-grid-title-subtitle-header.component';

// Re-export types from customize columns component
export type {
  DsAgGridColumnItem,
  DsAgGridCustomizeColumnsResult,
} from './ds-ag-grid-customize-columns.component';

/**
 * RTL-aware pinned column position.
 * - 'start': Left in LTR, Right in RTL
 * - 'end': Right in LTR, Left in RTL
 * - 'left'/'right': Physical positioning (not recommended, use start/end instead)
 */
export type DsAgGridPinnedPosition = 'start' | 'end' | 'left' | 'right';

/**
 * Extended ColDef that supports RTL-aware pinned positioning
 */
export interface DsAgGridColDef extends Omit<ColDef, 'pinned'> {
  /** RTL-aware pinned position: 'start', 'end', or physical 'left'/'right' */
  pinned?: DsAgGridPinnedPosition | boolean | null;
}

export interface DsAgGridBulkAction<T = Record<string, unknown>> {
  id: string;
  label: string;
  icon?: DsIcon;
  activeLabel?: string;
  /** Whether the action is disabled - can be boolean or function receiving selected rows */
  disabled?: boolean | ((rows: T[]) => boolean);
  disabledReason?: string | ((rows: T[]) => string | undefined);
  action?: (rows: T[]) => void;
  visible?: boolean | ((rows: T[]) => boolean);
  /** Whether the action is currently loading (e.g. API call in progress) */
  loading?: boolean;
}

export interface DsAgGridTableConfig<T = Record<string, unknown>> {
  columns: DsAgGridColDef[];
  rowActions?: PopupItem<T>[];
  bulkActions?: DsAgGridBulkAction<T>[];
}

/**
 * Selection state that supports "select all across pages" pattern.
 * - mode 'none': no rows selected
 * - mode 'some': only specific rows selected (selectedIds has them)
 * - mode 'all': all rows selected except those in excludedIds
 */
export interface DsSelectionState {
  mode: 'none' | 'some' | 'all';
  /** IDs of individually selected rows (when mode = 'some') */
  selectedIds: string[];
  /** IDs of excluded rows (when mode = 'all') */
  excludedIds: string[];
}

/**
 * Configuration for the empty state placeholder
 * All properties are optional - defaults are provided by the component
 */
export interface DsAgGridEmptyStateConfig {
  /** Path to the image to display (default: 'assets/illustrations/no-search-result.svg') */
  imagePath?: string;
  /** Title text (default: 'No results found') */
  title?: string;
  /** Description text (supports HTML) */
  description?: string;
  /** Label for the "Filtered by" section (default: 'Filtered by') */
  filteredByLabel?: string;
}

/**
 * Configuration for a title-subtitle column
 */
export interface DsAgGridTitleSubtitleColumnConfig {
  /** Column field (used for title value if titleField not specified) */
  field: string;
  /** Header title text */
  headerTitle: string;
  /** Header subtitle text */
  headerSubtitle?: string;
  /** Field to use for cell title (defaults to field) */
  titleField?: string;
  /** Single field to use for cell subtitle */
  subtitleField?: string;
  /** Multiple fields to combine for cell subtitle */
  subtitleFields?: string[];
  /** Separator for combining multiple subtitle fields (default: ' - ') */
  subtitleSeparator?: string;
  /** Column width */
  width?: number;
  /** Minimum column width */
  minWidth?: number;
  /** Enable sorting */
  sortable?: boolean;
  /** Pin column: 'start' (left in LTR, right in RTL) or 'end' (right in LTR, left in RTL) */
  pinned?: DsAgGridPinnedPosition | boolean;
  /** Lock pinned state */
  lockPinned?: boolean;
}

/**
 * Converts RTL-aware pinned position ('start'/'end') to physical position ('left'/'right')
 * @param pinned - The pinned position from config
 * @param isRtl - Whether the current direction is RTL
 * @returns The physical pinned position for AG Grid
 */
export function resolvePinnedPosition(
  pinned: DsAgGridPinnedPosition | boolean | null | undefined,
  isRtl: boolean,
): 'left' | 'right' | boolean | null | undefined {
  if (pinned === undefined || pinned === null || typeof pinned === 'boolean') {
    return pinned;
  }

  // Physical positions pass through unchanged
  if (pinned === 'left' || pinned === 'right') {
    return pinned;
  }

  // Convert logical positions based on RTL
  if (pinned === 'start') {
    return isRtl ? 'right' : 'left';
  }

  if (pinned === 'end') {
    return isRtl ? 'left' : 'right';
  }

  return pinned;
}

/**
 * Creates a DsAgGridColDef for a title-subtitle column
 */
export function createTitleSubtitleColumn(
  config: DsAgGridTitleSubtitleColumnConfig,
): DsAgGridColDef {
  return {
    field: config.field,
    headerName: config.headerTitle,
    headerComponent: DsAgGridTitleSubtitleHeaderComponent,
    headerComponentParams: {
      title: config.headerTitle,
      subtitle: config.headerSubtitle,
    },
    cellRenderer: DsAgGridTitleSubtitleCellComponent,
    cellRendererParams: {
      titleField: config.titleField ?? config.field,
      subtitleField: config.subtitleField,
      subtitleFields: config.subtitleFields,
      subtitleSeparator: config.subtitleSeparator ?? ' - ',
    },
    width: config.width,
    minWidth: config.minWidth,
    flex: 0, // Don't use flex sizing - size based on content
    sortable: config.sortable,
    pinned: config.pinned,
    lockPinned: config.lockPinned,
  };
}
