import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { ObjId } from '@shared/interfaces/common.interface';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { ReportCardProcessingAPIService } from '../../data-access/report-card-processing.api-service';
import {
  ColumnDTO,
  StudentReportCardDTOResponse,
  StudentReportCardPreviewDTO,
} from '../../data-access/report-card-processing.dto';
import { toDropdown } from '@shared/utils/to-dropdown';
import { StudentReportCardStatusComponent } from '../../components/student-report-card-status/student-report-card-status.component';

import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ReportReviewComponent } from '../../components/report-review/report-review.component';
import { isMobile } from '@shared/utils/platform';
import { PrevNextSelectorComponent } from '@ui-kit/prev-next-selector/prev-next-selector.component';
import { Idropdown } from '@shared/interfaces';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LayoutService } from '@layout/layout.service';
import { filter } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  StudentReportCardPreview,
  StudentReportCardResponse,
} from '../../data-access/report-card-processing.interface';

@Component({
  selector: 'app-student-report-review',
  templateUrl: './student-report-review.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    TranslocoDirective,
    StudentReportCardStatusComponent,
    ReactiveFormsModule,
    ReportReviewComponent,
    PrevNextSelectorComponent,
  ],
})
export class StudentReportReviewPage implements OnInit {
  // #region input
  reportCardId = input<ObjId>();
  classId = input<ObjId>();
  // #endregion

  // #region injector
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly reportCardProcessingAPIService = inject(
    ReportCardProcessingAPIService,
  );
  private readonly translate = inject(HesTranslateService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly layoutService = inject(LayoutService);
  private readonly destroyRef$ = inject(DestroyRef);
  // #endregion

  // #region Protacted properties
  protected selectedStudentId = signal<ObjId | null>(null);
  protected readonly isMobile = isMobile();
  protected readonly isDesktop = !isMobile();
  protected readonly studentList = signal<StudentReportCardResponse['data']>(
    [],
  );
  protected readonly studentListOptions = computed(() => {
    const list = this.studentList();
    return list.map((item) => ({
      value: item.student.id,
      displayedValue: item.student.displayName,
    }));
  });

  protected readonly selectedStudent = computed(() => {
    const list = this.studentList();
    return list.find((item) => item.student.id == this.selectedStudentId());
  });

  protected readonly subjectOption = signal<Idropdown[]>([]);

  protected readonly selectedSubjectColumns =
    signal<StudentReportCardPreview | null>(null);

  protected selectStudentStatus = computed(() => {
    return this.selectedStudent()?.reportCardStudent?.status;
  });

  protected isReportPublished = computed(() => {
    return this.selectedStudent()?.reportCardStudent?.status === 'PUBLISHED';
  });

  protected readonly previewData = signal<StudentReportCardPreview[]>([]);
  protected readonly studentListForm = this.fb.group({
    student: this.fb.control<ObjId | null>(null),
    subject: this.fb.control<ObjId | null>(null),
  });

  // #endregion
  constructor() {}

  ngOnInit() {
    this.studentListForm.controls.student.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .pipe(filter((value) => !!value))
      .subscribe((value) => {
        this.selectedStudentId.set(value);
        this.fetchStudentReportCardPreview(value);
      });
    this.studentListForm
      .get('subject')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((selectedSubjectId: ObjId | null) => {
        const selectedSubject = this.previewData().find(
          (item) => item.id === selectedSubjectId,
        );
        this.selectedSubjectColumns.set(selectedSubject ?? null);
      });

    this.activatedRoute.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((params) => {
        const studentId = params['studentId'];
        if (studentId) {
          this.studentListForm.get('student')?.setValue(studentId);
          this.selectedStudentId.set(studentId);
          this.fetchReportCardByStudents();
          this.fetchStudentReportCardPreview(studentId);
        }
      });
  }

  // #region protected methods
  onReportCardPublished() {
    this.fetchReportCardByStudents();
    this.fetchStudentReportCardPreview(this.selectedStudentId());
  }
  // #endregion

  // #region Private methods
  private fetchReportCardByStudents(): void {
    const { id: academicYearId } =
      this.academicYearsScopeService.selectedAcademicYear() || {};

    const payload = {
      ...(academicYearId && { academicYearId }),
      classId: this.classId(),
      reportCardId: this.reportCardId(),
      paginate: false,
    };
    this.layoutService.showPageSpinner();
    this.reportCardProcessingAPIService
      .fetchReportCardByStudents(payload)
      .subscribe(({ data }) => {
        this.studentList.set(data);
        const value = this.studentListForm.get('student')?.value;
        if (value === null && data?.[0]?.student.id) {
          this.studentListForm.get('student')?.setValue(data[0].student.id);
        }
        this.layoutService.hidePageSpinner();
      });
  }

  private fetchStudentReportCardPreview(studentId: ObjId | null) {
    this.layoutService.showPageSpinner();
    this.reportCardProcessingAPIService
      .fetchStudentReportCardPreview(
        this.reportCardId() as ObjId,
        studentId as ObjId,
      )
      .subscribe({
        next: (resp) => {
          this.layoutService.hidePageSpinner();
          this.mapStudentReportCardPreview(resp);
        },
        error: (err) => {
          this.layoutService.hidePageSpinner();
        },
      });
  }

  private mapStudentReportCardPreview(data: StudentReportCardPreview[]) {
    const subjects = toDropdown(data);
    this.subjectOption.set(subjects);
    this.previewData.set(data);
    const value = this.studentListForm.get('subject')?.value;
    if (value === null && subjects?.[0]?.value) {
      this.studentListForm.get('subject')?.setValue(subjects[0].value);
    }

    this.selectedSubjectColumns.set(data.find((i) => i.id === value) ?? null);
  }
  // #endregion
}
