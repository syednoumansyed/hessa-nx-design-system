// Main component and directives
export {
  DsResponsiveTableComponent,
  DsHeaderPrefixDirective,
  DsHeaderSuffixDirective,
} from './ds-responsive-table.component';

// Cell renderer types (re-exported for convenience)
export {
  DsCellType,
  DsCellBadgeVariant,
  DsCellBadgeConfig,
  DsCellRendererParams,
} from '../ag-grid-table/ds-ag-grid-cell-renderer.component';

// Action button cell config (re-exported so consumers don't import from ag-grid internals)
export { DsActionButtonConfig } from '../ag-grid-table/ds-ag-grid-action-button-cell.component';

// Selection state (cross-page selection model)
export { DsSelectionState } from '../ag-grid-table/ds-ag-grid-table.model';

// Model and types
export {
  DsResponsiveColumn,
  DsColumnMobileConfig,
  DsMobileSlot,
  DsBadgeVariant,
  DsRowAction,
  DsBulkAction,
  DsBulkActionEvent,
  DsEmptyStateConfig,
  DsLoadMoreEvent,
  DsMobileItemContext,
  DsMobileFooterContext,
  DsResponsiveTableConfig,
  DsDataSourceRequest,
  DsDataSourceResponse,
  DsSortDirection,
  DsSortState,
  DsSortableColumn,
  DsSortChangeEvent,
  getTitleColumn,
  getSubtitleColumn,
  getBadgeColumns,
  getMetadataColumns,
  getSortableColumns,
  formatColumnValue,
  resolveBadgeVariant,
  toColDefs,
} from './ds-responsive-table.model';

// Mobile sub-components (exported for advanced customization)
export { DsMobileListComponent } from './mobile/ds-mobile-list.component';
export { DsMobileListCardComponent } from './mobile/ds-mobile-list-card.component';
export { DsMobileBulkActionsBarComponent } from './mobile/ds-mobile-bulk-actions-bar.component';
export { DsMobileSortButtonComponent } from './mobile/ds-mobile-sort-button.component';
export { DsMobileSortSheetComponent } from './mobile/ds-mobile-sort-sheet.component';
export { DsMobileSortModalContentComponent } from './mobile/ds-mobile-sort-modal-content.component';
