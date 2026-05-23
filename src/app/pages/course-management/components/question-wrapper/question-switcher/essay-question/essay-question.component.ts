import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { Idropdown } from '@shared/interfaces';
import { QuestionsManagerService } from '@pages/course-management/components/question-wrapper/data-access/questions-manager.service';
import { QuestionFormService } from '../../data-access/question-form.service';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { QuestionImagesUploadComponent } from '../question-images-upload/question-images-upload.component';

@Component({
  selector: 'app-essay-question',
  templateUrl: './essay-question.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    FormControlGeneratorComponent,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    TranslocoDirective,
    QuestionImagesUploadComponent,
  ],
})
export class EssayQuestionComponent implements OnInit {
  private readonly questionManagerService = inject(QuestionsManagerService);
  private readonly questionFormService = inject(QuestionFormService);

  form = this.questionFormService.form;

  private translocoService = inject(TranslocoService);
  private isViewMode = signal(false);

  essayFormConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('content_management.question.label'),
        placeholder: this.translate(
          'content_management.enter_question.placeholder',
        ),
        type: 'input',
        inputType: 'text',
        required: true,
        formControlName: 'text',
        readonly: this.isViewMode(),
        errorMessage: {
          maxlength: this.translocoService.translate(
            'global.validation.max_length',
            {
              chars: 4000,
              label: this.translate(
                'content_management.question.label',
              ).toLowerCase(),
            },
          ),
        },
      },
      {
        label: this.translate('content_management.model_answer.title'),
        placeholder: this.translate(
          'content_management.enter_model_answer.placeholder',
        ),
        type: 'textarea',
        required: false,
        formControlName: 'modelAnswer',
        readonly: this.isViewMode(),
      },
      {
        label: this.translate(
          'content_management.submit_answer_as_attachment.txt',
        ),
        placeholder: '',
        type: 'searchable-select',
        required: false,
        formControlName: 'isAttachmentAllowed',
        readonly: this.isViewMode(),
        selectValues: <Idropdown[]>[
          {
            value: 'true',
            displayedValue: this.translocoService.translate('global.yes.btn'),
          },
          {
            value: 'false',
            displayedValue: this.translocoService.translate('global.no.btn'),
          },
        ],
      },
    ];
  });

  constructor() {
    this.questionManagerService.activeState$
      .pipe(takeUntilDestroyed())
      .subscribe(({ actionType, payload }) => {
        this.isViewMode.set(actionType === 'view');
        this.form.controls.questionOptions.clear();
        if (actionType === 'view' || actionType === 'edit') {
          this.form.patchValue({
            text: payload.text,
            modelAnswer: payload.modelAnswer,
            isAttachmentAllowed: payload.isAttachmentAllowed ? 'true' : 'false',
            attachments: payload.attachments ?? [],
          });
        } else if (actionType === 'add') {
          this.form.patchValue({
            isAttachmentAllowed: 'false',
          });
        }
      });
  }
  ngOnInit() {}

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
