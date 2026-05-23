import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { isMobile } from '@shared/utils/platform';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  IonContent,
  IonModal,
  IonToolbar,
  IonHeader,
  IonTitle,
} from '@ionic/angular/standalone';
import {
  AcademicYearTableColDefService,
  AcademicYearsTableCol,
} from './academic-years-col-def.service';
import { IPagination } from '@shared/interfaces';
import { SortOrder } from '@shared/enums';
import { SemesterDTO } from './data-access/academic-year.dto';
import { INoRowsOverlay, ITableModel } from '@ui-kit/hes-table/model';
import { isResetPageNumber } from '@shared/utils/is-reset-page.util';
import { ApiParam } from '@core/api-services/role-api/dto/role.dto';
import { AcademicYearApiService } from './data-access/academic-year.api-service';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import {
  SizeColumnsToFitGridStrategy,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import { AcademicYearModalService } from './utils/academic-year-modal.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { ListingHeaderComponent } from '@shared/components/user-listing-header/listing-header.component';
import { TuiDialogModule, TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { AcademicYearFormComponent } from './components/academic-year-form/academic-year-form.component';
import { DEFAULT_PARAM } from '@shared/constants/default-page-param.constant';

interface AcademicYearTableMataData {
  id?: number;
  name?: string;
  startDate?: string;
  endDate?: string;
  semesters?: SemesterDTO[];
  order?: SortOrder;
  pageNumber?: number;
  itemsPerPage?: number;
  sortByColumn?: string;
  searchText?: string;
}

@Component({
  selector: 'app-academic',
  templateUrl: './academic-year.page.html',
  standalone: true,
  imports: [
    IonTitle,
    IonHeader,
    IonToolbar,
    CommonModule,
    FormsModule,
    NoDataCardComponent,
    TranslocoDirective,
    HesButtonModule,
    FontAwesomeModule,
    IonContent,
    HesTableComponent,
    RbacDirective,
    ListingHeaderComponent,
    IonModal,
    TuiDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicYearPage implements OnInit, OnDestroy {
  private readonly transloco = inject(TranslocoService);
  private readonly academicYearTableColDefService = inject(
    AcademicYearTableColDefService,
  );
  private readonly academicYearsApiService = inject(AcademicYearApiService);
  private readonly academicModalService = inject(AcademicYearModalService);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  readonly faPlus = faPlus;
  readonly isMobile = isMobile();
  readonly columnDefs = this.academicYearTableColDefService.colDef;
  readonly academicYearTableData = signal<Array<AcademicYearsTableCol>>([]);
  readonly paginate = signal<IPagination | null>(null);
  readonly apiQueryParam = signal<ApiParam>(DEFAULT_PARAM);
  private readonly sub = new Subscription();
  readonly academicCreatePermission = [
    RESOURCE_PERMISSION.academicYear.academicYearCreate,
  ];
  autoSizeStrategy:
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToContentStrategy
    | undefined = { type: 'fitCellContents' };

  noRowsOverlayComponentParams = signal<INoRowsOverlay>({
    imgSrc: 'assets/illustrations/personnel.png',
    title: this.transloco.translate(
      'academic_enrolment.no_academic_year_semester.title',
    ),
    ...(this.rbacService.hasPermission(
      RESOURCE_PERMISSION.academicYear.academicYearCreate,
    ) && {
      subTitle: this.transloco.translate(
        'academic_enrolment.no_academic_year_semester_msg.text',
      ),
      btnText: this.transloco.translate(
        'academic_enrollment.add_academic_year.btn',
      ),
      btnClick: () => {
        this.academicModalService.showAcademicForm();
      },
    }),
  });

  isLoading = signal(false);

  isModalOpen = signal(false);

  constructor(
    @Inject(TuiDialogService)
    private readonly dialogs: TuiDialogService,
    @Inject(Injector) private readonly injector: Injector,
  ) {}

  ngOnInit(): void {
    this.noRowsOverlayComponentParams.set({
      imgSrc: 'assets/illustrations/personnel.png',
      title: this.transloco.translate(
        'academic_enrolment.no_academic_year_semester.title',
      ),
      ...(this.rbacService.hasPermission(
        RESOURCE_PERMISSION.academicYear.academicYearCreate,
      ) && {
        subTitle: this.transloco.translate(
          'academic_enrolment.no_academic_year_semester_msg.text',
        ),
        btnText: this.transloco.translate(
          'academic_enrollment.add_academic_year.btn',
        ),
        btnClick: () => {
          this.academicModalService.showAcademicForm();
        },
      }),
    });
    this.sub.add(
      this.academicModalService.onSuccessAcademic$.subscribe(() => {
        this.apiQueryParam.update((item) => ({ ...item, pageNumber: 1 }));
        this.fetchAcademicYears();
      }),
    );
    if (!this.isMobile) {
      this.autoSizeStrategy = { type: 'fitGridWidth' };
    }
    this.fetchAcademicYears();
  }
  onTableMetaDataChange(event: ITableModel<AcademicYearTableMataData>) {
    if (event) {
      const { colName, order, pageNumber, itemsPerPage, ...params } = event;
      let newParams = {
        ...params,
        ...(colName && { sortByColumn: colName }),
        ...(order && { order }),
        ...(pageNumber && { pageNumber: pageNumber }),
        ...(itemsPerPage && { itemsPerPage: itemsPerPage }),
      };
      if (isResetPageNumber(this.apiQueryParam(), newParams)) {
        newParams.pageNumber = 1;
      }
      this.apiQueryParam.set(newParams);
    }
    this.fetchAcademicYears();
  }

  onCreateAcademicYear() {
    this.dialogs
      .open<number>(
        new PolymorpheusComponent(AcademicYearFormComponent, this.injector),
        {
          dismissible: true,
        },
      )
      .subscribe({
        complete: () => {
          this.fetchAcademicYears();
        },
      });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
  private fetchAcademicYears() {
    this.isLoading.set(true);
    this.academicYearsApiService
      .fetchAcademicYears(this.apiQueryParam() || DEFAULT_PARAM)
      .subscribe({
        next: (response) => {
          this.paginate.set(response.paginate);
          this.academicYearTableData.set(
            response.data as AcademicYearsTableCol[],
          );
          this.isLoading.set(false);
        },
        error: (err) => {
          if (err.status === 404 && err.error.paginate.totalItems === 0) {
            this.academicYearTableData.set([]);
          }
          this.paginate.set(err.error.paginate);
          this.isLoading.set(false);
        },
      });
  }

  onRowClicked(event: AcademicYearsTableCol) {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.academicYear.academicYearDetailView,
      )
    ) {
      this.academicModalService.viewAcademic(event.id);
    }
  }
}
