import {
  Component,
  inject,
  OnInit,
  computed,
  signal,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { ReportCardProcessingAPIService } from '@pages/report-card/processing/data-access/report-card-processing.api-service';
import { ITableCol } from '@ui-kit/hes-table/model';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { ListViewContainerComponent } from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { BehaviorSubject, map, skip, take, tap } from 'rxjs';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolService } from '@pages/school-structure/pages/school/school.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { Idropdown } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  PublishReportCardParams,
  StudentReportCardDTO,
} from '@pages/report-card/processing/data-access/report-card-processing.dto';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { StudentReportCardStatusTableCellComponent } from '../../components/student-report-card-status-table-cell/student-report-card-status-table-cell.component';
import { STUDENT_REPORT_CARD_STATUS } from '../../data-access/report-card-list.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { formatToHesDate } from '@utils/date';
import { PdfPrintService } from '@shared/services/pdf-print.service';
import { IListViewPrimaryAction } from '@ui-kit/hes-responsive-list-view/list-view.interface';
import { StudentReportCard } from '../../data-access/report-card-processing.interface';

@Component({
  selector: 'app-student-report-card-list',
  templateUrl: './student-report-card-list.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    TranslocoDirective,
    NoSelectedScopeCardComponent,
    ListViewContainerComponent,
  ],
})
export class StudentReportCardsList implements OnInit {
  // #region input
  reportCardId = input<ObjId>();
  classId = input<ObjId>();
  reportCardName = input<string>();
  className = input<string>();
  levelName = input<string>();
  // #endregion

  // #region injectable
  private readonly pdfPrintService = inject(PdfPrintService);
  private readonly router = inject(Router);
  private readonly translate = inject(HesTranslateService);
  private readonly toaster = inject(HesToasterService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly schoolService = inject(SchoolService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly reportCardProcessingAPIService = inject(
    ReportCardProcessingAPIService,
  );
  private readonly route = inject(ActivatedRoute);
  // #endregion

  // #region protected properties
  protected readonly publishReportCardPermission =
    this.rbacService.hasPermission(
      RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.PUBLISH,
    );
  protected readonly viewReportCardPermission = this.rbacService.hasPermission(
    RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.VIEW,
  );
  protected selectedRows = signal<ReportListing[]>([]);
  protected readonly primaryActions = computed<IListViewPrimaryAction[]>(() => {
    const isEnablePrintButton = this.selectedRows().some(
      (i) => i.status === STUDENT_REPORT_CARD_STATUS.PUBLISHED,
    );
    const isPublishBtnEnable = this.selectedRows().some(
      (i) => i.status === STUDENT_REPORT_CARD_STATUS.DRAFT,
    );
    return [
      {
        text: this.translate.t(
          'grade_management.main_content.publish_all_button',
        ),
        onClick: () => {
          const payload = this.getPublishReportCardPayload();
          if (payload.studentIds.length === 0) return;
          this.reportCardProcessingAPIService
            .publishReportCard(this.getPublishReportCardPayload())
            .subscribe({
              next: (resp) => {
                this.toaster.success(
                  this.translate.t(
                    `grade_management.report_card_publish_success.txt`,
                  ),
                );
                this.reloadListView();
              },
              error: (err) => {
                this.toaster.showBackendError(err);
              },
            });
        },
        isDisabled: !isPublishBtnEnable,
        isVisible: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.PUBLISH,
          );
        },
      },
      {
        text: this.translate.t(
          'grade_management.main_content.print_all_button',
        ),
        onClick: () => {
          this.printReportCard();
        },
        isDisabled: !isEnablePrintButton,
        isVisible: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.VIEW,
          );
        },
      },
    ];
  });
  protected readonly columns = computed<ITableCol[]>(() => {
    return this.getColumns();
  });
  protected readonly levels = signal<Idropdown[]>([]);
  protected readonly semesters = signal<Idropdown[]>([]);
  protected readonly displayContent = signal(false);
  protected readonly requiredScopes: Array<HesScope> = [
    'school',
    'academicYear',
  ];

  protected fetchReportCardByStudents = (params: any) => {
    const { id: academicYearId } =
      this.academicYearsScopeService.selectedAcademicYear() || {};
    delete params.pageNumber;
    delete params.itemsPerPage;
    const payload = {
      ...params,
      ...(academicYearId && { academicYearId }),
      classId: this.classId(),
      reportCardId: this.reportCardId(),
      paginate: false,
    };
    return this.reportCardProcessingAPIService
      .fetchReportCardByStudents(payload)
      .pipe(
        map((resp) => {
          return { data: mapListing(resp.data), message: '' };
        }),
        tap((resp) => {
          this.studentList$.next(resp.data);
        }),
      );
  };
  // #endregion

  // #region private properties
  private listViewRef: ListViewContainerComponent;
  private readonly studentList$ = new BehaviorSubject<ReportListing[]>([]);
  // #endregion
  constructor() {}

  ngOnInit() {}

  // #region protected methods
  onReady(event: ListViewContainerComponent) {
    this.listViewRef = event;
  }

  selectedRowsChange = (selectedRows: ReportListing[]) => {
    this.selectedRows.set(selectedRows);
  };
  protected handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }
  // #endregion

  // #region private methods
  private getColumns(): ITableCol<ReportListing>[] {
    return [
      {
        field: 'studentName',
        headerName: this.translate.t('global.student_name.title'),
        sortable: false,
        filter: false,
      },
      {
        field: 'nationalId',
        headerName: this.translate.t('global.national_id.title'),
        sortable: false,
        filter: false,
      },
      {
        field: 'lastEntry',
        headerName: this.translate.t('global.last_entry.title'),
        sortable: false,
        filter: false,
        type: 'text',
      },
      {
        field: 'status',
        headerName: this.translate.t('global.status.title'),
        sortable: false,
        filter: false,
        cellRenderer: StudentReportCardStatusTableCellComponent,
      },
      {
        field: 'action',
        headerName: this.translate.t('global.actions.title'),
        sortable: false,
        filter: false,
        type: 'action',
        actions: this.getActions(),
        forceActionSheet: true,
        lockPosition: true,
      },
    ];
  }

  private getActions(): IAction<ReportListing>[] {
    return [
      {
        hasPermission: (data) => {
          return (
            (!data.status ||
              data.status === STUDENT_REPORT_CARD_STATUS.DRAFT) &&
            this.viewReportCardPermission
          );
        },
        text: this.translate.t('grade_management.view_draft.dropdown'),
        onClick: (data) => {
          this.navigateToDetail(data.id);
        },
      },
      {
        hasPermission: (data) => {
          return (
            (!data.status ||
              data.status === STUDENT_REPORT_CARD_STATUS.DRAFT) &&
            this.publishReportCardPermission
          );
        },
        text: this.translate.t('grade_management.publish_report_card.dropdown'),
        onClick: (data) => {
          const payload = {
            ...this.getPublishReportCardPayload(),
            studentIds: [data.studentId],
          };
          this.reportCardProcessingAPIService
            .publishReportCard(payload)
            .subscribe({
              next: (resp) => {
                this.toaster.success(
                  this.translate.t(
                    `grade_management.report_card_publish_success.txt`,
                  ),
                );
                this.reloadListView();
              },
              error: (err) => {
                this.toaster.showBackendError(err);
              },
            });
        },
      },
      {
        hasPermission: (data) => {
          if (
            data.status === STUDENT_REPORT_CARD_STATUS.PUBLISHED &&
            this.viewReportCardPermission
          ) {
            return true;
          }
          return false;
        },
        text: this.translate.t('grade_management.view_published.dropdown'),
        onClick: (data) => {
          this.navigateToDetail(data.id);
        },
      },
      {
        text: this.translate.t('grade_management.view_pdf.dropdown'),
        hasPermission: (data) => {
          if (
            data.status === STUDENT_REPORT_CARD_STATUS.PUBLISHED &&
            this.viewReportCardPermission
          ) {
            return true;
          }
          return false;
        },
        onClick: ({ pdfUrl }) => {
          this.pdfPrintService.viewPdf(pdfUrl!);
        },
      },
    ];
  }

  private getPublishReportCardPayload(): PublishReportCardParams {
    const rows = this.selectedRows().length
      ? this.selectedRows()
      : this.studentList$.value;
    return {
      publish: true,
      academicYearId:
        this.academicYearsScopeService.selectedAcademicYear()?.id ?? '',
      classId: this.classId() ?? '',
      reportCardId: this.reportCardId() ?? '',
      studentIds: rows
        .filter((item) => item.status === STUDENT_REPORT_CARD_STATUS.DRAFT)
        .map((item) => item.studentId),
    };
  }

  private navigateToDetail(studentId: ObjId) {
    this.router.navigate(['review'], {
      relativeTo: this.route,
      queryParams: {
        studentId: studentId,
      },
    });
  }

  private printReportCard(studentId?: ObjId): void {
    const data = this.studentList$.value;
    const publishIds = this.selectedRows()
      .filter((item) => item.status === STUDENT_REPORT_CARD_STATUS.PUBLISHED)
      .map((item) => item.studentId);
    this.handlePdfMergeAndPrint(data, !!studentId ? [studentId] : publishIds);
  }

  private handlePdfMergeAndPrint(
    data: ReportListing[],
    selectedIds: ObjId[],
  ): void {
    const pdfUrls = data
      .filter(
        (item) =>
          item.status === STUDENT_REPORT_CARD_STATUS.PUBLISHED &&
          selectedIds.includes(item.studentId),
      )
      .map((item) => item.pdfUrl)
      .filter((url): url is string => !!url);

    if (pdfUrls.length) {
      this.pdfPrintService.mergeAndPrintPdfs(pdfUrls);
    }
  }

  private reloadListView() {
    this.selectedRows.set([]);
    this.listViewRef.triggerFetch();
  }
  // #endregion
}

interface ReportListing {
  id: ObjId;
  studentName: string;
  nationalId: string;
  lastEntry: string | null;
  status: STUDENT_REPORT_CARD_STATUS | null;
  academicYearId: ObjId;
  semesterId: ObjId;
  classId: ObjId;
  reportCardId: ObjId;
  studentId: ObjId;
  pdfUrl: string | null;
}

function mapListing(data: StudentReportCard[]): ReportListing[] {
  return data.map((item, i) => {
    const date =
      item.lastEntry?.[0]?.updatedAt || item.lastEntry?.[0]?.createdAt || null;
    return {
      id: item.student?.id,
      studentName: item.student.displayName,
      nationalId: item.student.nationalId,
      lastEntry: date ? formatToHesDate(date) : '-',
      status: item.reportCardStudent?.status ?? null,
      academicYearId: item.academicYear.id,
      semesterId: item.semester?.id,
      classId: item.class.id,
      reportCardId: item.reportCard?.id,
      studentId: item.student?.id,
      pdfUrl: item.reportCardStudent?.url ?? null,
    };
  });
}
