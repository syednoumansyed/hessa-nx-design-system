import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { AnimatedIconComponent } from '@ds-layout/components/animated-icon/animated-icon.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  AssessmentAssignmentDataDto,
  AssessmentAssignmentType,
  AssessmentExamDataDto,
  AssessmentQuestionType,
} from '@pages/content-management/lms/data-access/assessment.dto';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
import { IonContent } from '@ionic/angular/standalone';

export interface AssessmentSuccessConfig {
  title: string;
  description: string;
  bgIcon: string | null;
  summary?: {
    fgIcon: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
  };
}

@Component({
  selector: 'app-assessment-success',
  templateUrl: './after-assessment.component.html',
  standalone: true,
  imports: [
    AnimatedIconComponent,
    TranslocoDirective,
    DsButtonComponent,
    DsIconComponent,
  ],
})
export class AssessmentSuccessComponent implements OnInit {
  assessmentData = input<
    AssessmentExamDataDto | AssessmentAssignmentDataDto | null
  >(null);
  done = output<void>();

  private readonly translateService = inject(HesTranslateService);

  isAssignmentQuiz = computed(() => {
    const data = this.assessmentData();
    if (!data) return;
    return 'type' in data && data?.type === AssessmentAssignmentType.QUESTION;
  });
  afterAssessmentViewModel = computed(() => {
    const { totalQuestions, correctAnswers, inCorrectAnswers } =
      this.assessmentData()?.submissionData?.submissionStats || {};
    if (
      [correctAnswers, totalQuestions, inCorrectAnswers].some(
        (i) => i === undefined || i === null,
      )
    ) {
      return {
        title: this.translateService.t('congratulations.title'),
        description: this.translateService.t(
          this.isAssignmentQuiz()
            ? 'quiz.congratulations.txt'
            : 'congratulations.txt',
        ),
        bgIcon: 'success-assessment',
      };
    }

    return this.getAfterAssessmentForScoreConfig(
      totalQuestions!,
      correctAnswers!,
      inCorrectAnswers!,
    );
  });

  constructor() {}

  ngOnInit() {}

  onDone() {
    this.done.emit();
  }

  /**
   * Returns performance band configuration based on percentage score
   */
  private getPerformanceBandConfig(percent: number) {
    if (percent >= 90) {
      return {
        imagePrefix: 'score-perfect',
        titleKey: 'got_them_all_right.title',
        descriptionKey: 'all_right_message.txt',
      };
    } else if (percent >= 75) {
      return {
        imagePrefix: 'score-very-good',
        titleKey: 'great_work.title',
        descriptionKey: 'great_work.txt',
      };
    } else if (percent >= 50) {
      return {
        imagePrefix: 'score-good-try',
        titleKey: 'nice_efforts.title',
        descriptionKey: 'nice_efforts.txt',
      };
    } else if (percent >= 30) {
      return {
        imagePrefix: 'score-needs-practice',
        titleKey: 'do_better.title',
        descriptionKey: 'do_better.txt',
      };
    } else {
      return {
        imagePrefix: 'score-needs-support',
        titleKey: 'do_not_giveup.title',
        descriptionKey: 'do_not_giveup.txt',
      };
    }
  }

  /**
   * Returns after-assessment config based on score percentage and performance band
   */
  private getAfterAssessmentForScoreConfig(
    total: number,
    correct: number,
    incorrect: number,
  ): AssessmentSuccessConfig {
    const percent = total > 0 ? (correct / total) * 100 : 0;
    const bandConfig = this.getPerformanceBandConfig(percent);

    return {
      title: this.translateService.t(bandConfig.titleKey),
      description: this.translateService.t(bandConfig.descriptionKey),
      bgIcon: percent >= 90 ? 'celebration' : null,
      summary: {
        fgIcon: bandConfig.imagePrefix,
        totalQuestions: total,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
      },
    };
  }
}
