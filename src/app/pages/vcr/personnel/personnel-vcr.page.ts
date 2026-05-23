import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule } from '@angular/forms';
import { IonContent, Platform } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { VCRColDefService, VCRTableItem } from '../vcr-col-def.service';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { VcrAPIService } from '../data-access/vcr.api-service';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { combineLatest, finalize, pipe, skip } from 'rxjs';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { INoRowsOverlay, ITableModel } from '@ui-kit/hes-table/model';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import {
  VCRFilterParam,
  VcrListFilterComponent,
} from '../components/vcr-list-filter/vcr-list-filter.component';
import { VirtualClassroomRequestPayload } from '../data-access/vcr.dto';
import { DEFAULT_PARAM } from '@shared/constants/default-page-param.constant';
import { IPagination } from '@shared/interfaces';
import { isResetPageNumber } from '@shared/utils/is-reset-page.util';
import {
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
} from 'ag-grid-community';
import { AuthService } from '@auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { isMobile } from '@shared/utils/platform';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { SortOrder } from '@shared/enums';
import { VirtualClassroomFilterBy } from '../data-access/vcr.enum';

@Component({
  selector: 'app-personnel-vcr',
  templateUrl: './personnel-vcr.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    TranslocoDirective,
    HesTableComponent,
    NoSelectedScopeCardComponent,
    VcrListFilterComponent,
  ],
})
export class PersonnelVCRPage implements OnInit {
  //#region injection
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly vcrColDefService = inject(VCRColDefService);
  private readonly vcrApiService = inject(VcrAPIService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly translateService = inject(HesTranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly platform = inject(Platform);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destoryRef = inject(DestroyRef);
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );
  //#endregion

  //#region Public Properties
  readonly paginate = signal<IPagination | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly vcrRowData = signal<VCRTableItem[]>([]);
  readonly displayContent = signal(false);
  readonly columnsDef = this.vcrColDefService.columnsDef;
  readonly requiredScopes: Array<HesScope> = ['school', 'academicYear'];
  readonly isMobile = isMobile();
  noRowsOverlayComponentParams = signal<INoRowsOverlay>({
    imgSrc: 'assets/illustrations/no_data.svg',
    title: this.translateService.t('virtual_classrooms.no_vcrs_added.txt'),
    ...(this.rbacService.hasPermission(
      RESOURCE_PERMISSION.VCR.CREATE.ADD,
      true,
    ) && {
      subTitle: this.translateService.t(
        'virtual_classrooms.add_vcr_prompt.txt',
      ),
      btnText: this.translateService.t('virtual_classrooms.add_vcr.btn'),
      btnClick: () => {
        this.router.navigate(['add'], {
          relativeTo: this.route,
        });
      },
    }),
  });
  computeGridStragies = computed<
    SizeColumnsToFitGridStrategy | SizeColumnsToContentStrategy
  >(() => {
    const data = this.vcrRowData();
    const isMoreLectureInCell = data.some((item) => item.lectures.length > 1);
    return isMoreLectureInCell || this.isMobile
      ? { type: 'fitCellContents' }
      : { type: 'fitGridWidth' };
  });

  //#endregion

  // #region private properties
  private readonly requestFilterPayload =
    signal<VirtualClassroomRequestPayload | null>(null);
  // #endregion

  //#region public methods
  constructor() {
    combineLatest([
      toObservable(this.schoolScopeService.selectedSchoolId),
      toObservable(this.academicYearScope.selectedAcademicYear),
      toObservable(this.academicYearScope.selectedSemester),
    ])
      .pipe(takeUntilDestroyed(), skip(1))
      .subscribe(() => {
        this.setFilterAndFetchRecord();
      });

    if (this.isGuardian()) {
      toObservable(this.studentSelectionScopeService.selectedStudent)
        .pipe(takeUntilDestroyed())
        .subscribe(() => {
          this.setFilterAndFetchRecord();
        });
    }
  }
  ngOnInit(): void {
    this.vcrColDefService.refreshTable
      .pipe(takeUntilDestroyed(this.destoryRef))
      .subscribe(() => {
        this.fetchVCRList();
      });
  }

  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  ionViewWillEnter() {
    this.fetchVCRList();
  }
  onFilterChange(filterParam: VCRFilterParam) {
    this.setFilterAndFetchRecord({ ...filterParam, pageNumber: 1 });
  }
  onTableMetaDataChange(event: ITableModel) {
    if (event) {
      const { colName, order, pageNumber, itemsPerPage, ...params } = event;
      let newParams = {
        ...params,
        ...(colName && { sortByColumn: colName }),
        ...(order && { order }),
        ...(pageNumber && { pageNumber: pageNumber }),
        ...(itemsPerPage && { itemsPerPage: itemsPerPage }),
      };
      if (isResetPageNumber(this.requestFilterPayload()!, newParams)) {
        newParams.pageNumber = 1;
      }
      this.setFilterAndFetchRecord(newParams);
    }
  }
  //#endregion

  // #region private methods

  private fetchVCRList(
    filterParams: VirtualClassroomRequestPayload | null = this.requestFilterPayload(),
  ) {
    if (filterParams === null) {
      return;
    }
    if (!this.authService.isUserPersonnel()) {
      filterParams = {
        ...filterParams,
        order:
          filterParams.filterBy === VirtualClassroomFilterBy.ALL
            ? SortOrder.DESC
            : undefined,
      };
    }
    this.isLoading.set(true);
    this.vcrApiService
      .fetchVCRList(filterParams, this.authService.isUserPersonnel())
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.paginate.set(response.paginate);
          this.vcrRowData.set(
            this.vcrColDefService.mapToTableRow(response.data),
          );
        },
        error: (err) => {
          if (err.status === 404 && err.error.paginate.totalItems === 0) {
            this.vcrRowData.set([]);
          }
          this.paginate.set(err.error.paginate);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  private setFilterAndFetchRecord(
    filter?: Partial<VirtualClassroomRequestPayload>,
  ) {
    this.requestFilterPayload.update((value) => {
      let updateFilter = {
        pageNumber: this.paginate()?.pageNumber || DEFAULT_PARAM.pageNumber,
        itemsPerPage: DEFAULT_PARAM.itemsPerPage,
        ...value,
        ...filter,
        academicYearId: this.academicYearScope.selectedAcademicYear()!.id,
        schoolId: this.schoolScopeService.selectedSchoolId()!,
      };

      if (this.isGuardian()) {
        updateFilter = {
          ...updateFilter,
          classId:
            this.studentSelectionScopeService.selectedStudent()?.school?.class
              ?.id,
        };
      }
      return updateFilter;
    });
    this.fetchVCRList();
  }

  private isGuardian() {
    return this.authService.isUserGuardian();
  }
  // #endregion
}

// #region internal
export type ApiParam = {
  sortByColumn?: string;
  order?: string;
  pageNumber?: number;
  itemsPerPage?: number;
};
// #endregion
