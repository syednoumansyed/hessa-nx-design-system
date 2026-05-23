import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { faMinus, faPlus } from '@fortawesome/pro-light-svg-icons';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { QuestionFormService } from '../../data-access/question-form.service';
import { QuestionsManagerService } from '../../data-access/questions-manager.service';
import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

@Component({
  selector: 'app-question-images-upload',
  templateUrl: './question-images-upload.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormControlGeneratorComponent,
    FontAwesomeModule,
    TranslocoDirective,
  ],
})
export class QuestionImagesUploadComponent implements OnInit {
  readonly faPlus = faPlus;
  readonly faMinus = faMinus;
  private readonly translocoService = inject(TranslocoService);
  isImageShow = signal(false);
  private readonly questionFromService = inject(QuestionFormService);
  private readonly questionManagerService = inject(QuestionsManagerService);
  readonly form = this.questionFromService.form;
  readonly isViewState$ = this.questionManagerService.isViewState$;

  attachmentConfig = computed<IControl>(() => {
    return {
      type: 'file',
      label: this.translocoService.translate('global.attachments.label'),
      formControlName: 'attachments',
      subLabel: this.translocoService.translate('global.upload_image.txt'),
      required: false,
      acceptFileTypes: ['IMAGES'],
      maxSizeInMB: 1024,
    };
  });
  imageUrl: string;
  constructor() {}

  ngOnInit() {
    if (this.form.controls.attachments.value.length > 0) {
      this.isImageShow.update(() => true);
    }
    if (this.form.controls.attachments.value?.length > 0) {
      this.imageUrl = (
        this.form.controls.attachments
          .value[0] as IAttachmentControlUploadedValue
      )?.url;
    }
  }
  onShowImageUpload() {
    this.isImageShow.update((v) => !v);
  }
}
