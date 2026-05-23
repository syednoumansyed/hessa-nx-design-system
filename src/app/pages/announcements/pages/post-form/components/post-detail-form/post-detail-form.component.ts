import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, computed, inject } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';

@Component({
  selector: 'app-post-detail-form',
  templateUrl: './post-detail-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
  ],
})
export class PostDetailFormComponent implements OnInit {
  @Input() form: FormGroup;
  private readonly translocoService = inject(TranslocoService);
  formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translate('global.title.label'),
        type: 'input',
        formControlName: 'title',
        required: true,
        placeholder: this.translate('global.enter_title.placeholder'),
      },
      {
        label: this.translate('global.content.label'),
        type: 'textarea',
        formControlName: 'content',
        required: true,
        placeholder: this.translate('announcements.enter_content.placeholder'),
      },
      {
        label: this.translocoService.translate(
          'global.upload_attachments.label',
        ),
        subLabel: this.translocoService.translate(
          'global.upload_attachments_msg.txt',
        ),
        type: 'file',
        formControlName: 'attachments',
        placeholder: this.translocoService.translate(
          'global.file_extensions.txt',
        ),
        toUploadFile: () => {},
        required: false,
        isMultiple: true,
        acceptFileTypes: ['FILES', 'IMAGES', 'VIDEOS'],
        maxSizeInMB: 1024,
      },
    ];
  });

  constructor() {}
  ngOnInit() {}

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
