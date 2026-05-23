import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DsResponsiveColumn, DsSortState } from './ds-responsive-table.model';
import { DsFiltersValue } from '../filter-panel/ds-filter-panel.model';
import { DsAgGridColumnItem } from '../ag-grid-table/ds-ag-grid-customize-columns.component';

/**
 * Saved column state in localStorage
 */
interface SavedColumn {
  id: string;
  visible: boolean;
  order: number;
}

/**
 * Table state schema version 1
 * Stores column customization, filters, and sort state
 */
interface DsTableStateV1 {
  version: 1;
  timestamp: number;
  columnCustomization: {
    columns: SavedColumn[];
  } | null;
  filters: DsFiltersValue | null;
  sort: DsSortState | null;
  zoom: number | null;
}

/**
 * Service for managing table state persistence in localStorage
 * Handles versioning, storage key generation, and state merging
 */
@Injectable({
  providedIn: 'root',
})
export class DsResponsiveTableStateService {
  private readonly router = inject(Router);
  private readonly STORAGE_PREFIX = 'tableState_';

  /**
   * Generate storage key for current table
   * @param namespace Optional custom namespace (e.g., 'students-tab')
   * @returns Storage key like "tableState_students-tab_user-management"
   */
  generateStorageKey(namespace?: string): string {
    const url = this.router.url;
    const pathname = url.split('?')[0]; // Remove query params
    const urlKey = pathname.replace(/[^\w-]/g, '_'); // Sanitize for localStorage

    if (namespace) {
      return `${this.STORAGE_PREFIX}${namespace}_${urlKey}`;
    }
    return `${this.STORAGE_PREFIX}${urlKey}`;
  }

  /**
   * Load table state from localStorage
   * @param namespace Optional custom namespace
   * @returns Saved state or default empty state
   */
  loadState(namespace?: string): DsTableStateV1 {
    const key = this.generateStorageKey(namespace);

    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return this.getDefaultState();
      }

      const parsed = JSON.parse(stored) as DsTableStateV1;

      // Version check - if version mismatch, return default state
      if (parsed.version !== 1) {
        console.warn(
          `[TableState] Version mismatch for key "${key}". Expected v1, got v${parsed.version}. Using default state.`,
        );
        return this.getDefaultState();
      }

      return parsed;
    } catch (error) {
      console.error('[TableState] Failed to parse saved state:', error);
      // Clear corrupted state
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore removal errors
      }
      return this.getDefaultState();
    }
  }

  /**
   * Save table state to localStorage
   * @param partialState State to save (can be partial, will merge with existing)
   * @param namespace Optional custom namespace
   */
  saveState(partialState: Partial<DsTableStateV1>, namespace?: string): void {
    const key = this.generateStorageKey(namespace);

    try {
      // Load existing state and merge with new partial state
      const existingState = this.loadState(namespace);
      const newState: DsTableStateV1 = {
        ...existingState,
        ...partialState,
        version: 1,
        timestamp: Date.now(),
      };

      localStorage.setItem(key, JSON.stringify(newState));
    } catch (error) {
      // Handle QuotaExceededError or other storage errors
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        console.warn(
          '[TableState] localStorage quota exceeded. State not saved.',
        );
      } else {
        console.error('[TableState] Failed to save state:', error);
      }
    }
  }

  /**
   * Merge saved column state with current column definitions
   * Handles new columns being added to the codebase
   * @param savedColumns Columns from localStorage
   * @param currentColumns Current column definitions from config (can be DsResponsiveColumn or DsAgGridColDef)
   * @returns Merged column state with proper ordering
   */
  mergeColumnState(
    savedColumns: SavedColumn[],
    currentColumns: Array<{
      field?: string;
      colId?: string;
      headerName?: string;
      hide?: boolean;
      lockVisible?: boolean;
      lockPinned?: boolean;
      excludeFromCustomization?: boolean;
    }>,
  ): DsAgGridColumnItem[] {
    // Create map of saved column state by ID
    const savedMap = new Map(savedColumns.map((c) => [c.id, c]));

    // Get all columns that should appear in customization modal
    const customizableColumns = currentColumns.filter(
      (col) => !col.excludeFromCustomization,
    );

    // Process each current column with temporary order tracking
    const processedColumnsWithOrder = customizableColumns
      .map((col, defaultOrder) => {
        const colId = col.colId || col.field;
        // Skip columns without a valid ID
        if (!colId) return null;

        const saved = savedMap.get(colId);

        if (saved) {
          // Column exists in saved state - use saved visibility and order
          return {
            id: colId,
            name: col.headerName || col.field || colId,
            visible: saved.visible,
            canHide: !col.lockVisible,
            canReorder: !col.lockPinned,
            _order: saved.order, // Temporary order for sorting
          };
        }

        // NEW COLUMN: Not in saved state
        // Use column's default visibility (hide !== true means visible by default)
        // Append at end of list
        return {
          id: colId,
          name: col.headerName || col.field || colId,
          visible: col.hide !== true, // Respect default visibility from column config
          canHide: !col.lockVisible,
          canReorder: !col.lockPinned,
          _order: 999 + defaultOrder, // Append new columns at end
        };
      })
      .filter((col): col is NonNullable<typeof col> => col !== null);

    // Sort by order to maintain saved column ordering, then remove order property
    return processedColumnsWithOrder
      .sort((a, b) => a._order - b._order)
      .map(({ _order, ...col }) => col);
  }

  /**
   * Clear saved state for current table
   * @param namespace Optional custom namespace
   */
  clearState(namespace?: string): void {
    const key = this.generateStorageKey(namespace);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[TableState] Failed to clear state:', error);
    }
  }

  /**
   * Get default empty state
   */
  private getDefaultState(): DsTableStateV1 {
    return {
      version: 1,
      timestamp: Date.now(),
      columnCustomization: null,
      filters: null,
      sort: null,
      zoom: null,
    };
  }
}
