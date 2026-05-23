import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { ITableCol, MobileDetailHeaderContext } from '@ui-kit/hes-table/model';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { faEye } from '@fortawesome/pro-regular-svg-icons';
import { map } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Idropdown } from '@shared/interfaces';
import { toDropdown } from '@shared/utils/to-dropdown';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  ListViewContainerComponent,
  ListViewNoDataConfig,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { ReportCardProcessingAPIService } from '@pages/report-card/processing/data-access/report-card-processing.api-service';
import { ACADEMIC_CALENDER_TYPE } from '../../data-access/report-card-list.enum';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ReportCardList } from '../../data-access/report-card-processing.interface';
import { ReportCardTitleCellComponent } from '../../components/report-card-title-cell/report-card-title-cell.component';
import { HesDateTimePipe } from '@shared/pipes/hes-date-time.pipe';

@Component({
  selector: 'app-report-card-list',
  templateUrl: './report-card-list.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    NoSelectedScopeCardComponent,
    ListViewContainerComponent,
    TranslocoDirective,
    HesDateTimePipe,
  ],
})
export class ReportCardListPage implements OnInit {
  // #region injector
  private readonly translate = inject(HesTranslateService);
  private readonly toaster = inject(HesToasterService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly reportCardProcessingAPIService = inject(
    ReportCardProcessingAPIService,
  );

  // #endregion

  // #region protected properties
  protected readonly columns = computed(() => {
    return this.getColumns();
  });
  protected readonly noDataConfig = this.getNoDataConfig();
  protected readonly levels = signal<Idropdown[]>([]);
  protected readonly semesters = signal<Idropdown[]>([]);
  protected readonly displayContent = signal(false);
  protected readonly requiredScopes: Array<HesScope> = [
    'school',
    'academicYear',
  ];
  // #endregion
  private readonly reportCardUpdatedBadgeTemplateSignal = viewChild<
    TemplateRef<MobileDetailHeaderContext<ReportListing>>
  >('reportCardUpdatedBadge');

  constructor() {
    toObservable(this.academicYearsScopeService.selectedAcademicYear)
      .pipe(takeUntilDestroyed())
      .subscribe((resp) => {
        if (resp) {
          this.semesters.set(toDropdown(resp.semesters));
        } else {
          this.semesters.set([]);
        }
      });
  }

  ngOnInit() {}

  // #region protected methods
  protected fetchReportCardsByClass = (params: any) => {
    const { id: academicYearId } =
      this.academicYearsScopeService.selectedAcademicYear() || {};
    const payload = {
      ...params,
      ...(academicYearId && { academicYearId }),
      schoolId: this.schoolScopeService.selectedSchoolId(),
    };
    return this.reportCardProcessingAPIService
      .fetchReportCardsByClass(payload)
      .pipe(
        map((resp) => {
          return { data: this.mapListing(resp.data), paginate: resp.paginate };
        }),
      );
  };
  // #endregion

  // #region protected methods
  protected handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }
  // #endregion

  // #region private methods
  private getColumns(): ITableCol<any>[] {
    return [
      {
        field: 'title',
        headerName: this.translate.t('global.title.title'),
        sortable: true,
        filter: false,
        mobileViewConfig: {
          isPrimaryKey: true,
          headerTemplate:
            this.reportCardUpdatedBadgeTemplateSignal() ?? undefined,
        },
        cellRenderer: ReportCardTitleCellComponent,
        minWidth: 250,
      },
      {
        field: 'levelId',
        headerName: this.translate.t('global.level.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'level',
        includeNoneOption: false,
      },
      {
        field: 'classId',
        headerName: this.translate.t('global.class.label'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'class',
        includeNoneOption: false,
      },
      {
        field: 'semesterId',
        headerName: this.translate.t('global.semester.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        filterSelectOptions: this.semesters(),
      },
      {
        field: 'type',
        headerName: this.translate.t('global.type.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        filterSelectOptions: [
          {
            value: ACADEMIC_CALENDER_TYPE.ANNUAL,
            displayedValue: this.translate.t('enum.ANNUAL'),
          },
          {
            value: ACADEMIC_CALENDER_TYPE.SEMESTER,
            displayedValue: this.translate.t('global.semester.title'),
          },
        ],
      },
      {
        field: 'inDraft',
        headerName: this.translate.t('in.draft'),
        sortable: false,
        filter: false,
      },
      {
        field: 'startDate',
        headerName: this.translate.t('global.start_date.title'),
        sortable: true,
        filter: true,
        filterType: 'date',
        type: 'date',
      },
      {
        field: 'endDate',
        headerName: this.translate.t('global.end_date.title'),
        sortable: true,
        filter: true,
        filterType: 'date',
        type: 'date',
      },
      {
        field: 'actions',
        headerName: this.translate.t('global.actions.title'),
        sortable: false,
        filter: false,
        type: 'action',
        lockPosition: true,
        actions: this.getActions(),
      },
    ];
  }

  private getActions(): IAction<ReportListing>[] {
    return [
      {
        iconProps: { icon: faEye },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.VIEW,
          );
        },
        text: this.translate.t('global.view.btn'),
        onClick: (data) => {
          this.router.navigate([`${data.id}/class/${data.class}`], {
            relativeTo: this.route,
            queryParams: {
              className: data.classId,
              levelName: data.levelId,
              reportCardName: data.title,
            },
          });
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: {
            color: 'primary',
          },
        },
      },
    ];
  }

  private getNoDataConfig(): ListViewNoDataConfig {
    return {
      allowFullScreen: true,
      noBgStyle: true,
      mainImagePath: 'assets/illustrations/no_data.svg',
      title: this.translate.t('grade_management.no_report_card.title'),
      description: this.translate.t('grade_management.no_report_card_yet.txt'),
    };
  }

  private mapListing(data: ReportCardList[]): ReportListing[] {
    return data.map((item) => {
      return {
        id: item.reportCard.id,
        title: item.reportCard.title,
        levelId: item.level.displayName,
        class: item.class.id,
        classId: item.class.displayName,
        semesterId: item.semester.map((semester) => semester.name).join(', '),
        type: this.getReportCardType(item.reportCard.semesterId != null),
        startDate: item.reportCard.startDate,
        endDate: item.reportCard.endDate,
        reportCardId: item.reportCard.id,
        inDraft: item.reportCard.inDraft,
        updatedAt: item.reportCard.updatedAt,
      };
    });
  }

  getReportCardType(isSemesterId: boolean): string {
    return isSemesterId
      ? this.translate.t('enum.SEMESTER')
      : this.translate.t('enum.ANNUAL');
  }
  // #endregion
}

interface ReportListing {
  id: ObjId;
  title: string;
  levelId: string;
  class: ObjId;
  classId: ObjId;
  semesterId: string;
  type: string;
  startDate: string;
  endDate: string;
  reportCardId: ObjId;
  inDraft: number;
  updatedAt?: string;
}
