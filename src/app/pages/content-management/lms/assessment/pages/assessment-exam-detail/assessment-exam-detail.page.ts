import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  OnDestroy,
} from '@angular/core';
import { isBefore, isAfter, differenceInMilliseconds, isEqual } from 'date-fns';
import {
  ExamDetailResponseDto,
  ExamStyle,
  StudentSubmissionStatus,
} from '../../types/lms-exam.dto';
import { getDsIconColorClass } from '@ds/icon/ds-icon-colors.util';
import { DsObjId } from '@ds/common.types';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { createAssessmentModal } from '../../assessment.modal';
import { STATUS_MAP } from '@pages/content-management/lms/lms.constant';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { AssessmentApiService } from '../../data-access/assessment.service';
import { createLateJoinModal } from '../../assessment-late-join.modal';
import { createReAttemptModal } from '../../re-attempt.modal';
import {
  AssessmentDetailBaseComponent,
  AssessmentDetailBaseConfig,
} from '../../components/assessment-detail-base/assessment-detail-base.component';
import { AuthService } from '@auth/auth.service';

@Component({
  selector: 'app-assessment-exam-detail',
  templateUrl: './assessment-exam-detail.page.html',
  standalone: true,
  imports: [AssessmentDetailBaseComponent],
})
export class AssessmentExamDetailPage implements OnInit, OnDestroy {
  examId = input.required<DsObjId>();

  private readonly toaster = inject(HesToasterService);
  private readonly authService = inject(AuthService);
  private readonly translationService = inject(HesTranslateService);
  private readonly studentSelectScope = inject(StudentSelectionScopeService);
  private readonly assessmentApiService = inject(AssessmentApiService);
  private readonly assessmentModal = createAssessmentModal();
  private readonly lateJoinModal = createLateJoinModal();
  private readonly reAttemptModal = createReAttemptModal();

  readonly detail = signal<ExamDetailResponseDto['data'] | null>(null);
  private readonly currentTime = signal<Date>(new Date());
  private startTimeTimeout: any = null;

  readonly detailViewModel = computed<AssessmentDetailBaseConfig | null>(() => {
    const detail = this.detail();
    if (!detail) return null;
    const submissionData = detail.submissionData;
    const submissionStats = submissionData?.submissionStats;

    const data = {
      title: detail.title,
      description: detail.description,
      attempt: this.getAttemptCountString(detail),
      typeBadge: this.getTypeBadge(),
      startDate: detail.startDate,
      dueDate: detail.dueDate,
      publishingDate: detail.publishingDate,
      duration: detail.duration / 60,
      primaryButton: this.getPrimaryButton(),
      totalQuestions: submissionStats?.totalQuestions ?? null,
      correctAnswers: submissionStats?.correctAnswers ?? null,
      secondaryButton: this.viewBtnConfig(detail),
      status:
        submissionData?.status !== undefined
          ? STATUS_MAP[submissionData.status]
          : undefined,
      isAttachmentCtrlShow: false,
      // Map other properties as needed
    };
    // Debug log removed for production
    return data;
  });

  private readonly isStartTimeReached = computed(() => {
    const detail = this.detail();
    const currentTime = this.currentTime(); // Use the signal instead of new Date()

    if (!detail?.startDate) return true; // If no start date, always allow

    const startTime = new Date(detail.startDate);
    return isAfter(currentTime, startTime) || isEqual(currentTime, startTime);
  });

  ngOnInit() {}

  ngOnDestroy() {
    // Clean up timeout
    this.clearStartTimeTimeout();
  }

  ionViewWillEnter() {
    this.fetchExam();
  }

  ionViewWillLeave() {
    // Clear timeout when leaving the view
    this.clearStartTimeTimeout();
  }

  private scheduleStartTimeUpdate() {
    // Clear any existing timeout first
    this.clearStartTimeTimeout();

    const detail = this.detail();
    if (!detail?.startDate) return; // No start date, no need for timeout

    const startTime = new Date(detail.startDate);
    const now = new Date();

    // Only set timeout if start time hasn't passed yet (using date-fns)
    if (isBefore(now, startTime)) {
      const timeUntilStart = differenceInMilliseconds(startTime, now);

      this.startTimeTimeout = setTimeout(() => {
        // Update the current time signal to trigger reactive updates
        this.currentTime.set(new Date());
        this.startTimeTimeout = null;
      }, timeUntilStart);
    }
  }

  private clearStartTimeTimeout() {
    if (this.startTimeTimeout) {
      clearTimeout(this.startTimeTimeout);
      this.startTimeTimeout = null;
    }
  }

  private getAttemptCountString(
    detail: ExamDetailResponseDto['data'] | null,
  ): string | null {
    const attemptsTaken = detail?.submissionData?.attemptsTaken;
    const allowedAttempts = detail?.allowedAttempts ?? 0;

    if (attemptsTaken == null || allowedAttempts < 2) return null;

    return this.t('attempt.count.txt', {
      count: attemptsTaken,
      total: allowedAttempts,
    });
  }

  private getTypeBadge() {
    const icon = this.examId() ? 'ds-exam' : 'ds-assignment';
    return {
      icon,
      iconColorClass: getDsIconColorClass(icon),
      label: this.t('content_management.exam.title'),
    };
  }

  private getPrimaryButton() {
    const detail = this.detail();
    const submissionData = detail?.submissionData;
    if (!submissionData || !detail) return null;

    // Hide start button for guardian users
    if (this.authService.isUserGuardian()) return null;

    const { status, attemptsTaken } = submissionData;
    const isDueDatePassed = this.isDueDatePassed(detail.dueDate);
    const isStartTimeReached = this.isStartTimeReached();

    // Only show primary button if conditions are met AND start time has been reached
    if (
      detail.allowedAttempts > attemptsTaken &&
      status !== StudentSubmissionStatus.MISSED &&
      !isDueDatePassed &&
      isStartTimeReached // Use the computed property instead of isStartTimeNotMet
    ) {
      if (status !== StudentSubmissionStatus.NEW) {
        return {
          text: this.t('content_management.reattempt.btn'),
          action: () => this.onReattempt(),
        };
      }

      // This is an exam
      if (detail.style !== ExamStyle.OFFLINE) {
        // Online exam
        return {
          text: this.t('global.start'),
          action: () => this.onStart(),
        };
      }
    }

    return null;
  }

  private t(key: string, params?: Record<string, any>) {
    return this.translationService.t(key, params);
  }

  private viewBtnConfig(detail: ExamDetailResponseDto['data']) {
    // Check if it's an exam with style OFFLINE
    if (detail.style === ExamStyle.OFFLINE) {
      return null;
    }

    // Don't show view button if submission status is NEW or MISSED
    if (
      detail.submissionData?.status === StudentSubmissionStatus.NEW ||
      detail.submissionData?.status === StudentSubmissionStatus.MISSED
    ) {
      return null;
    }

    // Show view button for other statuses (SUBMITTED, IN_PROGRESS, PENDING)
    return {
      action: () => this.onViewAssessment(),
    };
  }

  private onViewAssessment() {
    this.assessmentModal({
      examId: this.examId()!,
    });
  }

  private async onReattempt() {
    const title = this.translationService.t('re_attempt.title');
    const description = this.translationService.t('re_attempt.txt');
    const btnText = this.translationService.t(
      'content_management.reattempt.btn',
    );

    await this.reAttemptModal(
      title,
      description,
      btnText,
      this.onStart.bind(this),
    );
  }

  private onStart() {
    const dueDate = this.detail()?.dueDate!;
    const duration = this.detail()?.duration || 0;
    if (this.isLateJoin(dueDate, duration)) {
      this.onViewLateJoin();
    } else {
      this.startExam();
    }
  }

  private openExam() {
    this.assessmentModal({
      examId: this.examId()!,
      onClose: () => {
        this.fetchExam();
      },
    });
  }

  private fetchExam() {
    this.assessmentApiService
      .getExamDetail(this.getParamsForDetail())
      .subscribe({
        next: (exam) => {
          this.detail.set(exam);

          this.scheduleStartTimeUpdate();
          if (
            exam.submissionData.status === StudentSubmissionStatus.IN_PROGRESS
          ) {
            this.openExam();
          }
        },
        error: (error) => {
          this.toaster.showBackendError(error);
        },
      });
  }

  private getParamsForDetail() {
    return {
      id: this.examId()!,
      studentId: this.studentSelectScope.selectedStudentId()!,
    };
  }

  private startExam = () => {
    this.assessmentApiService
      .onStartExam({
        ...this.getParamsForDetail(),
      })
      .subscribe(() => {
        this.openExam();
      });
  };

  private isLateJoin(dueDate: string, duration: number): boolean {
    const dueDateSeconds = Math.floor(new Date(dueDate).getTime() / 1000);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const remainingTime = dueDateSeconds - nowSeconds;
    return duration > remainingTime;
  }

  private onViewLateJoin() {
    const dueDate = this.detail()?.dueDate;
    const duration = this.detail()?.duration || 0;
    this.lateJoinModal(dueDate!, duration, this.startExam);
  }

  private isDueDatePassed(dueDate: string): boolean {
    const dueDateTime = new Date(dueDate).getTime() / 1000;
    const now = Date.now() / 1000;
    return now > dueDateTime;
  }

  private isStartTimeNotMet(startDate: string): boolean {
    if (!startDate) return false; // If no start date is set, allow access
    return isBefore(new Date(), new Date(startDate));
  }
}
