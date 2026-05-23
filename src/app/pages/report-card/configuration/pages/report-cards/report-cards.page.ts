import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { ActivatedRoute, Router } from '@angular/router';
import { isMobile } from '@shared/utils/platform';
import { ReportCardConfigurationAPIService } from '../../data-access/report-card-configuration.api-service';
import {
  ListViewContainerComponent,
  ListViewNoDataConfig,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { ITableCol } from '@ui-kit/hes-table/model';
import { ManageReportCardListDTO } from '../../data-access/report-card-configuration.model';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { faEye, faPlus, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { ObjId } from '@shared/interfaces/common.interface';
import { TranslocoDirective } from '@jsverse/transloco';
import { map } from 'rxjs';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SchoolService } from '@pages/school-structure/pages/school/school.service';
import { Idropdown } from '@shared/interfaces';
import { toDropdown } from '@shared/utils/to-dropdown';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { ManageReportCardContextService } from '../../services/manage-report-card-context.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ManageReportCardList } from '../../data-access/report-card-configuration.interface';

@Component({
  templateUrl: './report-cards.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    ListViewContainerComponent,
    TranslocoDirective,
    NoSelectedScopeCardComponent,
  ],
})
export class ReportCardsPage implements OnInit {
  // #region injector
  private readonly contextService = inject(ManageReportCardContextService);
  private readonly translate = inject(HesTranslateService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly reportCardConfigurationAPIService = inject(
    ReportCardConfigurationAPIService,
  );
  private readonly feedbackService = inject(FeedbackService);
  private readonly toaster = inject(HesToasterService);
  private readonly schoolService = inject(SchoolService);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  // #endregion

  // #region Protected Properties
  protected readonly columns = computed(() => {
    return this.getColumns();
  });
  protected readonly noDataConfig = this.getNoDataConfig();
  protected readonly primaryBtnConfig = this.getPrimaryBtnConfig();
  protected readonly isMobile = isMobile();
  protected readonly levels = signal<Idropdown[]>([]);
  protected readonly semesters = signal<Idropdown[]>([]);
  protected readonly displayContent = signal(false);
  protected readonly requiredScopes: Array<HesScope> = [
    'school',
    'academicYear',
  ];
  // #endregion

  // #region Angular ref
  viewContainerListRef = viewChild(ListViewContainerComponent);
  // #endregion

  // #region Private Properties
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

  ngOnInit() {
    this.schoolService.getLevels().subscribe((levels) => {
      this.levels.set(toDropdown(levels));
    });
  }

  // #region Protected Methods
  protected handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  protected fetchReportCards = (params: any) => {
    const { id: academicYearId } =
      this.academicYearsScopeService.selectedAcademicYear() || {};
    const payload = {
      ...params,
      ...(academicYearId && { academicYearId }),
      schoolId: this.schoolScopeService.selectedSchoolId(),
    };
    return this.reportCardConfigurationAPIService
      .fetchReportCards(payload)
      .pipe(
        map((resp) => {
          return { data: mapListing(resp.data), paginate: resp.paginate };
        }),
      );
  };
  // #endregion

  // #region Private Methods

  private getColumns(): ITableCol<ReportListing>[] {
    return [
      {
        field: 'title',
        headerName: this.translate.t('global.title.title'),
        sortable: true,
        filter: false,
        mobileViewConfig: {
          isPrimaryKey: true,
        },
      },
      {
        field: 'schoolId',
        headerName: this.translate.t('global.school.title'),
        sortable: false,
        filter: false,
      },
      {
        field: 'levelIds',
        headerName: this.translate.t('global.level.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        includeNoneOption: false,
        isMultpleFilterSelect: true,
        SchoolStructureListingType: 'level',
      },
      {
        field: 'semesterId',
        headerName: this.translate.t('global.semester.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        includeNoneOption: false,
        filterSelectOptions: this.semesters(),
      },

      {
        field: 'startDate',
        headerName: this.translate.t('global.start_date.title'),
        sortable: true,
        filter: false,
        type: 'date',
      },
      {
        field: 'endDate',
        headerName: this.translate.t('global.end_date.title'),
        sortable: true,
        filter: false,
        type: 'date',
      },
      {
        field: 'actions',
        headerName: this.translate.t('global.actions.title'),
        sortable: false,
        filter: false,
        type: 'action',
        forceActionSheet: true,
        lockPosition: true,
        actions: this.getActions(),
      },
    ];
  }

  private getActions(): IAction<ReportListing>[] {
    const { REPORT_CARD } = RESOURCE_PERMISSION.GRADE_MANAGEMENT;
    return [
      {
        iconProps: { icon: faEye },
        hasPermission: () => {
          return this.rbacService.hasPermission(REPORT_CARD.VIEW);
        },
        text: this.translate.t('global.view.btn'),
        onClick: (data) => {
          this.contextService.viewReportCardState();
          this.router.navigate([`${data.id}`], {
            relativeTo: this.route,
          });
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: {
            color: 'primary',
          },
        },
      },
      {
        iconProps: { icon: faTrash },
        hasPermission: () => {
          return this.rbacService.hasPermission(REPORT_CARD.DELETE);
        },
        text: this.translate.t('global.delete.btn'),
        onClick: (data) => {
          if (data.id !== null) this.showDeleteConfirmation(data.id!);
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
      description: this.translate.t('grade_management.no_report_card.txt'),
      primaryButton: {
        label: this.translate.t('grade_management.add_report_card.btn'),
        onAction: () => {
          this.contextService.addReportCardState();
          this.router.navigate(['add-report-card'], { relativeTo: this.route });
        },
      },
    };
  }

  private getPrimaryBtnConfig() {
    return {
      iconProps: { icon: faPlus },
      text: this.translate.t('grade_management.add_report_card.btn'),
      onClick: () => {
        this.contextService.addReportCardState();
        this.router.navigate(['add-report-card'], {
          relativeTo: this.route,
        });
      },
      isVisible: () => {
        return this.rbacService.hasPermission(
          RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.CREATE,
        );
      },
    };
  }
  private async showDeleteConfirmation(id: ObjId) {
    return await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translate.t('grade_management.report_card_delete.txt'),
        primaryBtnStr: this.translate.t('global.delete.btn'),
        secondaryBtnStr: this.translate.t('global.cancel.btn'),
      },
      () => {
        this.reportCardConfigurationAPIService.deleteReportCard(id).subscribe({
          next: () => {
            this.toaster.success(
              this.translate.t(
                'grade_management.report_card_delete_success.txt',
              ),
            );
            this.reload();
          },
          error: (err) => {
            this.toaster.showBackendError(err);
          },
        });
      },
    );
  }

  private reload() {
    this.viewContainerListRef()?.triggerFetch();
  }
  // #endregion
}

// #region internal

interface ReportListing {
  id: ObjId;
  title: string;
  schoolId: string;
  levelIds: string;
  academicYearsName: string;
  semesterId: string;
  startDate: string;
  endDate: string;
}

function mapListing(data: ManageReportCardList[]): ReportListing[] {
  return data.map((item) => {
    return {
      id: item.id,
      title: item.title,
      schoolId: item.schools.map((school) => school.displayName).join(', '),
      levelIds: item.levels.map((level) => level.displayName).join(', '),
      academicYearsName: item.academicYears
        .map((academicYear) => academicYear.name)
        .join(', '),
      semesterId: item.semesters.map((semester) => semester.name).join(', '),
      startDate: item.startDate,
      endDate: item.endDate,
    };
  });
}
// #endregion
