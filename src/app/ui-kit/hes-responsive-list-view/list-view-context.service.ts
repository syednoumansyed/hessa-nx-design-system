import { Injectable } from '@angular/core';
import { formatDateToUnix } from '@shared/utils/date';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  Subject,
} from 'rxjs';
import { cloneDeep, isEqual } from 'lodash';
import { ISchoolStructureSelectedModal } from '@core/school-structure-listing.service';
import { isEmpty } from '@shared/utils/is-empty.util';
import { ITableCol } from '@ui-kit/hes-table/model';
import { isSelectorType } from './utils/list-view.utils';
import { generateKeyFromUrl } from './utils/get-storage-key.util';

@Injectable()
export class ListViewContextService {
  // #region private properties
  private readonly tableConfig = new BehaviorSubject<ITableCol[]>([]);
  private readonly columnState = new BehaviorSubject<
    ListViewColumnState[] | null
  >(null);
  private readonly filterChangeSource = new BehaviorSubject<
    Record<string, any>
  >({});
  private readonly applyModalFilter = new Subject<void>();
  private readonly columnSettingStorageKey =
    generateKeyFromUrl('columnSettings');
  private modalFilterState = new Map<string, FilterState>();
  private previousFilterState: Map<string, FilterState> | null = null;
  private previousColumnState: ListViewColumnState[] = [];
  private persistColumnSettings = false;
  // #endregion

  // #region public properties
  readonly columnState$ = this.columnState.asObservable();
  readonly applyModalFilter$ = this.applyModalFilter.asObservable();
  readonly tableConfig$ = this.tableConfig.asObservable();
  readonly filterChange$ = this.filterChangeSource.pipe(
    distinctUntilChanged(isEqual),
    debounceTime(500),
  );
  // #endregion

  // #region public methods
  initService(args: {
    tableConfig: ITableCol[];
    persistColumnSettings: boolean;
  }) {
    const { tableConfig, persistColumnSettings = false } = args;
    this.persistColumnSettings = persistColumnSettings;
    this.tableConfig.next(tableConfig);
    this.initFilterColumn(tableConfig);
    this.saveSnapshot();
  }

  getTableConfigValue(): ITableCol[] {
    return this.tableConfig.getValue();
  }

  onApplyModalFilter(): void {
    this.saveSnapshot();
    this.onFilterChange();
    this.applyModalFilter.next();
  }

  onCancelFilter(): void {
    this.restoreSnapshot();
  }

  setModalFilterState(col: ITableCol, value: any): void {
    this.modalFilterState.set(col.field, { value, col });
  }

  getModalFilterState(key: string): any {
    return this.modalFilterState.get(key);
  }

  hasModalFilterState(key: string): boolean {
    return this.modalFilterState.has(key);
  }

  getModalFilterValues(): Record<string, any> {
    return Array.from(this.modalFilterState.values())
      .filter(({ value }) => value != null)
      .reduce(
        (acc, { value, col }) => ({ ...acc, ...getFilterValue(col, value) }),
        {},
      );
  }

  getStoreSortState(): ListViewColumnState | undefined {
    const state: ListViewColumnState[] | null = this.getColumnFromStore();
    return state?.find((i) => i.sort);
  }

  onFilterChange(): void {
    const freshFilter = cloneDeep(this.getModalFilterValues());
    this.filterChangeSource.next(freshFilter);
  }

  getColumnsState(): ListViewColumnState[] | null {
    return this.columnState.getValue();
  }

  setColumnsState(columns: ListViewColumnState[], isPersist = false): void {
    this.columnState.next(columns);
    if (isPersist) {
      this.saveColumnStateToStore();
    }
  }

  applySchoolStructureFilters(args: {
    model: ISchoolStructureSelectedModal;
    columns: ITableCol[];
  }) {
    const { model, columns } = args;
    const containsSchoolStructureFilter = columns.some(
      (col) => isSelectorType(col) && col.SchoolStructureListingType,
    );
    if (containsSchoolStructureFilter) {
      columns
        .filter((col) => isSelectorType(col) && col.SchoolStructureListingType)
        .forEach((col) => {
          let filterValue;
          switch (col.SchoolStructureListingType) {
            case 'company':
            case 'sub-company':
              filterValue = model.selectedCompany?.id;
              break;
            case 'campus':
              filterValue = model.selectedCampus?.id;
              break;
            case 'school':
              filterValue = model.selectedSchool?.id;
              break;
            case 'level':
              filterValue = model.selectedLevel?.id;
              break;
            case 'class':
              filterValue = model.selectedClass?.id;
              break;
            default:
              filterValue = null;
              break;
          }
          this.setModalFilterState(col, filterValue);
        });
    }
  }
  // #endregion

  // #region private methods

  private saveColumnSelectSnapshot() {
    this.previousColumnState = this.getColumnsState() ?? [];
    this.saveColumnStateToStore();
  }

  private restoreColumnSelectSnapshot() {
    this.setColumnsState(this.previousColumnState);
  }

  private saveModalFilterSnapshot(): void {
    // TODO: we need to figure out why filter is not sustained by click cancel button when opening modal first time
    setTimeout(() => {
      this.previousFilterState = new Map(this.modalFilterState);
    });
  }

  private restoreFilterSnapshot(): void {
    if (this.previousFilterState) {
      this.modalFilterState = new Map(this.previousFilterState);
    }
  }

  private saveSnapshot() {
    this.saveModalFilterSnapshot();
    this.saveColumnSelectSnapshot();
  }

  private restoreSnapshot() {
    this.restoreFilterSnapshot();
    this.restoreColumnSelectSnapshot();
  }
  // #endregion

  private saveColumnStateToStore() {
    if (!this.persistColumnSettings) {
      return;
    }

    localStorage.setItem(
      this.columnSettingStorageKey,
      JSON.stringify(this.columnState.getValue()),
    );
  }

  private getColumnFromStore(): ListViewColumnState[] | null {
    if (!this.persistColumnSettings) return null;

    const storedColumn = localStorage.getItem(this.columnSettingStorageKey);
    return storedColumn ? JSON.parse(storedColumn) : null;
  }

  private initFilterColumn(tableConfig: ITableCol[]) {
    const storedState = this.getColumnFromStore();
    if (!storedState || isEmpty(storedState)) {
      // If there's no stored state, initialize column state with current table config
      this.columnState.next(tableConfig.map(({ field }) => ({ field })));
    } else {
      // Handle newly added and removed columns
      const updatedState = mergeColumnState(storedState, tableConfig);
      this.columnState.next(updatedState);
    }
  }
}

interface ListViewColumnState {
  hide?: boolean;
  field: string;
  sort?: 'desc' | 'asc';
  sortable?: boolean;
}
// #region internal
type FilterState = {
  value: any;
  col: ITableCol;
};

function getFilterValue(col: ITableCol, value: any): Record<string, any> {
  if (col.filterType === 'date') {
    return getDateFilterValue(col.field!, value);
  }
  return {
    [col.field!]: value,
  };
}

function getDateFilterValue(key: string, value: any): Record<string, any> {
  return {
    [key]: value ? formatDateToUnix(value.toISOString()).toString() : null,
  };
}

function mergeColumnState(
  storedState: ListViewColumnState[],
  tableConfig: ITableCol[],
): ListViewColumnState[] {
  const tableFields = tableConfig.map((col) => col.field);
  const storedFields = storedState.map((state) => state.field);

  // Remove columns that no longer exist in tableConfig
  const filteredStoredState = storedState.filter((state) =>
    tableFields.includes(state.field),
  );

  // Find new columns that need to be added
  const newColumns = tableConfig
    .filter((col) => !storedFields.includes(col.field))
    .map((col) => ({ field: col.field })); // Default state for new columns

  // Retain the original column order from storedState and insert new ones
  const updatedState: ListViewColumnState[] = [...filteredStoredState];

  newColumns.forEach((newCol) => {
    const originalIndex = tableFields.indexOf(newCol.field);
    if (originalIndex !== -1) {
      updatedState.splice(originalIndex, 0, newCol); // Insert at correct index
    } else {
      updatedState.push(newCol); // Fallback: add at the end if index is unknown
    }
  });

  return updatedState;
}

// #endregion
