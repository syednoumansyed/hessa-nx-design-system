import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { Location } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import {
  ColumnDTO,
  EntriesDTO,
  PublishReportCardParams,
} from '../../data-access/report-card-processing.dto';
import { ObjId } from '@shared/interfaces/common.interface';
import { STUDENT_REPORT_CARD_STATUS } from '../../data-access/report-card-list.enum';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ReportCardProcessingAPIService } from '../../data-access/report-card-processing.api-service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { LayoutService } from '@layout/layout.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { PdfPrintService } from '@shared/services/pdf-print.service';
import { map } from 'rxjs';
import { StudentReportCardPreview } from '../../data-access/report-card-processing.interface';

@Component({
  selector: 'app-report-review',
  templateUrl: './report-review.component.html',
  standalone: true,
  imports: [IonButton, NgClass, TranslocoDirective, HesButtonModule],
})
export class ReportReviewComponent implements OnInit {
  // #region input & output
  subjectColumns = input<StudentReportCardPreview | null>(null);
  status = input<STUDENT_REPORT_CARD_STATUS>();
  reportCardId = input<ObjId>();
  classId = input<ObjId>();
  studentId = input<ObjId | null>(null);

  @Output() reportCardPublished = new EventEmitter<void>();
  // #endregion

  // #region injector
  private readonly printPDFService = inject(PdfPrintService);
  private readonly translate = inject(HesTranslateService);
  private readonly reportCardProcessingAPIService = inject(
    ReportCardProcessingAPIService,
  );
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly toaster = inject(HesToasterService);
  private readonly layoutService = inject(LayoutService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly location = inject(Location);
  // #endregion

  // #region Protacted properties
  protected readonly isReportCardPublished = computed(() => {
    return this.status() === STUDENT_REPORT_CARD_STATUS.PUBLISHED;
  });

  protected readonly userSelectedColumn = signal<ColumnDTO | null>(null);
  protected readonly activeColumn = computed(() => {
    const subjectColumn = this.subjectColumns();
    const selectedColumn = this.userSelectedColumn();
    if (selectedColumn === null) {
      return subjectColumn?.columns?.[0] ?? null;
    }
    return (
      subjectColumn?.columns?.find((col) => col.id === selectedColumn?.id) ??
      subjectColumn?.columns?.[0]
    );
  });

  protected readonly activeEntries = computed(() => {
    return this.activeColumn()?.entries ?? [];
  });
  // #endregion

  // #region protected methods
  protected onColumnClick(column: ColumnDTO) {
    const subjectColumn = this.subjectColumns();
    if (!subjectColumn) {
      return;
    }
    const selectedColumn = subjectColumn?.columns?.find(
      (col) => col.id === column.id,
    );
    if (selectedColumn) {
      this.userSelectedColumn.set(selectedColumn);
    }
  }

  protected getFirstMark(entry: EntriesDTO): ObjId {
    return entry.marks && entry.marks.length > 0 ? entry.marks[0].marks : '-';
  }

  protected getStatus() {
    switch (this.status()) {
      case STUDENT_REPORT_CARD_STATUS.DRAFT:
        return this.translate.t('global.publish.btn');
      default:
        return this.translate.t('grade_management.view_pdf.dropdown');
    }
  }

  protected hasStatusBtnPermission(): boolean {
    switch (this.status()) {
      case STUDENT_REPORT_CARD_STATUS.PUBLISHED:
        return this.rbacService.hasPermission(
          RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.PUBLISH,
        ); //TODO: Replace with generate permission
      case STUDENT_REPORT_CARD_STATUS.DRAFT:
        return this.rbacService.hasPermission(
          RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.PUBLISH,
        );
      default:
        return this.rbacService.hasPermission(
          RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.VIEW,
        );
    }
  }
  // #endregion

  // #region Private methods
  // #endregion

  // #region Protacted methods
  protected onCancel() {
    this.location.back();
  }

  protected onStatusClick() {
    const status = this.status();
    if (status === STUDENT_REPORT_CARD_STATUS.DRAFT) {
      this.publishReportCard();
    } else {
      const { id: academicYearId } =
        this.academicYearsScopeService.selectedAcademicYear() || {};
      const payload = {
        ...(academicYearId && { academicYearId }),
        classId: this.classId(),
        reportCardId: this.reportCardId(),
        paginate: false,
      };
      this.reportCardProcessingAPIService
        .fetchReportCardByStudents(payload)
        .subscribe((resp) => {
          const stdId = this.studentId();
          const std = resp.data.find((item) => item.student.id == stdId);
          this.printPDFService.mergeAndPrintPdfs([
            std?.reportCardStudent?.url ?? '',
          ]);
        });
    }
  }

  ngOnInit() {
    const columns = this.subjectColumns()?.columns;
    if (columns?.length) {
      this.userSelectedColumn.set(columns[0]);
    }
  }
  // #endregion

  // #region Private methods
  private publishReportCard() {
    const payload = this.getPublishReportCardPayload();
    this.layoutService.showPageSpinner();
    this.reportCardProcessingAPIService.publishReportCard(payload).subscribe({
      next: (resp) => {
        this.toaster.success(
          this.translate.t(`grade_management.report_card_publish_success.txt`),
        );
        this.reportCardPublished.emit();
        this.layoutService.hidePageSpinner();
      },
      error: (err) => {
        this.toaster.showBackendError(err);
        this.layoutService.hidePageSpinner();
      },
    });
  }

  private getPublishReportCardPayload(): PublishReportCardParams {
    const studentId = this.studentId();
    return {
      publish: true,
      academicYearId:
        this.academicYearsScopeService.selectedAcademicYear()?.id ?? '',
      classId: this.classId() ?? '',
      reportCardId: this.reportCardId() ?? '',
      studentIds: studentId ? [studentId] : [],
    };
  }
  // #endregion
}
