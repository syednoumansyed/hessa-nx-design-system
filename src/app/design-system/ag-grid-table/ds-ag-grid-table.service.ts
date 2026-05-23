import { Injectable, signal } from '@angular/core';
import { NoDataFilterChip } from '@shared/components/no-data-card/no-data-card.component';

export interface DsAgGridOverlayParams {
  imagePath?: string;
  title?: string;
  description?: string;
  filteredByLabel?: string;
  filterChips?: NoDataFilterChip[];
  clearFiltersLabel?: string;
  onClearFilters?: () => void;
}

@Injectable()
export class DsAgGridTableService {
  readonly activeBulkActionId = signal<string | null>(null);
  readonly selectedRows = signal<Record<string, unknown>[]>([]);
  readonly selectionEnabled = signal<boolean>(false);

  /** When "select all across pages" is active, this holds the total count */
  readonly allPagesSelectedCount = signal<number | null>(null);

  /** Reactive overlay params - shared between main component and overlay component */
  readonly noRowsOverlayParams = signal<DsAgGridOverlayParams>({});

  setActiveBulkAction(id: string | null): void {
    this.activeBulkActionId.set(id);
    this.selectionEnabled.set(!!id);
  }

  setSelectedRows(rows: Record<string, unknown>[]): void {
    this.selectedRows.set(rows);
    if (rows.length > 0) {
      this.selectionEnabled.set(true);
      return;
    }
    // Don't disable selection if "all pages" mode is active or a bulk action is shown
    if (!this.activeBulkActionId() && this.allPagesSelectedCount() == null) {
      this.selectionEnabled.set(false);
    }
  }

  setAllPagesSelectedCount(count: number | null): void {
    this.allPagesSelectedCount.set(count);
    if (count != null && count > 0) {
      this.selectionEnabled.set(true);
    }
  }

  clearSelection(): void {
    this.activeBulkActionId.set(null);
    this.selectionEnabled.set(false);
    this.selectedRows.set([]);
    this.allPagesSelectedCount.set(null);
  }
}
