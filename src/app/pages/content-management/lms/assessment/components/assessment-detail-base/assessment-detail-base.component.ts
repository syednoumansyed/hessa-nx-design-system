import { Component, computed, inject, input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AnimatedIconComponent } from '@ds-layout/components/animated-icon/animated-icon.component';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { DsAttachmentFormControlComponent } from '@ds/attachment/ds-attachment-form-control.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsChipComponent } from '@ds/chip/chip.component';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { isMobile } from '@shared/utils/platform';
import { DsAttachmentPreviewComponent } from '@ds/attachment/ds-attachment-preview.component';
import { isAfter } from 'date-fns';
import { AssessmentStudentSubmissionStatus } from '@shared/enums';

export interface AssessmentDetailBaseConfig {
  title: string;
  description: string;
  attempt?: string | null;
  typeBadge: {
    icon: string;
    iconColorClass: string;
    label: string;
  };
  startDate?: string;
  dueDate: string | null;
  publishingDate: string | null;
  duration?: number | null;
  primaryButton: {
    text: string;
    action: () => void;
  } | null;
  totalQuestions?: number | null;
  correctAnswers?: number | null;
  secondaryButton: {
    action: () => void;
  } | null;

  status?: {
    textKey: string;
    className: string;
    value?: AssessmentStudentSubmissionStatus;
  };
  attachments?: DsAttachmentControlValue[];
  attachmentByStudent?: DsAttachmentControlValue[];
  isAttachmentCtrlShow: boolean;
}

@Component({
  selector: 'app-assessment-detail-base',
  templateUrl: './assessment-detail-base.component.html',
  standalone: true,
  imports: [
    IonContent,
    DsButtonComponent,
    DsChipComponent,
    AnimatedIconComponent,
    DsAttachmentFormControlComponent,
    TranslocoDirective,
    ReactiveFormsModule,
    HesTimePipe,
    HesDatePipe,
    DsAttachmentPreviewComponent,
  ],
})
export class AssessmentDetailBaseComponent implements OnInit {
  readonly config = input.required<AssessmentDetailBaseConfig>();
  readonly attachmentControl =
    input<FormControl<DsAttachmentControlValue[] | null>>();
  readonly primaryBtnLoading = input<boolean>(false);
  readonly isMobile = isMobile();
  constructor() {}

  ngOnInit() {}

  private isDueDateNotPassed(): boolean {
    const dueDate = this.config().dueDate;
    if (!dueDate) return true; // If no due date is set, consider it as not passed
    return isAfter(new Date(dueDate), new Date());
  }

  isAttachmentShow = computed(() => {
    return this.config().isAttachmentCtrlShow && this.attachmentControl();
  });

  scoreConfig = computed(() => {
    const correctAnswers = this.config().correctAnswers;
    const totalQuestions = this.config().totalQuestions;
    const statusValue = this.config().status?.value;

    // Hide score for missed assessments
    if (statusValue === AssessmentStudentSubmissionStatus.MISSED) {
      return null;
    }

    if (totalQuestions === null) {
      return null;
    }

    if (correctAnswers !== null && totalQuestions !== null) {
      return {
        icon: 'score-default',
        titleText: 'correct.txt',
        subText: `${correctAnswers}/${totalQuestions}`,
        titleCssClass: 'content-sm-default',
        subTxtCssClass: 'single-line-lg-high-emphasis',
      };
    }
    if (
      statusValue === AssessmentStudentSubmissionStatus.SUBMITTED &&
      this.isDueDateNotPassed()
    ) {
      return {
        icon: 'score-danger',
        titleText: 'score.title',
        subText: 'global.pending.txt',
        textColor: 'text-white',
        titleCssClass: 'content-sm-mid-emphasis',
        subTxtCssClass: 'content-sm-high-emphasis',
      };
    }
    return null;
  });
}

export function AssessmentCommonUtilsService() {}
