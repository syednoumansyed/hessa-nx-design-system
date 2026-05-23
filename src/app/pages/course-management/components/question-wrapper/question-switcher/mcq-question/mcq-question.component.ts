import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { MultiQuestionItemComponent } from './multi-question-item/multi-question-item.component';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { QuestionsManagerService } from '@pages/course-management/components/question-wrapper/data-access/questions-manager.service';
import { QuestionFormService } from '../../data-access/question-form.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuestionOptionDTO } from '../../data-access/question.dto';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { QuestionImagesUploadComponent } from '../question-images-upload/question-images-upload.component';

@Component({
  selector: 'app-mcq-question',
  templateUrl: './mcq-question.component.html',
  standalone: true,
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FormControlGeneratorComponent,
    MultiQuestionItemComponent,
    FontAwesomeModule,
    TranslocoDirective,
    QuestionImagesUploadComponent,
  ],
})
export class McqQuestionComponent implements OnInit {
  private readonly questionFormService = inject(QuestionFormService);
  private readonly cd = inject(ChangeDetectorRef);
  readonly form = this.questionFormService.form;

  private readonly questionManagerService = inject(QuestionsManagerService);
  private readonly fb = inject(NonNullableFormBuilder);
  private translocoService = inject(TranslocoService);
  readonly isViewState$ = this.questionManagerService.isViewState$;
  readonly faPlus = faPlus;
  readonly questionConfig = computed<IControl>(() => {
    return {
      label: this.translate('content_management.question.label'),
      placeholder: this.translate(
        'content_management.enter_question.placeholder',
      ),
      type: 'input',

      formControlName: 'text',
      required: true,
      errorMessage: {
        maxlength: this.translocoService.translate(
          'global.validation.max_length',
          {
            chars: 1500,
            label: this.translate(
              'content_management.question.label',
            ).toLowerCase(),
          },
        ),
      },
    };
  });

  constructor() {
    this.questionManagerService.activeState$
      .pipe(takeUntilDestroyed())
      .subscribe(({ actionType, payload }) => {
        const questionOptonsCtrl = this.form.controls.questionOptions;
        if (actionType === 'view') {
          questionOptonsCtrl.clear();
          this.form.patchValue({
            text: payload.text,
            attachments: payload.attachments ?? [],
          });
          payload.questionOptions?.map((option) => {
            questionOptonsCtrl.push(this.getQuestionOptionFrom(option));
          });
        } else if (actionType === 'add') {
          questionOptonsCtrl.clear();
          const numberOfOptions = 4;
          Array.from({ length: numberOfOptions }).forEach(() => {
            questionOptonsCtrl.push(this.getQuestionOptionFrom());
          });
        }
        this.cd.markForCheck();
      });
  }

  getQuestionOptionFrom(value?: QuestionOptionDTO) {
    return this.fb.group({
      text: this.fb.control(value?.text || '', [
        Validators.required,
        Validators.minLength(1),
      ]),
      isCorrect: value?.isCorrect ?? false,
    });
  }

  ngOnInit() {}

  get optionsCtrl() {
    return this.form.controls.questionOptions;
  }
  addNewQuestion() {
    const option = this.fb.group({ text: '', isCorrect: false });
    this.optionsCtrl.push(option);
  }

  onRemove(idx: number) {
    this.optionsCtrl.removeAt(idx);
  }

  onMarkAsCorrect(idx: number) {
    this.questionFormService.markAsCorrect(idx);
  }

  translate(key: string, params: object = {}): string {
    let data = this.translocoService.translate(key, params);
    return data;
  }
}
