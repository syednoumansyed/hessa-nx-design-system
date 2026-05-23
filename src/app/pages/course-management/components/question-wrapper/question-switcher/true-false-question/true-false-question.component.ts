import { CommonModule } from '@angular/common';
import {
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
} from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { MultiQuestionItemComponent } from './../mcq-question/multi-question-item/multi-question-item.component';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { QuestionsManagerService } from '@pages/course-management/components/question-wrapper/data-access/questions-manager.service';
import { QuestionFormService } from '../../data-access/question-form.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuestionOptionDTO } from '../../data-access/question.dto';
import { TranslocoService } from '@jsverse/transloco';

import { QuestionImagesUploadComponent } from '../question-images-upload/question-images-upload.component';
@Component({
  selector: 'app-true-false-question',
  templateUrl: './true-false-question.component.html',
  standalone: true,
  providers: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FormControlGeneratorComponent,
    MultiQuestionItemComponent,
    FontAwesomeModule,
    QuestionImagesUploadComponent,
  ],
})
export class TrueFalseQuestionComponent implements OnInit {
  private readonly questionFormService = inject(QuestionFormService);
  private readonly questionManagerService = inject(QuestionsManagerService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private translocoService = inject(TranslocoService);

  readonly form = this.questionFormService.form;
  faPlus = faPlus;
  questionConfig = computed<IControl>(() => {
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
        questionOptonsCtrl.clear();
        if (actionType === 'view' || actionType === 'edit') {
          this.form.patchValue({
            text: payload.text,
            attachments: payload.attachments ?? [],
          });
          payload.questionOptions?.map((option) => {
            questionOptonsCtrl.push(this.getQuestionOptionFrom(option));
          });
        } else if (actionType === 'add') {
          questionOptonsCtrl.push(
            this.getQuestionOptionFrom({
              text: this.translocoService.translate('global.true.txt'),
              isCorrect: false,
            }),
          );
          questionOptonsCtrl.push(
            this.getQuestionOptionFrom({
              text: this.translocoService.translate('global.false.txt'),
              isCorrect: false,
            }),
          );
        }
        this.cd.markForCheck();
      });
  }

  getQuestionOptionFrom(value?: QuestionOptionDTO) {
    return this.fb.group({
      text: value?.text || '',
      isCorrect: value?.isCorrect ?? false,
    });
  }

  ngOnInit() {}

  get optionsCtrl() {
    return this.form.controls.questionOptions;
  }

  onMarkAsCorrect(idx: number) {
    this.questionFormService.markAsCorrect(idx);
  }

  translate(key: string, params: object = {}): string {
    let data = this.translocoService.translate(key, params);
    return data;
  }
}
