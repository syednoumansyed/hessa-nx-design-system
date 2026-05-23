import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  Optional,
  output,
  signal,
  SkipSelf,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { HesTableWrapperComponent } from '../../hes-table/hes-table-wrapper.component';
import {
  AcademicYearFilterName,
  INoRowsOverlay,
  ITableCol,
  ITableModel,
  UnknownObject,
} from '../../hes-table/model';
import { IPaginatedResponse, IPagination, IResponse } from '@shared/interfaces';
import { ListActionBarComponent } from '../list-action-bar/list-action-bar.component';
import { isMobile, isRtl } from '@shared/utils/platform';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  skip,
  Subscription,
  switchMap,
  timer,
  withLatestFrom,
} from 'rxjs';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import {
  IonInfiniteScroll,
  IonContent,
  InfiniteScrollCustomEvent,
  IonInfiniteScrollContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import {
  NoDataBtnInterface,
  NoDataCardComponent,
} from '@shared/components/no-data-card/no-data-card.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DataCardGridComponent } from '../data-card-grid/data-card-grid.component';
import { getUnixTime } from 'date-fns';
import { ListViewContextService } from '../list-view-context.service';
import { isSelectorType } from '../utils/list-view.utils';
import {
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
  SizeColumnsToFitProvidedWidthStrategy,
} from 'ag-grid-community';
import { generateKeyFromUrl } from '../utils/get-storage-key.util';
import { IListViewPrimaryAction } from '../list-view.interface';
import { NavigationStart, Router } from '@angular/router';
import { TuiDay, TuiDayLike } from '@taiga-ui/cdk';
import { isResetPageNumber } from '@shared/utils/is-reset-page.util';

@Component({
  selector: 'app-list-view-container',
  templateUrl: './list-view-container.component.html',
  styleUrls: ['./list-view-container.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonSpinner,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    HesTableWrapperComponent,
    ListActionBarComponent,
    IonContent,
    NoDataCardComponent,
    TranslocoDirective,
    CommonModule,
    ReactiveFormsModule,
    DataCardGridComponent,
  ],
  providers: [
    {
      provide: ListViewContextService,
      useFactory: (parentService: ListViewContextService | null) =>
        parentService ?? new ListViewContextService(),
      deps: [[new Optional(), new SkipSelf(), ListViewContextService]], // Check parent injectors first
    },
  ],
})
export class ListViewContainerComponent implements OnInit, AfterViewInit {
  // #region Inputs
  columns = input<ITableCol[]>([]);
  noDataOverlay = input<INoRowsOverlay>();
  rowSelection = input<'single' | 'multiple' | undefined>(undefined);
  selectedRowsChange = output<any[]>();
  instanceReady = output<ListViewContainerComponent>();
  rowClicked = output<any>();
  /**
   * Controls the number of key-value fields displayed initially on mobile view.
   * When the user clicks "View More," all fields will be shown.
   *
   * @default 0 (shows all fields by default)
   */
  mobileVisibleFieldsLimit = input<number>(0);
  dataSource = input<DataSource>();
  inlineFilterConfig = input<InlineFilterConfig | null>(null);
  primaryActions = input<IListViewPrimaryAction[]>();
  noDataConfig = input<ListViewNoDataConfig>();
  isFilterShow = input<boolean>(true);
  pageTitle = input<string>();
  pageCountTitle = input<string>();
  showSearchInput = input<boolean>(true);
  autoSizeStrategy = input<
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToFitProvidedWidthStrategy
    | SizeColumnsToContentStrategy
    | undefined
  >(undefined);
  canCopy = input<boolean>(false);
  persistColumnSettings = input<boolean>(false);
  pageTitleTemplate = input<TemplateRef<any>>();
  /**
   * @input {boolean} shouldFetchData
   * Determines whether the component fetches data immediately on initialization (`true`),
   * or waits for an external trigger (`false`).
   */
  shouldFetchData = input<boolean>(true);
  /**
   * @input {boolean} reloadOnNavigate
   *
   * Triggers data fetch on route navigation, similar to `ionViewWillEnter` in Ionic.
   */
  reloadOnNavigate = input<boolean>(true);
  // Add new inputs for polling
  pollingInterval = input<number>(5000);
  shouldPoll = input<(data: any[]) => boolean>(() => true);
  enablePolling = input<boolean>(false);
  pausePolling = input<boolean>(false);
  // #endregion

  // #region injector
  private readonly listViewContextService = inject(ListViewContextService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
    { optional: true },
  );
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly destroyRef$ = inject(DestroyRef);
  private readonly isRtl = isRtl();
  private readonly router = inject(Router);
  // #endregion

  // #region Protected properties
  protected readonly noDataFullScreenMode = computed<boolean>(() => {
    return (
      (this.noDataConfig()?.allowFullScreen &&
        !this.rowData().length &&
        !this.hasActiveFilters()) ??
      false
    );
  });

  protected readonly tableColumnConfig = computed<ITableCol[]>(() => {
    return this.columns().map((col) => {
      return {
        ...col,
        ...(col.type === 'action' &&
          col.lockPosition && { pinned: this.isRtl ? 'left' : 'right' }),
      };
    });
  });
  protected readonly tableAutoSizeStrategy = computed<
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToFitProvidedWidthStrategy
    | SizeColumnsToContentStrategy
    | undefined
  >(() => {
    const isPassAsInput = this.autoSizeStrategy();
    const columnState = this.listViewContextService.getColumnsState();
    const isHideColumn = columnState?.find((col) => col.hide);
    if (columnState?.length && isHideColumn) {
      return columnState.filter((col) => !col.hide).length <= 6
        ? { type: 'fitGridWidth' }
        : undefined;
    }
    if (!isPassAsInput) {
      return this.columns().length <= 6 ? { type: 'fitGridWidth' } : undefined;
    }
    return isPassAsInput;
  });

  protected readonly isMobile = isMobile();
  protected readonly mobileSelectedRows = signal<Map<any, UnknownObject>>(
    new Map(),
  );
  protected readonly searchTextControl = new FormControl('');
  protected readonly dateRangeControl = new FormControl<{
    from: Date | null;
    to: Date | null;
  } | null>({
    from: new Date(),
    to: new Date(),
  });
  protected readonly dateControl = new FormControl<Date | null>(null);
  protected readonly tableFilters = signal<Record<string, any> | null>(null);
  protected readonly rowData = signal<UnknownObject[]>([]);
  protected readonly pagination = signal<IPagination | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly columns$ = toObservable<ITableCol[]>(
    this.tableColumnConfig,
  ).pipe(
    withLatestFrom(this.listViewContextService.columnState$),
    map(([columns, columnState]) => {
      if (!columnState) {
        return columns; // No stored state, return default columns
      }

      return columnState
        .map((state) => {
          const column = columns.find((c) => c.field === state.field);
          return column
            ? {
                ...column,
                ...(state.hide && { hide: state.hide }),
                ...(state.sort && { sort: state.sort }),
              }
            : null;
        })
        .filter((col): col is ITableCol => col !== null);
    }),
  );

  protected infiniteScrollDisabled = false;
  // #endregion

  // #region Angular ref
  private readonly tableRef = viewChild<HesTableWrapperComponent>(
    HesTableWrapperComponent,
  );
  private readonly agGridWrapper = viewChild<ElementRef>('agGridWrapper');
  // #endregion

  // #region private properties
  private readonly selectedSchoolStructureModel$ = toObservable(
    this.schoolStructureListingService?.selectedSchoolStructureModel ??
      signal({} as any),
  );

  private readonly searchTextInputSignal = toSignal(
    this.searchTextControl.valueChanges,
  );

  private readonly modalFilterValueSignal = toSignal(
    this.listViewContextService.applyModalFilter$.pipe(
      map(() => {
        return this.listViewContextService.getModalFilterValues();
      }),
    ),
  );

  private readonly selectedAcademicYearScope$ = toObservable(
    this.academicYearsScopeService.selectedAcademicYear,
  ).pipe(takeUntilDestroyed(), skip(1));
  private readonly defaultItemsPerPage = this.isMobile ? 10 : 30;
  private currentUrl?: string;
  // add polling state
  private pollingSubscription?: Subscription;
  private loadedPages = new Map<number, UnknownObject[]>();
  private isPollingActive = false;
  private lastFetchParams: Record<string, any> = {};
  private readonly isPollingAllowed = computed(() => {
    return this.enablePolling() && !this.pausePolling();
  });

  private readonly hasActiveFilters = computed(() => {
    const searchText = this.searchTextInputSignal();
    const modalFilters = this.modalFilterValueSignal() || {};
    const hasInlineFilters = !!searchText;
    const hasModalFilters = Object.values(modalFilters).some((v) => v != null);
    return hasInlineFilters || hasModalFilters;
  });
  // #endregion

  // #region public properties
  ngOnInit(): void {
    this.currentUrl = getPathWithoutQueryParams(this.router.url);
    // can be extended in future to show any filter to have no default value
    if (this.inlineFilterConfig()?.noDefault) {
      this.dateControl.setValue(null);
      this.dateRangeControl.setValue({
        from: null,
        to: null,
      });
    }
    this.initInlineFilterConfig();
    this.listViewContextService.initService({
      tableConfig: this.columns(),
      persistColumnSettings: this.persistColumnSettings(),
    });
    this.initializeFilters();
    this.listenForHideAndShowColumn();
    this.handleFilterChanges();
    this.listenToSchoolStructureFilterModelChange();
    if (this.shouldFetchData()) {
      this.fetchData();
    }

    this.listenToAcademicYearScopeChange();
    merge(
      this.searchTextControl.valueChanges,
      this.dateRangeControl.valueChanges,
      this.dateControl.valueChanges,
    )
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        distinctUntilChanged(),
        debounceTime(500),
      )
      .subscribe(() => {
        this.onFilterChange();
      });
    if (this.reloadOnNavigate()) {
      this.router.events
        .pipe(takeUntilDestroyed(this.destroyRef$))
        .subscribe((event) => {
          if (event instanceof NavigationStart) {
            if (this.currentUrl === getPathWithoutQueryParams(event.url)) {
              this.triggerFetch();
            }
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  ngAfterViewInit(): void {
    this.instanceReady.emit(this);
  }

  public onFilterChange(isResetFilter = true): void {
    if (isResetFilter) {
      this.resetFilters();
    }
    this.fetchData();
  }

  public triggerFetch() {
    this.resetFilters();
    this.fetchData();
  }
  // #region

  // #region Protected methods
  protected onTableFilterChange(event: ITableModel<any>) {
    const { pageNumber, itemsPerPage } = event || {};
    const oldTableFilters = this.tableFilters();
    const { colId, sort } =
      (this.tableRef()?.gridApi?.getColumnState() || []).find(
        (s) => s.sort !== null,
      ) ?? {};
    this.tableFilters.set({
      ...(colId && { sortByColumn: colId }),
      ...(sort && { order: sort }),
      ...(pageNumber && { pageNumber }),
      ...(itemsPerPage && { itemsPerPage }),
    });
    const isResetFilter = oldTableFilters
      ? isResetPageNumber(oldTableFilters, this.tableFilters()!)
      : false;
    this.stopPolling();
    this.storeItemPerPage(itemsPerPage);
    this.onFilterChange(isResetFilter);
  }

  protected fetchData(event?: InfiniteScrollCustomEvent): void {
    if (this.isMobile) {
      this.loadMoreData(event);
    } else {
      this.fetchDataForTable();
    }
  }

  protected onDragStop(): void {
    this.storeColumnState();
  }

  protected onSortChange(): void {
    this.storeColumnState();
  }

  protected onMobileSelectionChange(event: {
    data: UnknownObject;
    selected: boolean;
  }): void {
    const current = new Map(this.mobileSelectedRows());
    const id = event.data['id'];

    if (event.selected) {
      current.set(id, event.data);
    } else {
      current.delete(id);
    }

    this.mobileSelectedRows.set(current);
    this.selectedRowsChange.emit(Array.from(current.values()));
  }

  protected isRowSelected(data: UnknownObject): boolean {
    return this.mobileSelectedRows().has(data['id']);
  }
  //#endregion

  // #region Private methods
  private storeColumnState(): void {
    const columnState = this.tableRef()?.gridApi?.getColumnState();
    if (!columnState) {
      return;
    }
    const newState = columnState.map((col) => {
      return {
        field: col.colId,
        hide: col.hide ?? false,
        ...(col.sort && { sort: col.sort }),
      };
    });
    this.listViewContextService.setColumnsState(newState, true);
  }

  private loadMoreData(event?: InfiniteScrollCustomEvent): void {
    if (this.loading()) return;

    const fetchDataFn = this.dataSource();
    if (fetchDataFn) {
      this.showLoading();
      fetchDataFn(this.getFilter()).subscribe({
        next: (
          response:
            | IResponse<UnknownObject[]>
            | IPaginatedResponse<UnknownObject[]>,
        ) => {
          const data = this.rowData();
          this.rowData.set([...data, ...response.data]);
          let pageNumber = 1;
          if ('paginate' in response) {
            this.updatePagination(response.paginate, event);
            this.pagination.set(response.paginate);
            pageNumber = response.paginate.pageNumber || 1;
          } else {
            this.infiniteScrollDisabled = true;
          }
          if (response.data.length < this.getItemPerPage()) {
            if (event) {
              event.target.disabled = true;
            }
            this.infiniteScrollDisabled = true;
          }
          this.storePageData(pageNumber, response.data);
          this.hideLoading();
          this.managePollingAfterFetch();
        },
        error: (error) => {
          this.handleLoadMoreError();
          console.log(error);
        },
      });
    }
  }

  private fetchDataForTable(): void {
    const fetchDataFn = this.dataSource();
    if (fetchDataFn) {
      this.showLoading();
      fetchDataFn(this.getFilter()).subscribe({
        next: (response) => {
          this.rowData.set(response.data);
          let pageNumber = 1;
          if ('paginate' in response) {
            this.pagination.set(response.paginate || null);
            pageNumber = response.paginate?.pageNumber || 1;
          }
          this.storePageData(pageNumber, response.data);
          this.hideLoading();
          this.managePollingAfterFetch();
        },
        error: (error) => {
          this.hideLoading();
          console.log(error);
        },
      });
    }
  }

  private getFilter() {
    const modalFilters = this.listViewContextService.getModalFilterValues();
    const { sort, field } =
      this.listViewContextService.getStoreSortState() ?? {};

    const { value } = this.searchTextControl;
    this.lastFetchParams = {
      pageNumber: 1,
      ...modalFilters,
      ...this.tableFilters(),
      ...(value && { searchText: this.searchTextControl.value }),
      ...(this.getExternalFilter() && { ...this.getExternalFilter() }),
      ...(sort && field && { order: sort, sortByColumn: field }),
      itemsPerPage: this.getItemPerPage(),
    };

    return this.lastFetchParams;
  }

  private getExternalFilter() {
    const { type, mapKey } = this.inlineFilterConfig() || {};
    if (type === 'date') {
      const value = this.dateControl.value;
      if (value) {
        return {
          [mapKey ?? 'date']: getUnixTime(value),
        };
      }
    } else if (type === 'date-range') {
      const { from, to } = this.dateRangeControl.value || {};
      if (from && to) {
        return {
          startDate: getUnixTime(from),
          endDate: getUnixTime(to),
        };
      }
    }
    return null;
  }

  private resetFilters(): void {
    this.tableFilters.set({ ...this.tableFilters(), pageNumber: 1 });
    this.rowData.set([]);
    this.pagination.set(null);
    this.infiniteScrollDisabled = false;
    this.mobileSelectedRows.set(new Map());
  }

  private initializeFilters(): void {
    this.columns().forEach((col) => {
      if (!isSelectorType(col)) {
        return;
      }
      if (col.SchoolStructureListingType) {
        let initSelection;
        switch (col.SchoolStructureListingType) {
          case 'company':
          case 'sub-company':
            initSelection =
              this.schoolStructureListingService?.selectedCompany();
            break;
          case 'campus':
            initSelection =
              this.schoolStructureListingService?.selectedCampus();
            break;
          case 'school':
            initSelection =
              this.schoolStructureListingService?.selectedSchool();
            break;
          case 'level':
            initSelection = this.schoolStructureListingService?.selectedLevel();
            break;
          case 'class':
            initSelection = this.schoolStructureListingService?.selectedClass();
            break;
        }
        this.listViewContextService.setModalFilterState(col, initSelection?.id);
      } else if (
        col.field === 'academicYearId' ||
        col.field === 'academicYear'
      ) {
        const initSelection =
          this.academicYearsScopeService.selectedAcademicYear();
        this.listViewContextService.setModalFilterState(col, initSelection?.id);
      } else if (col.filterinitSelection) {
        this.listViewContextService.setModalFilterState(
          col,
          col.filterinitSelection,
        );
      }
    });
  }

  private listenToSchoolStructureFilterModelChange(): void {
    this.selectedSchoolStructureModel$
      .pipe(takeUntilDestroyed(this.destroyRef$), skip(1))
      .subscribe((model) => {
        this.listViewContextService.applySchoolStructureFilters({
          model,
          columns: this.columns(),
        });
        this.onFilterChange();
      });
  }

  private handleFilterChanges(): void {
    this.listViewContextService.filterChange$
      .pipe(takeUntilDestroyed(this.destroyRef$), skip(1))
      .subscribe(() => {
        this.onFilterChange();
      });
  }

  private updatePagination(
    paginate: IPagination,
    event?: InfiniteScrollCustomEvent,
  ): void {
    if (paginate) {
      this.tableFilters.set({
        ...this.tableFilters(),
        pageNumber: paginate.pageNumber + 1,
      });
      if (event && paginate.totalItems <= this.rowData().length) {
        event.target.disabled = true;
      }
      event?.target.complete();
    }
  }

  private handleLoadMoreError() {
    this.infiniteScrollDisabled = true;
    this.hideLoading();
  }

  private showLoading(): void {
    this.loading.set(true);
  }

  private hideLoading(): void {
    this.loading.set(false);
  }

  private listenToAcademicYearScopeChange(): void {
    this.selectedAcademicYearScope$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((model) => {
        const academicYearIdCol = this.columns().find(
          (col) =>
            isSelectorType(col) &&
            Object.values(AcademicYearFilterName).includes(
              col.field as AcademicYearFilterName,
            ),
        );
        if (academicYearIdCol) {
          this.listViewContextService.setModalFilterState(
            academicYearIdCol,
            model?.id,
          );
        }
        this.onFilterChange();
      });
  }

  private listenForHideAndShowColumn(): void {
    this.listViewContextService.applyModalFilter$
      .pipe(
        withLatestFrom(this.listViewContextService.columnState$),
        takeUntilDestroyed(this.destroyRef$),
      )
      .subscribe(([_, columnsState]) => {
        const selectedColumnHeader: string[] = [];
        columnsState?.forEach((col) => {
          !col.hide && selectedColumnHeader.push(col.field);
        });
        this.tableRef()?.updateSelectedColumns(selectedColumnHeader ?? []);
      });
  }

  private initInlineFilterConfig(): void {
    const { initalValueDate, type } = this.inlineFilterConfig() || {};
    if (type === 'date') {
      if (initalValueDate) {
        this.dateControl.setValue(initalValueDate);
      }
    }
  }

  private storeItemPerPage(itemsPerPage: number): void {
    if (this.isMobile) {
      return;
    }
    if (itemsPerPage && itemsPerPage !== this.defaultItemsPerPage) {
      localStorage.setItem(
        this.getItemPerPageStorageKey(),
        String(itemsPerPage),
      );
    } else {
      localStorage.removeItem(this.getItemPerPageStorageKey());
    }
  }

  private getItemPerPage(): number {
    if (this.isMobile) {
      return this.defaultItemsPerPage;
    }
    return (
      Number(localStorage.getItem(this.getItemPerPageStorageKey())) ||
      this.defaultItemsPerPage
    );
  }

  private getItemPerPageStorageKey(): string {
    return generateKeyFromUrl('itemPerPage');
  }
  // #endregion

  // #region Polling Implementation
  private startPolling(): void {
    if (this.isPollingActive || !this.isPollingAllowed()) return;

    this.isPollingActive = true;
    const interval = this.pollingInterval();

    this.pollingSubscription = timer(interval, interval)
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        switchMap(() => this.checkPagesForUpdates()),
      )
      .subscribe();
  }

  private stopPolling(): void {
    this.isPollingActive = false;
    this.pollingSubscription?.unsubscribe();
    this.loadedPages.clear();
  }

  private checkPagesForUpdates(): Observable<void> {
    const pagesToUpdate = this.getPagesNeedingUpdate();
    if (pagesToUpdate.length === 0) return of(undefined);

    return forkJoin(
      pagesToUpdate.map((page) => this.fetchPageForPolling(page)),
    ).pipe(
      map((results) => {
        results.forEach(({ page, data }) => {
          this.updatePageData(page, data);
          this.storePageData(page, data);
        });
        this.checkPollingCondition();
      }),
      catchError(() => of(undefined)),
    );
  }

  private getPagesNeedingUpdate(): number[] {
    const pages: number[] = [];
    this.loadedPages.forEach((data, page) => {
      if (this.shouldPoll()(data)) {
        pages.push(page);
      }
    });
    return pages;
  }

  private fetchPageForPolling(
    page: number,
  ): Observable<{ page: number; data: UnknownObject[] }> {
    const params = {
      ...this.lastFetchParams,
      pageNumber: page,
      itemsPerPage: this.getItemPerPage(),
    };

    const fetchDataFn = this.dataSource();
    if (!fetchDataFn) {
      return of({ page, data: [] });
    }
    return fetchDataFn(params).pipe(
      map((response) => ({
        page,
        data: response.data,
      })),
    );
  }

  private updatePageData(page: number, newData: UnknownObject[]): void {
    if (this.isMobile) {
      this.updateMobilePageData(page, newData);
    } else {
      this.updateDesktopPageData(page, newData);
    }
  }

  private updateMobilePageData(page: number, newData: UnknownObject[]): void {
    const pageSize = this.getItemPerPage();
    const startIndex = (page - 1) * pageSize;
    const currentData = [...this.rowData()];

    currentData.splice(startIndex, newData.length, ...newData);
    this.rowData.set(currentData);
  }

  private updateDesktopPageData(page: number, newData: UnknownObject[]): void {
    let pageNumber = this.getCurrentPageForPolling();
    if (page === pageNumber) {
      this.rowData.set(newData);
    }
  }

  private storePageData(page: number, data: UnknownObject[]): void {
    this.loadedPages.set(page, data);
  }

  private checkPollingCondition(): void {
    const shouldContinue = Array.from(this.loadedPages.values()).some(
      (pageData) => this.shouldPoll()(pageData),
    );

    if (!shouldContinue) {
      this.stopPolling();
    } else if (!this.isPollingActive) {
      this.startPolling();
    }
  }

  private managePollingAfterFetch(): void {
    if (!this.isPollingAllowed()) return;

    // For mobile, check all loaded pages
    if (this.isMobile) {
      const allData = this.rowData();
      if (this.shouldPoll()(allData)) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    }
    // For desktop, check only current page
    else {
      const currentPage = this.getCurrentPageForPolling();
      if (!currentPage) return;
      const currentPageData = this.loadedPages.get(currentPage) || [];
      if (this.shouldPoll()(currentPageData)) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    }
  }

  private getCurrentPageForPolling(): number | null {
    return (
      this.pagination()?.['pageNumber'] ?? (this.loadedPages.get(1) ? 1 : null)
    );
  }
  // #endregion
}
// #region internal
type DataSource = (
  params: Record<string, any>,
) => Observable<
  IPaginatedResponse<Array<UnknownObject>> | IResponse<Array<UnknownObject>>
>;

// #endregion

// #region external
export interface InlineFilterConfig {
  type: 'date' | 'date-range';
  mapKey?: string;
  noDefault?: boolean;
  initalValueDate?: Date;
  clear?: boolean;
  readonly?: boolean;
  placeholder?: boolean;
  datePickerConfig?: {
    // Min date
    min?: TuiDay | null;
    // Max date
    max?: TuiDay | null;
    //Minimal length of range
    minLength?: TuiDayLike | null;
    // Maximal length of range
    maxLength?: TuiDayLike | null;
  };
}

export interface ListViewNoDataConfig {
  noBgStyle?: boolean; // Optional, defaults to false
  mainImagePath?: string;
  title: string;
  description?: string;
  primaryButton?: NoDataBtnInterface;
  secondaryButton?: NoDataBtnInterface;
  allowFullScreen?: boolean;
}

function getPathWithoutQueryParams(url: string): string {
  return url.split('?')[0];
}
// #endregion
