import { Component, computed, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DsAttachmentFormControlComponent } from '@ds/attachment/ds-attachment-form-control.component';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { AssessmentQuestionDto } from '@pages/content-management/lms/data-access/assessment.dto';

@Component({
  selector: 'app-easy-display',
  templateUrl: './easy-display.component.html',
  standalone: true,
  imports: [
    DsTextareaComponent,
    ReactiveFormsModule,
    TranslocoDirective,
    DsAttachmentFormControlComponent,
  ],
})
export class EasyDisplayComponent implements OnInit {
  question = input<AssessmentQuestionDto>();
  form = input.required<FormGroup>();
  isViewMode = input<boolean>(false);

  allowAttachment = computed(() => {
    return this.question()?.isAttachmentAllowed ?? false;
  });

  constructor() {}

  ngOnInit() {
    if (this.isViewMode()) {
      this.form().get('answerText')?.disable();
      this.form().get('attachments')?.disable();
      this.form().patchValue({
        answerText: this.question()?.answer?.answerText || '',
        attachments: this.question()?.answer?.attachments || [],
      });
    }
  }
}
