import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  Signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HesDateViewerComponent } from '@ui-kit/hes-date-viewer/hes-date-viewer.component';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { LMSExamService } from '@pages/course-management/data-access/lms-exam.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { isAfter, isBefore, parseISO } from 'date-fns';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ExamDetailsGridInterface,
  ExamStyle,
  StudentSubmissionStatus,
} from '@pages/course-management/data-access/lms-exam.dto';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { SubmissionStatusComponent } from '@pages/course-management/components/submission-status/submission-status.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import { PageTitleService } from '@layout/page-title.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';

@Component({
  selector: 'app-exam-details',
  templateUrl: './exam-details.page.html',
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    CommonModule,
    TranslocoDirective,
    ReactiveFormsModule,
    HesDateViewerComponent,
    HessaBtnDirective,
    SubmissionStatusComponent,
    RbacDirective,
  ],
})
export class ExamDetailsPage implements OnInit {
  private readonly layoutUIControlService = inject(LayoutUiControlService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  translocoService = inject(TranslocoService);
  readonly examService = inject(LMSExamService);
  private readonly toaster = inject(HesToasterService);
  private readonly studentScope = inject(StudentSelectionScopeService);

  protected readonly ExamStyle = ExamStyle;
  protected readonly RESOURCE_PERMISSION = RESOURCE_PERMISSION;
  protected readonly UserType = UserType;

  examId = input<number>();
  examDetailsGridData: Signal<ExamDetailsGridInterface[]> = computed(() => {
    return [
      {
        title: 'Title',
        value: this.examService.examDetails()?.title,
      },
      {
        title: this.translocoService.translate(
          'content_management.attempts.title',
        ),
        value: this.examService.examDetails()?.allowedAttempts
          ? `${this.examService.examDetails()?.submissionData?.attemptsTaken ?? 0}/${this.examService.examDetails()?.allowedAttempts}`
          : '---',
      },
      {
        title: this.translate('content_management.start_date_time.label'),
        value: this.examService.examDetails()?.startDate ?? '',
        type: 'date',
      },
      {
        title: this.translate('global.status.title'),
        value: this.examService.examDetails()?.submissionData?.status || '---',
        type: this.examService.examDetails()?.submissionData?.status
          ? 'badge'
          : '',
      },
      {
        title: this.translate('content_management.due_date_time.label'),
        value: this.examService.examDetails()?.dueDate ?? '',
        type: 'date',
      },
      {
        title: this.translate('content_management.duration.label'),
        value: this.examService.examDetails()?.duration
          ? `${this.examService.examDetails()!.duration / 60} ${this.translate('global.minutes.txt')}`
          : '---',
      },
      {
        title: this.translate('global.description.label'),
        value: this.examService.examDetails()?.description,
        type: 'paragraph',
      },
    ];
  });

  isViewOnlyExam = computed(() => {
    return (
      this.examService.examDetails()?.submissionData?.status ===
      StudentSubmissionStatus.SUBMITTED
    );
  });
  isGuardianUser = signal(this.authService?.user()?.type === UserType.GUARDIAN);

  submitButtonDisplayedVal = computed(() => {
    return this.examService.examDetails()?.submissionData?.status ===
      StudentSubmissionStatus.SUBMITTED
      ? this.translate('content_management.view_exam.btn')
      : this.translate('content_management.start_exam.btn');
  });

  isViewingAllowed = computed(() => {
    const status = this.examService.examDetails()?.submissionData?.status;
    const isSubmitted = status === StudentSubmissionStatus.SUBMITTED;
    return !(
      this.examService.examDetails()?.isViewCorrectAnswer && isSubmitted
    );
  });

  isReAttemptAllowed = computed(() => {
    const attemptsTaken =
      this.examService.examDetails()?.submissionData?.attemptsTaken ?? 0;
    const totalAttempts = this.examService.examDetails()?.allowedAttempts ?? 0;
    const isAttemptRemaining = totalAttempts > attemptsTaken;
    const currentDate = new Date();
    const startDate = parseISO(this.examService.examDetails()?.startDate ?? '');
    let dueDate = parseISO(this.examService.examDetails()?.dueDate ?? '');
    const status = this.examService.examDetails()?.submissionData?.status;
    const isSubmitted = status === StudentSubmissionStatus.SUBMITTED;
    const isWithinTimeWindow =
      isAfter(currentDate, startDate) && isBefore(currentDate, dueDate);
    return isAttemptRemaining && isSubmitted && isWithinTimeWindow;
  });

  isSubmitDisabled = computed(() => {
    const currentDate = new Date();
    const startDate = parseISO(this.examService.examDetails()?.startDate ?? '');
    const dueDate = parseISO(this.examService.examDetails()?.dueDate ?? '');
    const status = this.examService.examDetails()?.submissionData?.status;
    const isSubmitted = status === StudentSubmissionStatus.SUBMITTED;
    const datePassed =
      isBefore(currentDate, dueDate) && isAfter(currentDate, startDate);
    return (
      (!(isSubmitted && this.examService.examDetails()?.isViewCorrectAnswer) &&
        !datePassed) ||
      this.authService?.user()?.type !== UserType.STUDENT
    );
  });

  subjectTitle = inject(CourseListService)
    .mappedCoursesList()
    .find((c) => c.courseId === +this.route.snapshot.params['courseId'])?.title;
  pageTitleService = inject(PageTitleService);

  constructor(private breadcrumbService: BreadcrumbService) {}

  ngOnInit() {
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
  }
  ionViewWillEnter() {
    this.getExamDetails();
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
    this.layoutUIControlService.showWebBackBtn();
  }
  ionViewWillLeave() {
    this.layoutUIControlService.hideWebBackBtn();
  }

  getExamDetails() {
    const examId = this.examId();
    const studentId = this.studentScope.selectedStudent()?.id;
    if (examId && studentId) {
      this.examService.getExamDetails(examId, studentId).subscribe({
        next: (res) => {
          this.examService.updateExamDetails(res.data);
          if (
            res?.data?.submissionData?.status ===
            StudentSubmissionStatus.IN_PROGRESS
          ) {
            this.router.navigate(['questions'], { relativeTo: this.route });
          } else if (
            res?.data?.submissionData?.status ===
            StudentSubmissionStatus.SUBMITTED
          ) {
          }
        },
        error: (err) => {
          this.toaster.showBackendError(err.error.message);
          this.router.navigate(['../'], { relativeTo: this.route });
        },
      });
    }
  }

  startExam() {
    const examId = this.examId();
    const studentId = this.studentScope.selectedStudent()?.id;
    if (examId && studentId) {
      this.examService.startExam(examId, studentId).subscribe({
        next: (_res) => {
          this.router.navigate(['questions'], { relativeTo: this.route });
        },
        error: (err) => {
          this.toaster.showBackendError(err.error.message);
        },
      });
    }
  }

  viewExam() {
    this.router.navigate(['result'], { relativeTo: this.route });
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
