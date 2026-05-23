import {
  Component,
  computed,
  effect,
  input,
  OnInit,
  inject,
  output,
} from '@angular/core';
import {
  AssessmentQuestionDto,
  AssessmentQuestionType,
} from '../../../../data-access/assessment.dto';
import { McqsDisplayComponent } from '../components/mcqs-display/mcqs-display.component';
import { TrueFalseDisplayComponent } from '../components/true-false-display/true-false-display.component';
import { EasyDisplayComponent } from '../components/easy-display/easy-display.component';
import { FormGroup } from '@angular/forms';
import { SelectableOptionGroupConfig } from '@ds/selectable-option/selectable-option.types';
import { DsIconComponent } from '@ds/icon/icon.component';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { DsChipComponent } from '@ds/chip/chip.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { UserEventService } from '@shared/services/user-event.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ObjId } from '@shared/interfaces/common.interface';

@Component({
  selector: 'app-question-display',
  templateUrl: './question-display.component.html',
  standalone: true,
  imports: [
    McqsDisplayComponent,
    TrueFalseDisplayComponent,
    EasyDisplayComponent,
    DsIconComponent,
    DsChipComponent,
    TranslocoDirective,
  ],
})
export class QuestionDisplayComponent implements OnInit {
  question = input<AssessmentQuestionDto>();
  isViewMode = input<boolean>(false);
  form = input.required<FormGroup>();

  displayEvent = output<void>();

  private readonly imageSliderService = inject(ImageSliderService);
  private readonly userEventService = inject(UserEventService);
  private readonly translateService = inject(HesTranslateService);
  readonly questionType = AssessmentQuestionType;

  readonly imageUrl = computed(() => {
    return this.question()?.attachments?.[0]?.url ?? null;
  });

  readonly questionText = computed(() => {
    return this.question()?.text ?? '';
  });

  readonly modelAnswer = computed(() => {
    return this.question()?.modelAnswer;
  });

  readonly mode = computed(() => {
    return this.isViewMode() ? 'view' : 'attempt';
  });

  readonly selectableConfig = computed<SelectableOptionGroupConfig>(() => {
    return {
      options:
        this.question()?.options?.map((option) => ({
          value: option.id,
          display: option.text,
        })) || [],
      mode: this.mode(),
      revealAnswer: this.isRevealAnswer(),
      correctOptionValue: this.getCorrectOptionId(),
    };
  });

  readonly isNotAttempted = computed(() => {
    return this.question()?.answer === null && this.isViewMode();
  });

  constructor() {
    effect(() => {
      this.setFormValue();
    });

    effect(() => {
      this.fireDisplayEvent();
    });
  }
  ngOnInit() {}

  onOpenImageSlider() {
    const image = this.imageUrl();
    if (!image) return;
    this.imageSliderService.show([image]);
  }
  /**
   * Pre-fills form controls with the student's answer for the current question.
   */
  private setFormValue() {
    const question = this.question();
    if (!question) return;
    const { answer, type } = question;
    if (!answer) return;
    const { questionOptionId, answerText, attachments } = answer || {};
    const questionOptionIdControl = this.form().get('questionOptionId');
    const answerTextControl = this.form().get('answerText');
    const attachment = this.form().get('attachments');
    if (!questionOptionIdControl || !answerTextControl) return;
    if (type === AssessmentQuestionType.MCQ) {
      questionOptionIdControl.setValue(questionOptionId ?? null, {
        emitEvent: false,
      });
    } else if (type === AssessmentQuestionType.TRUE_OR_FALSE) {
      questionOptionIdControl.setValue(questionOptionId ?? null, {
        emitEvent: false,
      });
    } else if (type === AssessmentQuestionType.ESSAY) {
      answerTextControl.setValue(answerText ?? '', {
        emitEvent: false,
      });
      const attachmentLabel = this.translateService.t(
        'global.attachments.title',
      );
      const mappedAttachments = (attachments ?? []).map((a: any) => ({
        ...a,
        name:
          a.name ||
          a.title ||
          (a.extension ? `${attachmentLabel}.${a.extension}` : attachmentLabel),
      }));
      attachment?.setValue(mappedAttachments, {
        emitEvent: false,
      });

      if (this.isViewMode()) {
        answerTextControl.disable();
        attachment?.disable();
      }
    }
  }

  private getCorrectOptionId() {
    return this.question()?.options?.find((item) => item.isCorrect)?.id ?? null;
  }

  private isRevealAnswer() {
    return this.question()?.options?.some((item) => item.isCorrect) ?? false;
  }

  private fireDisplayEvent() {
    const question = this.question();
    if (question && !question.questionView?.displayed) {
      this.userEventService
        .fireQuestionDisplayedEvent(question.id)
        .subscribe(() => {
          this.displayEvent.emit();
        });
    }
  }
}
