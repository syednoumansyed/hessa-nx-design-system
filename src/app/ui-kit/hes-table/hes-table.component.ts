import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Optional,
  Output,
  Signal,
  ViewChild,
  WritableSignal,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AgGridModule } from 'ag-grid-angular';
import {
  ColDef,
  RowModelType,
  GridReadyEvent,
  SortChangedEvent,
  GridApi,
  ITooltipParams,
  SelectionChangedEvent,
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
  SizeColumnsToFitProvidedWidthStrategy,
  IRowNode,
  RowDataUpdatedEvent,
  RowSelectedEvent,
  CellClickedEvent,
  GetRowIdFunc,
  GetRowIdParams,
  RowClassRules,
  DragStoppedEvent,
} from 'ag-grid-community';
import { CustomFilterComponent } from './custom-filter/custom-filter.component';
import { CustomFloatingFilterComponent } from './custom-floating-filter/custom-floating-filter.component';
import {
  IFilterEvent,
  ITableFilter,
  ITablePagination,
  ITableSort,
  ITableModel,
  ITableCol,
  UnknownObject,
  INoRowsOverlay,
  AcademicYearFilterName,
} from './model';
import { SortOrder } from '@shared/enums';
import {
  IonFab,
  IonFabButton,
  IonModal,
  IonRadioGroup,
  IonRadio,
  IonLabel,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import {
  faChevronRight,
  faChevronLeft,
  faSliders,
} from '@fortawesome/pro-regular-svg-icons';
import { IPagination, Idropdown } from '@shared/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HesRadioDirective } from '@ui-kit/hes-radio/hes-radio.directive';
import { CustomActionsCellComponent } from '@ui-kit/hes-table/custom-actions-cell/custom-actions-cell.component';
import {
  formatToHesDate,
  formatToHesDateDay,
  formatToHestime,
} from '@shared/utils/date';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { isRtl } from '@shared/utils/platform';
import { CustomNoRowsOverlayComponent } from './custom-no-rows-overlay/custom-no-rows-overlay.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesCheckboxModule } from '@ui-kit/hes-checkbox/hes-checkbox.module';
import { HesSearchableSelectComponent } from '@ui-kit/hes-searchable-select/hes-searchable-select.component';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { Subscription, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { CustomLoadingOverlayComponent } from './custom-loading-overlay/custom-loading-overlay.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { CustomNoRecordFoundOverlyComponent } from './custom-no-record-found-overly/custom-no-record-found-overly.component';

/**
 * The HesTableComponent class represents a table component with various features such as filtering, sorting, pagination, and column selection.
 *
 * @required
 * To use the HesTableComponent, you need to provide the following inputs:
 * @Input columns - An array of column definitions for the table.
 * @Input rowData -  The data to be displayed in the table rows.
 *
 * @Optional
 * @Input rowSelection -  Specifies the type of row selection in the table. It can be either 'single' or 'multiple'.
 * @Input pagination - An object that represents the pagination configuration for the table.
 *
 * @example
 * ```html
 * <app-hes-table
 *   [columns]="columns"
 *   [rowData]="rowData"
 *   [rowSelection]="rowSelection"
 *   [pagination]="paginationConfig"
 *   (filterChanged)="onFilterChanged($event)"
 *   (sortChanged)="onSortChanged($event)"
 *   (PaginationChanged)="onPaginationChanged($event)"
 *   (filterSortModelChanged)="onFilterSortModelChanged($event)"
 * ></app-hes-table>
 * ```
 */

@Component({
  selector: 'app-hes-table',
  templateUrl: './hes-table.component.html',
  styleUrls: ['./hes-table.component.scss'],
  standalone: true,
  imports: [
    IonSkeletonText,
    AgGridModule,
    HesButtonModule,
    CommonModule,
    FormsModule,
    IonFab,
    IonFabButton,
    IonModal,
    HesCheckboxModule,
    IonRadioGroup,
    IonRadio,
    IonLabel,
    HesRadioDirective,
    TranslocoModule,
    HesSearchableSelectComponent,
  ],
})
export class HesTableComponent implements OnDestroy {
  @ViewChild(IonModal) modal: IonModal;

  // private readonly schoolStructureListingService = inject(
  //   SchoolStructureListingService,
  // );

  private readonly translocoService = inject(TranslocoService);

  isRtl = signal(isRtl());

  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faSliders = faSliders;

  filterValue = signal<ITableFilter>({});
  sortValue = signal<ITableSort | null>(null);

  // Pagination
  pagesList = signal<number[]>([]);
  currPage = signal<number>(1);
  itemsperPage = signal<number>(30);
  nextItemsperPage = signal<number>(10);
  itemsperPageList = signal<any[]>([
    { value: 10, displayedValue: '10' },
    { value: 30, displayedValue: '30' },
    { value: 50, displayedValue: '50' },
    { value: 100, displayedValue: '100' },
    { value: 200, displayedValue: '200' },
  ]);

  // columns
  columnsList = signal<string[]>([]);
  columnsListDropdown = computed(() => {
    return this.columnsList().map((col) => ({
      value: col,
      displayedValue: col,
    }));
  });
  selectedColumns = signal<string[]>([]);
  nextSelectedCols = signal<string[]>([]);
  columnDefs = signal<ColDef[]>([]);

  rows = signal<UnknownObject[]>([]);
  showFullOverlay = signal(false);

  readonly rowModelType: RowModelType = 'clientSide';
  readonly themeClass: string = 'ag-theme-quartz';
  readonly floatingFiltersHeight = 56;
  private readonly selectedRows = new Map<number, UnknownObject>();
  gridApi: GridApi;

  getRowId = computed<GetRowIdFunc | undefined>(() => {
    return this.rowIdProperty()
      ? (params: GetRowIdParams) => {
          return params.data[this.rowIdProperty()!]?.toString();
        }
      : undefined;
  });

  rowIdProperty = input<string>();
  withNewTableIntegration = input<boolean>(false);
  noRowsOverlayComponent = signal<any>(undefined);
  loadingOverlayComponent = signal<any>(CustomLoadingOverlayComponent);

  suppressRowClickonColDefs = input<string[]>([]);

  hideEntriesSelection = input<boolean>(false);
  hideColumnsSelection = input<boolean>(false);
  @Input() noRowsOverlayComponentParams: INoRowsOverlay;

  /**
   * Represents the columns of the table.
   * @type {ITableCol[]}
   */
  @Input() columns: ITableCol[];

  /**
   * The data to be displayed in the table rows.
   */
  @Input({ required: true }) set rowData(val: UnknownObject[]) {
    const filterVal = this.filterValue();
    const isDefault = Object.keys(filterVal)?.length === 0;
    if (isDefault && !val?.length) {
      this.showFullOverlay.set(true);
      this.noRowsOverlayComponent.set(CustomNoRowsOverlayComponent);
    } else {
      this.noRowsOverlayComponent.set(CustomNoRecordFoundOverlyComponent);
      this.showFullOverlay.set(
        this.noRowsOverlayComponentParams?.showFullOverlay ?? false,
      );
    }
    this.rows.set(val);
    // this.gridApi?.setGridOption('rowData', val);
  }

  /**
   * Specifies the type of row selection in the table.
   * - 'single': Allows selecting only one row at a time.
   * - 'multiple': Allows selecting multiple rows.
   */
  @Input() rowSelection: 'single' | 'multiple' | undefined = undefined;
  @Input() rowClassRules: RowClassRules;

  private _pagination: IPagination | null;
  @Input() set pagination(val: IPagination | null) {
    if (!val) {
      this._pagination = null;
      this.pagesList.set([]);
      this.currPage.set(1);
      return;
    }
    this._pagination = val;
    this.pagesList.set(this.generatePageList(val.totalPages, val.pageNumber));
    this.currPage.set(val.pageNumber);
    this.itemsperPage.set(val.itemsPerPage || 10);
  }
  get pagination() {
    return this._pagination;
  }

  /**
   * Determines whether a row is selectable based on the provided criteria.
   * @param data - The data object associated with the row.
   * @returns A boolean value indicating whether the row is selectable.
   */
  @Input() isRowSelectable: ({ data }: { data: any }) => boolean;

  autoSizeStrategy = input<
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToFitProvidedWidthStrategy
    | SizeColumnsToContentStrategy
    | undefined
  >({ type: 'fitCellContents' });
  /**
   * Indicates whether row click selection upon click (on the row itself) should be suppressed.
   */
  @Input() suppressRowClickSelection: boolean = false;

  /**
   * Indicates whether data is ready or not.
   */
  loading = input<boolean>();

  /**
   * Event emitter for when the filter is changed.
   * @event filterChanged
   * @type {EventEmitter<ITableFilter>}
   */
  @Output() filterChanged = new EventEmitter<ITableFilter>();

  /**
   * Emits an event when the sort configuration of the table is changed.
   * @event sortChanged
   * @type {EventEmitter<ITableSort | null>}
   */
  @Output() sortChanged = new EventEmitter<ITableSort | null>();

  /**
   * Emits an event when the filter or sort configuration of the table is changed.
   * @event filterSortModelChanged
   * @type {EventEmitter<ITableModel>}
   */
  @Output() filterSortModelChanged = new EventEmitter<ITableModel>();

  /**
   * Event emitter for pagination changes in the table.
   * @event PaginationChanged
   * @type {EventEmitter<ITablePagination>}
   */
  @Output() PaginationChanged = new EventEmitter<ITablePagination>();

  /**
   * Event emitted when the selection in the table is changed. it emits an array of the selected rows objects.
   * @event SelectionChanged
   * @type {EventEmitter<any[]>}
   */
  @Output() SelectionChanged = new EventEmitter<any[]>();
  @Output() selectedRowsChange = new EventEmitter<any[]>();
  rowClicked = output<any>();
  readonly dragStop = output<DragStoppedEvent>();

  subscribtions: Subscription[] = [];
  selectedSchoolStructureModel$ = toObservable(
    this.schoolStructureListingService?.selectedSchoolStructureModel,
  ).pipe(takeUntilDestroyed(), skip(1));
  selectedAcademicYearScope$ = toObservable(
    this.academicYearsScopeService.selectedAcademicYear,
  ).pipe(takeUntilDestroyed(), skip(1));

  constructor(
    @Optional()
    private schoolStructureListingService: SchoolStructureListingService,
    private schoolStructureScopeService: SchoolStructureScopeService,
    private academicYearsScopeService: AcademicYearsScopeService,
  ) {
    toObservable(this.schoolStructureScopeService.selectedSchoolStructureItem)
      .pipe(takeUntilDestroyed(), skip(1))
      .subscribe(() => {
        this.schoolStructureListingService.reset();
      });
  }

  rowDataUpdate(param: RowDataUpdatedEvent) {
    this.setRowSelected(param.api);
  }

  setRowSelected(api: GridApi) {
    if (this.rowSelection) {
      const nodesToSelect: IRowNode[] = [];
      if (this.selectedRows.size) {
        api.forEachNode((node: IRowNode) => {
          if (this.selectedRows.has(node.data.id)) {
            nodesToSelect.push(node);
          }
        });
        api.setNodesSelected({ nodes: nodesToSelect, newValue: true });
      }
    }
  }

  onGridReady = (params?: GridReadyEvent) => {
    if (params) {
      this.gridApi = params.api;
    }

    const colDefs = this.populateColDefs(this.columns);

    this.columnDefs.set(colDefs);

    const colsList: string[] = [];
    const selectedColsList: string[] = [];

    colDefs.forEach((col) => {
      if (col.field && col.headerName) {
        colsList.push(col.headerName);
        if (!col.hide) {
          selectedColsList.push(col.headerName);
        }
      }
    });
    this.columnsList.set(colsList);
    this.selectedColumns.set(selectedColsList);
    this.nextSelectedCols.set(selectedColsList);
    if (this.gridApi) {
      this.gridApi.setGridOption('columnDefs', this.columnDefs());
    }

    this.emitInitFilterValues();
    if (this.schoolStructureListingService && !this.withNewTableIntegration()) {
      this.listenToSchoolStructureFilterModelChange();
    }

    this.listenToAcademicYearScopeChange();
  };

  private listenToSchoolStructureFilterModelChange() {
    this.subscribtions.push(
      this.selectedSchoolStructureModel$.subscribe((model) => {
        const containsSchoolStructureFilter = this.columns.some(
          (col) =>
            col.filterType === 'select' && col.SchoolStructureListingType,
        );
        if (containsSchoolStructureFilter) {
          const filter = {} as ITableFilter;
          this.columns
            .filter(
              (col) =>
                col.filterType === 'select' && col.SchoolStructureListingType,
            )
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
              filter[col.field] = filterValue;
            });
          this.filterValue.update((oldFilter) => {
            const newFilter = { ...oldFilter, ...filter };
            const cleanedFilter = Object.fromEntries(
              Object.entries(newFilter).filter(([key, value]) => value != null),
            );
            return cleanedFilter;
          });

          this.filterChanged.emit(this.filterValue());
          this.filterSortModelChanged.emit({
            ...this.filterValue(),
            ...this.sortValue(),
            pageNumber: this.currPage(),
            itemsPerPage: this.itemsperPage(),
          });
        }
      }),
    );
  }

  private listenToAcademicYearScopeChange() {
    const containsAcademicYearFilter = this.columns.some(
      (col) =>
        col.filterType === 'select' &&
        Object.values(AcademicYearFilterName).includes(
          col.field as AcademicYearFilterName,
        ),
    );
    if (containsAcademicYearFilter) {
      this.subscribtions.push(
        this.selectedAcademicYearScope$.subscribe((model) => {
          const filter = {} as ITableFilter;
          this.columns
            .filter(
              (col) =>
                col.filterType === 'select' &&
                Object.values(AcademicYearFilterName).includes(
                  col.field as AcademicYearFilterName,
                ),
            )
            .forEach((col) => {
              const filterValue = model?.id;
              filter[col.field] = filterValue;
            });
          this.filterValue.update((oldFilter) => {
            const newFilter = { ...oldFilter, ...filter };
            const cleanedFilter = Object.fromEntries(
              Object.entries(newFilter).filter(([key, value]) => value != null),
            );
            return cleanedFilter;
          });

          this.filterChanged.emit(this.filterValue());
          this.filterSortModelChanged.emit({
            ...this.filterValue(),
            ...this.sortValue(),
            pageNumber: this.currPage(),
            itemsPerPage: this.itemsperPage(),
          });
        }),
      );
    }
  }

  /**
   * Emits the initial filter values based on the column configurations.
   * This method constructs a filter object based on the columns that have
   * the `filterinitSelection` property set. It also handles constructing
   * the filter object for columns with `filterType` set to 'select' and
   * `SchoolStructureListingType` set to a specific value.
   */
  private emitInitFilterValues() {
    const filter = {} as ITableFilter;
    const containsInitFilterValue = this.columns.some(
      (col) => col.filterinitSelection,
    );
    if (containsInitFilterValue) {
      this.columns
        .filter((col) => col.filterinitSelection)
        .forEach((col) => {
          filter[col.field] = col.filterinitSelection;
        });
    }
    const containsSchoolStructureFilter = this.columns.some(
      (col) => col.filterType === 'select' && col.SchoolStructureListingType,
    );
    if (containsSchoolStructureFilter && this.schoolStructureListingService) {
      this.columns
        .filter(
          (col) =>
            col.filterType === 'select' && col.SchoolStructureListingType,
        )
        .forEach((col) => {
          let initVal;
          switch (col.SchoolStructureListingType) {
            case 'company':
            case 'sub-company':
              initVal =
                this.schoolStructureListingService.selectedCompany()?.id;
              break;
            case 'campus':
              initVal = this.schoolStructureListingService.selectedCampus()?.id;
              break;
            case 'school':
              initVal = this.schoolStructureListingService.selectedSchool()?.id;
              break;
            case 'level':
              initVal = this.schoolStructureListingService.selectedLevel()?.id;
              break;
            case 'class':
              initVal = this.schoolStructureListingService.selectedClass()?.id;
              break;
            default:
              initVal = null;
              break;
          }
          if (initVal) {
            filter[col.field] = initVal;
          }
        });
    }

    const academicYearColumn = this.columns.filter(
      (col) =>
        col.filterType === 'select' &&
        Object.values(AcademicYearFilterName).includes(
          col.field as AcademicYearFilterName,
        ),
    );

    const academicYearColumnItem =
      academicYearColumn.length > 0 ? academicYearColumn[0] : null;
    if (
      academicYearColumnItem &&
      !academicYearColumnItem.hasOwnProperty('filterinitSelection')
    ) {
      academicYearColumn.forEach((col) => {
        const initVal =
          this.academicYearsScopeService.selectedAcademicYear()?.id;
        if (initVal) filter[col.field] = initVal;
      });
    }

    if (Object.keys(filter).length > 0) {
      this.filterValue.set(filter);
      this.filterChanged.emit(this.filterValue());
      this.filterSortModelChanged.emit({
        ...this.filterValue(),
        ...this.sortValue(),
        pageNumber: this.currPage(),
        itemsPerPage: this.itemsperPage(),
      });
    }
  }

  populateColDefs(cols: ITableCol[]): ColDef[] {
    return cols?.map((col, i) => {
      const colDef: ColDef = {
        ...this.defaultColumn,
        field: col.field,
        headerName: col.headerName,
        sortable: col.sortable,
        includeNoneOption: col.includeNoneOption,
        ...(!this.withNewTableIntegration() && this.getColFilterDef(col)),
        valueFormatter: this.getColValueFormatter(col),
        cellRenderer: this.getColCellRenderer(col),
        ...this.getActionsColDef(col),
        ...(col.autoHeight && { autoHeight: col.autoHeight }),
        ...(col.wrapText && { wrapText: col.wrapText }),
        ...(col.width && { width: col.width }),
        ...(col.minWidth && { minWidth: col.minWidth }),
        ...(col.maxWidth && { maxWidth: col.maxWidth }),
        ...(col.cellStyle && { cellStyle: col.cellStyle }),
        ...(col.sort && { sort: col.sort }),
        ...(col.hide && { hide: col.hide }),
        ...(col.cellRendererParams && {
          cellRendererParams: col.cellRendererParams,
        }),
        checkboxSelection: (params) => {
          const displayedColumns = params.api.getAllDisplayedColumns();
          return (
            displayedColumns[0] === params.column &&
            this.rowSelection !== undefined
          );
        },
        headerCheckboxSelection:
          this.rowSelection === 'multiple'
            ? (params) => {
                const displayedColumns = params.api.getAllDisplayedColumns();
                return (
                  displayedColumns[0] === params.column &&
                  this.rowSelection === 'multiple'
                );
              }
            : false,
        tooltipValueGetter: (params: ITooltipParams) => params.value,
      };
      return colDef;
    });
  }

  defaultColumn: ColDef = {
    minWidth: 100,
    sortable: false,
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    suppressFiltersToolPanel: true,
    suppressColumnsToolPanel: true,
    unSortIcon: true,
    suppressHeaderFilterButton: true,
    resizable: false,
    autoHeight: true,
    wrapText: true,
    wrapHeaderText: true,
    comparator: (_valueA, _valueB, _nodeA, _nodeB, _isDescending) => 0,
    filterParams: {
      textMatcher: () => true,
    },
  };
  getDefaultTextFilter(filterPlaceholder: string): ColDef {
    return {
      filter: CustomFilterComponent,
      floatingFilter: true,
      floatingFilterComponent: CustomFloatingFilterComponent,
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        onChange: (val: IFilterEvent) => this.onFilterChanged(val),
        placeholder: filterPlaceholder,
        type: 'text',
      },
    };
  }
  getDefaultDateFilter(filterPlaceholder: string): ColDef {
    return {
      filter: CustomFilterComponent,
      floatingFilter: true,
      floatingFilterComponent: CustomFloatingFilterComponent,
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        onChange: (val: IFilterEvent) => this.onFilterChanged(val),
        type: 'date',
        placeholder: filterPlaceholder,
      },
    };
  }
  getDefaultSelectFilter(
    field: string,
    filterOptions: Idropdown[],
    filterPlaceholder: string,
    initSelection?: Idropdown['value'],
    SchoolStructureListingType?: SchoolStructureEntityType,
    filterSelectOptionsSignal?:
      | WritableSignal<Idropdown[]>
      | Signal<Idropdown[]>,
    includeNoneOption?: boolean,
  ): ColDef {
    if (initSelection) {
      this.filterValue.update((filter) => {
        filter[field] = initSelection;
        return filter;
      });
    }
    return {
      filter: CustomFilterComponent,
      floatingFilter: true,
      floatingFilterComponent: CustomFloatingFilterComponent,
      suppressFloatingFilterButton: true,
      floatingFilterComponentParams: {
        onChange: (val: IFilterEvent) => this.onFilterChanged(val),
        type: 'select',
        selectValues: filterOptions,
        placeholder: filterPlaceholder,
        initSelection: initSelection,
        SchoolStructureListingType,
        filterSelectOptionsSignal,
        includeNoneOption,
      },
    };
  }
  getColFilterDef(col: ITableCol): ColDef {
    if (col.filter) {
      switch (col.filterType) {
        case 'text':
          return this.getDefaultTextFilter(
            col.filterPlaceholder ?? col.headerName,
          );
        case 'date':
          return this.getDefaultDateFilter(
            col.filterPlaceholder ?? col.headerName,
          );
        case 'select':
          return this.getDefaultSelectFilter(
            col.field,
            col.filterSelectOptions ?? [],
            col.filterPlaceholder ?? col.headerName,
            col.filterinitSelection,
            col.SchoolStructureListingType,
            col.filterSelectOptionsSignal,
            col.includeNoneOption,
          );
        default:
          return this.getDefaultTextFilter(
            col.filterPlaceholder ?? col.headerName,
          );
      }
    } else {
      return {};
    }
  }

  getColValueFormatter<T = any>(
    col: ITableCol<T>,
  ): ({ data, value }: { data: T; value: any }) => string {
    if (col.valueFormatter) {
      return col.valueFormatter;
    } else {
      return ({ value }) => value;
    }
  }

  getColCellRenderer<T = any>(
    col: ITableCol<T>,
  ): ({ data, valueFormatted }: { data: T; valueFormatted: any }) => string {
    if (col.cellRenderer) {
      return col.cellRenderer;
    } else {
      return (params) => {
        if (
          params.valueFormatted === null ||
          params.valueFormatted === undefined ||
          params.valueFormatted === ''
        ) {
          return `<div>-</div>`;
        }

        switch (col.type) {
          case 'enum': {
            const translationKey = `enum.${params.valueFormatted?.toUpperCase()}`;
            return this.translocoService.translate(translationKey, {});
          }
          case 'dateTime': {
            return `<div class="text-gray-900 font-medium">${formatToHesDate(params.valueFormatted, this.isRtl())}</div>
            <div class="text-gray-500">${formatToHestime(params.valueFormatted, this.isRtl())}</div>`;
          }
          case 'dateDay': {
            return `<div class="text-gray-900 font-medium">${formatToHesDate(params.valueFormatted, this.isRtl())}</div>
            <div class="text-gray-500">${formatToHesDateDay(params.valueFormatted, this.isRtl())}</div>`;
          }
          case 'date': {
            return `<div>${formatToHesDate(params.valueFormatted, this.isRtl())}</div>`;
          }
          case 'time': {
            return `<div>${formatToHestime(params.valueFormatted, this.isRtl())}</div>`;
          }
          default:
            return params.valueFormatted;
        }
      };
    }
  }

  getActionsColDef<T = any>(col: ITableCol<T>): ColDef {
    if (col.type === 'action' && col.actions) {
      return {
        field: 'actions',
        cellClass: 'hes-table-actions-cell',
        filter: false,
        floatingFilter: false,
        width: 125,
        ...(col.pinned && { pinned: col.pinned }),
        ...(col.lockPosition && { lockPosition: col.lockPosition }),
        cellRenderer: CustomActionsCellComponent,
        cellRendererParams: {
          actions: col.actions,
          ...(col.forceActionSheet && {
            forceActionSheet: col.forceActionSheet,
          }),
        },
      };
    } else {
      return {};
    }
  }

  /**
   * Event handler for when the filter is changed.
   * @param event The filter event.
   */
  onFilterChanged(event: IFilterEvent) {
    if (event.name === 'fullName' && event.value && event.value.length < 2) {
      return;
    }
    this.filterValue.update((filter) => {
      let newFilter = filter;
      if (event.value !== null) {
        newFilter[event.name] = event.value;
      } else {
        const { [event.name]: _, ...rest } = newFilter;
        newFilter = rest;
      }
      return newFilter;
    });
    this.filterChanged.emit(this.filterValue());
    this.resetPage();
    this.filterSortModelChanged.emit({
      ...this.filterValue(),
      ...this.sortValue(),
      pageNumber: this.currPage(),
      itemsPerPage: this.itemsperPage(),
    });
  }

  private resetPage() {
    this.currPage.set(1);
  }
  /**
   * Handles the event when the internal sort of the table is changed.
   * Retrieves the sorted column from the grid API and emits the updated sort value.
   * @param _event The sort changed event.
   */
  onInternalSortChanged(_event: SortChangedEvent) {
    const sortedColumn = this.gridApi
      .getColumnState()
      .find((col) => Boolean(col.sort));

    if (sortedColumn && sortedColumn.sort) {
      const { colId, sort: order } = sortedColumn;
      this.sortValue.set({
        colName: colId,
        order: order as SortOrder,
      });
    } else {
      this.sortValue.set(null);
    }
    this.sortChanged.emit(this.sortValue());
    this.resetPage();
    this.filterSortModelChanged.emit({
      ...this.filterValue(),
      ...this.sortValue(),
      pageNumber: this.currPage(),
      itemsPerPage: this.itemsperPage(),
    });
  }

  /**
   * Generates a list of page numbers for pagination.
   * If the total number of pages is smaller than 6, returns an array of page numbers.
   * If the current page is within the first three or last three pages, returns a list with the first three pages, -1 for in-between pages, and the last three pages.
   * If the current page isn't within the first three or last three pages, returns a list with the first page, -1 for in-between pages, the current page, the page before, the page after, -1 for in-between pages, and the last page.
   * @param totalPages The total number of pages.
   * @param currentPage The current page.
   * @returns An array of page numbers or a list with -1 for in-between pages.
   */
  generatePageList(totalPages: number, currentPage: number): (number | -1)[] {
    if (totalPages < 6) {
      // If total number of pages is smaller than 6, return an array of page numbers.
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    // Check if the current page is within the first three or last three pages.
    if (currentPage <= 3 || currentPage >= totalPages - 2) {
      // If it is, return the same output.
      const pageList: (number | -1)[] = [];

      // Add the first three pages.
      for (let i = 1; i <= 3; i++) {
        pageList.push(i);
      }

      // Add -1 for in-between pages.
      pageList.push(-1);

      // Add the last three pages.
      for (let i = totalPages - 2; i <= totalPages; i++) {
        pageList.push(i);
      }

      return pageList;
    }

    // If the current page isn't within the first three or last three pages, return the specified output.
    const pageList: (number | -1)[] = [];

    // Add the first page.
    pageList.push(1);

    // Add -1 for in-between pages.
    pageList.push(-1);

    // Add the current page, page before, and page after.
    pageList.push(currentPage - 1, currentPage, currentPage + 1);

    // Add -1 for in-between pages.
    pageList.push(-1);

    // Add the last page.
    pageList.push(totalPages);

    return pageList;
  }

  paginateForward() {
    if (!this._pagination) {
      return;
    }

    const pageNumber = this.currPage();
    if (pageNumber === this._pagination.totalPages) {
      return;
    }
    this.currPage.set(pageNumber + 1);
    this.PaginationChanged.emit({
      pageNumber: pageNumber + 1,
      itemsPerPage: this.itemsperPage(),
    });
    this.filterSortModelChanged.emit({
      ...this.filterValue(),
      ...this.sortValue(),
      pageNumber: pageNumber + 1,
      itemsPerPage: this.itemsperPage(),
    });
  }

  paginateBackward() {
    if (!this._pagination) {
      return;
    }
    const pageNumber = this.currPage();
    if (pageNumber === 1) {
      return;
    }
    this.currPage.set(pageNumber - 1);
    this.PaginationChanged.emit({
      pageNumber: pageNumber - 1,
      itemsPerPage: this.itemsperPage(),
    });
    this.filterSortModelChanged.emit({
      ...this.filterValue(),
      ...this.sortValue(),
      pageNumber: pageNumber - 1,
      itemsPerPage: this.itemsperPage(),
    });
  }

  paginateToPage(pageNumber: number) {
    if (!this._pagination) {
      return;
    }

    const currPage = this.currPage();
    if (pageNumber === currPage) {
      return;
    }
    this.currPage.set(pageNumber);
    this.PaginationChanged.emit({
      pageNumber: pageNumber,
      itemsPerPage: this.itemsperPage(),
    });
    this.filterSortModelChanged.emit({
      ...this.filterValue(),
      ...this.sortValue(),
      pageNumber: pageNumber,
      itemsPerPage: this.itemsperPage(),
    });
  }

  updateItemsPerPage(itemsPerPage: number) {
    if (!this._pagination) {
      return;
    }
    this.itemsperPage.set(itemsPerPage);
    this.PaginationChanged.emit({
      itemsPerPage: itemsPerPage,
      pageNumber: this.currPage(),
    });
    this.filterSortModelChanged.emit({
      ...this.filterValue(),
      ...this.sortValue(),
      pageNumber: this.currPage(),
      itemsPerPage: itemsPerPage,
    });
  }

  updateSelectedColumns(selectedColumns: string[]) {
    this.selectedColumns.set(selectedColumns);

    this.columnDefs.update((columnDefs) => {
      return columnDefs.map((col) => {
        if (col.field && col.headerName) {
          col.hide = !(
            selectedColumns.includes(col.field) ||
            selectedColumns.includes(col.headerName)
          );
        }
        return col;
      });
    });
    this.gridApi?.setGridOption('columnDefs', this.columnDefs());
  }

  updateNextSelectedColumns(selectedColumns: string[]) {
    this.nextSelectedCols.set(selectedColumns);
  }

  updateNextItemsPerPage(itemsPerPage: number) {
    this.nextItemsperPage.set(itemsPerPage);
  }

  ApplyNextConfig() {
    this.updateSelectedColumns(this.nextSelectedCols());
    this.updateItemsPerPage(this.nextItemsperPage());
    this.modal.dismiss(null, 'confirm');
  }

  clearNextConfig() {
    this.updateItemsPerPage(10);
    this.updateSelectedColumns(this.columnsList());
    this.modal.dismiss(null, 'reset');
  }

  /**
   * Handles the selection changed event.
   * @param event The selection changed event object.
   */
  onSelectionChanged(event: SelectionChangedEvent) {
    const selectedRows = event.api.getSelectedRows();
    this.SelectionChanged.emit(selectedRows);
  }

  onRowSelected(event: RowSelectedEvent) {
    if (event.node.isSelected()) {
      this.selectedRows.set(event.data.id, event.data);
    } else {
      this.selectedRows.delete(event.data.id);
    }
    this.selectedRowsChange.emit(Array.from(this.selectedRows.values()));
  }

  deselectAll() {
    this.gridApi?.deselectAll();
    this.selectedRows.clear();
  }

  onCellClicked(event: CellClickedEvent) {
    if (
      event.column.getColDef().field !== 'actions' &&
      !this.suppressRowClickonColDefs().includes(
        event.column.getColDef().field!,
      )
    ) {
      this.rowClicked.emit(event.data);
    }
  }

  onDragStopped(event: DragStoppedEvent<any>): void {
    this.dragStop.emit(event);
  }

  @HostBinding('class')
  get elementClasses() {
    return 'w-full h-full';
  }

  ngOnDestroy(): void {
    if (this.subscribtions.length) {
      this.subscribtions.forEach((v) => {
        v.unsubscribe();
      });
    }
  }
}
