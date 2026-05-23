import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  ControlContainer,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Idropdown } from '@shared/interfaces';
import { IAttachment } from '@shared/interfaces/attachment';
import { HesAttachmentFormControlComponent } from '@ui-kit/hes-attachment-form-control/hes-attachment-form-control.component';
import { IonTextarea, IonImg } from '@ionic/angular/standalone';
import { faCheck, faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HesAttachmentPreviewComponent } from '../../../../ui-kit/hes-attachment-form-control/attachment-preview/attachment-preview.component';
import { isMobile } from '@shared/utils/platform';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { QuestionType } from '@pages/course-management/data-access/lms-exam.dto';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

export interface IQuestionFormControlConfig {
  id: number;
  question: string;
  questionType: QuestionType;
  options?: Array<Idropdown & { correctAnswer: boolean }>;
  attachment?: IAttachment;
  modelEssayAnswer?: string;
  allowAttachmentAsEssayAnswer?: boolean;
  submittedAttachments?: IAttachment[];
  // question order
  order: number;
  // total questions
  totalQuestions: number;
  // applies exam mode styling
  isExam: boolean;
  formControlName: string;
  showCorrectAnswer: boolean;
  showSubmission: boolean;
  submittedAnswer?: number | string | IAttachment[];
  isResultView?: boolean;
}

@Component({
  selector: 'app-question-form-control-generator',
  templateUrl: './question-form-control-generator.component.html',
  styleUrl: './question-form-control-generator.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonImg,
    CommonModule,
    ReactiveFormsModule,
    HesAttachmentFormControlComponent,
    IonTextarea,
    FontAwesomeModule,
    HesAttachmentPreviewComponent,
    TranslocoDirective,
  ],
})
export class QuestionFormControlGeneratorComponent implements OnInit {
  faCheck = faCheck;
  faXmark = faXmark;
  form!: FormGroup;
  isMobile = signal(isMobile()).asReadonly();
  transloco = inject(TranslocoService);

  private readonly controlContainer = inject(ControlContainer);

  config = input.required<IQuestionFormControlConfig>();

  answer = model<string | number | boolean>();

  answerChanged = output<any>();

  readonly formControlName = computed(() => {
    return this.config().formControlName;
  });

  public language = this.transloco.getActiveLang();

  constructor() {
    toObservable(this.config)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const formControlName = this.config().formControlName;
        const formVal = this.form.value;
        if (
          formVal[formControlName] !== undefined &&
          formVal[formControlName] !== null
        ) {
          this.answer.set(formVal[formControlName]);
        }
      });
  }

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;

    this.form.valueChanges.subscribe((value) => {
      if (
        value[this.formControlName()] !== undefined &&
        value[this.formControlName()] !== null
      ) {
        this.answer.set(value[this.formControlName()]);
        this.form.controls[this.config().formControlName].markAllAsTouched();
        this.form.markAsTouched();
      }
    });
  }

  onSelectionChange(event: any) {
    this.answerChanged.emit({
      questionId: this.config().id,
      value: event,
    });
  }

  onTextValueChange(event: any) {
    this.answerChanged.emit({
      questionId: this.config().id,
      value: event.detail.value,
    });
  }

  onAttachmentChange(event: any) {
    this.answerChanged.emit({
      questionId: this.config().id,
      value: event,
    });
  }
}
