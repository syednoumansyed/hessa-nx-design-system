import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { isBefore } from 'date-fns';
import {
  AssessmentAssignmentDataDto,
  AssessmentAssignmentType,
  AssignmentDetailResponseDto,
} from '@pages/content-management/lms/data-access/assessment.dto';
import { getDsIconColorClass } from '@ds/icon/ds-icon-colors.util';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { createAssessmentModal } from '../../assessment.modal';
import { DsObjId } from '@ds/common.types';

import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { FormControl, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { AssessmentApiService } from '../../data-access/assessment.service';
import { STATUS_MAP } from '@pages/content-management/lms/lms.constant';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  AssessmentDetailBaseComponent,
  AssessmentDetailBaseConfig,
} from '../../components/assessment-detail-base/assessment-detail-base.component';
import { AuthService } from '@auth/auth.service';
import { AssessmentStudentSubmissionStatus } from '@shared/enums';

@Component({
  selector: 'app-assessment-assignment-detail',
  templateUrl: './assessment-assignment-detail.page.html',
  standalone: true,
  imports: [AssessmentDetailBaseComponent],
})
export class AssessmentAssignmentDetailPage implements OnInit {
  readonly assignmentId = input<DsObjId>(); // Route parameter for assignment/:assignmentId

  private readonly toaster = inject(HesToasterService);
  private readonly authService = inject(AuthService);
  private readonly studentSelectScope = inject(StudentSelectionScopeService);
  private readonly assessmentApiService = inject(AssessmentApiService);
  readonly primaryBtnLoading = signal(false);
  readonly attachmentControl = new FormControl<
    DsAttachmentControlValue[] | null
  >(null);
  readonly detail = signal<AssessmentAssignmentDataDto | null>(null);
  private readonly translationService = inject(HesTranslateService);
  private assessmentModal = createAssessmentModal();

  readonly detailViewModel = computed<AssessmentDetailBaseConfig | null>(() => {
    const detail = this.detail();
    if (!detail) return null;
    const submissionData = detail.submissionData;
    const submissionStats = submissionData?.submissionStats;

    const data = {
      title: detail.title,
      description: detail.description,
      attempt: null,
      typeBadge: this.getTypeBadge(),
      startDate: detail.startDate,
      dueDate: detail.dueDate,
      publishingDate: detail.publishingDate,
      primaryButton: this.getPrimaryButton(detail),
      totalQuestions: submissionStats?.totalQuestions ?? null,
      correctAnswers: submissionStats?.correctAnswers ?? null,
      secondaryButton: this.viewBtnConfig(detail),
      status:
        submissionData?.status !== undefined
          ? STATUS_MAP[submissionData.status]
          : undefined,
      isAttachmentCtrlShow: this.isAttachmentCtrlShow(detail),
      attachments: this.mapAttachments(detail.attachments),
      attachmentByStudent: this.mapAttachments(detail.worksheet.attachments),
    };
    return data;
  });

  ngOnInit() {}

  ionViewWillEnter() {
    this.fetchAssignment();
  }
  private getTypeBadge() {
    let icon = 'ds-assignment';
    let label = 'content_management.assignment.title';
    if (this.detail()?.type === AssessmentAssignmentType.QUESTION) {
      icon = 'ds-quiz';
      label = 'quiz.txt';
    }
    return {
      icon,
      iconColorClass: getDsIconColorClass(icon),
      label: this.t(label),
    };
  }

  private t(key: string, params?: Record<string, any>) {
    return this.translationService.t(key, params);
  }

  private onViewAssessment() {
    this.assessmentModal({
      assignmentId: this.assignmentId()!,
    });
  }

  private onStart() {
    this.assessmentApiService
      .onStartAssignment({
        ...this.getParamsForDetail(),
      })
      .subscribe(() => {
        this.openAssignment();
      });
  }

  private openAssignment() {
    this.assessmentModal({
      assignmentId: this.assignmentId()!,
      onClose: () => {
        this.fetchAssignment();
      },
    });
  }

  private getPrimaryButton(detail: AssignmentDetailResponseDto['data']) {
    const submissionData = detail.submissionData;
    if (!submissionData) return null;

    // Hide start/submit button for guardian users
    if (this.authService.isUserGuardian()) return null;

    const { status } = submissionData;
    const isStartTimeNotMet = this.isStartTimeNotMet(detail.startDate);

    // Only show primary button if status is NEW and start time has been met
    if (status !== AssessmentStudentSubmissionStatus.NEW || isStartTimeNotMet) {
      return null;
    }

    if (detail.type === AssessmentAssignmentType.WORKSHEET) {
      // Worksheet assignment
      return {
        text: this.t('global.submit.btn'),
        action: () => this.onSubmitWorkSheet(),
      };
    } else if (detail.type === AssessmentAssignmentType.QUESTION) {
      // Question assignment
      return {
        text: this.t('global.start'),
        action: () => this.onStart(),
      };
    }

    return null;
  }

  onSubmitWorkSheet() {
    const value = this.attachmentControl.value;
    const { id, studentId } = this.getParamsForDetail();
    if (value) {
      this.primaryBtnLoading.set(true);
      this.assessmentApiService
        .uploadAttachments(value)
        .pipe(
          switchMap((uploadedFiles) => {
            return this.assessmentApiService.onSubmitAssignment({
              id,
              studentId,
              attachments: uploadedFiles.map((f, i) => ({
                path: f.key,
                name: value[i].name,
              })),
            });
          }),
        )
        .subscribe({
          next: () => {
            this.fetchAssignment();
            this.primaryBtnLoading.set(false);
          },
          error: (error) => {
            this.toaster.showBackendError(error);
            this.primaryBtnLoading.set(false);
          },
        });
    }
  }

  private getParamsForDetail() {
    return {
      id: this.assignmentId()!,
      studentId: this.studentSelectScope.selectedStudentId()!,
    };
  }

  private viewBtnConfig(detail: AssessmentAssignmentDataDto) {
    // Check if it's a worksheet assignment
    if (detail.type === AssessmentAssignmentType.WORKSHEET) {
      return null;
    }

    // Don't show view button if submission status is NEW or MISSED
    if (
      detail.submissionData?.status === AssessmentStudentSubmissionStatus.NEW ||
      detail.submissionData?.status === AssessmentStudentSubmissionStatus.MISSED
    ) {
      return null;
    }

    // Show view button for other statuses (SUBMITTED, IN_PROGRESS, PENDING)
    return {
      action: () => this.onViewAssessment(),
    };
  }

  private fetchAssignment() {
    this.assessmentApiService
      .getAssignmentDetail(this.getParamsForDetail())
      .subscribe({
        next: (assignment) => {
          this.detail.set(assignment);
          this.updateValidator(assignment);
          if (
            assignment.submissionData?.status ===
            AssessmentStudentSubmissionStatus.IN_PROGRESS
          ) {
            this.openAssignment();
          }
        },
        error: (error) => {
          this.toaster.showBackendError(error);
        },
      });
  }

  private isAttachmentCtrlShow(detail: AssessmentAssignmentDataDto) {
    // Hide attachment control for guardian users
    if (this.authService.isUserGuardian()) return false;

    return detail.type === AssessmentAssignmentType.WORKSHEET && this.isNew();
  }

  private isNew() {
    const detail = this.detail();
    if (!detail) return false;

    const submissionData = detail.submissionData;
    return submissionData?.status === AssessmentStudentSubmissionStatus.NEW;
  }

  private updateValidator(assessment: AssignmentDetailResponseDto['data']) {
    if (this.isAttachmentCtrlShow(assessment)) {
      this.attachmentControl.addValidators([Validators.required]);
    } else {
      this.attachmentControl.clearValidators();
    }
    this.attachmentControl.updateValueAndValidity();
  }

  private isStartTimeNotMet(startDate: string): boolean {
    if (!startDate) return false; // If no start date is set, allow access
    return isBefore(new Date(), new Date(startDate));
  }

  private mapAttachments(
    attachments: AssessmentAssignmentDataDto['attachments'],
  ) {
    return attachments?.map((item) => {
      return {
        id: item.id.toString(),
        key: item.key,
        title: item.title,
        isLink: item.isLink,
        targetId: item.targetId,
        targetType: item.targetType,
        url: item.url,
        extension: item.extension,
      };
    });
  }
}
