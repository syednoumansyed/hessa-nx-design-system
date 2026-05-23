import { Component, Input } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { IonTextarea } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { FaIconComponentsProps } from '@shared/types';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesAttachmentFormControlComponent } from '@ui-kit/hes-attachment-form-control/hes-attachment-form-control.component';

@Component({
  selector: 'app-escalate-dialog',
  templateUrl: './escalate-dialog.component.html',
  standalone: true,
  imports: [
    IonTextarea,
    HesButtonModule,
    TranslocoDirective,
    ReactiveFormsModule,
    HesAttachmentFormControlComponent,
  ],
})
export class EscalateResolveDialogComponent {
  commentControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  attachmentControl = new FormControl<any>(null, {
    nonNullable: true,
    validators: [Validators.required],
  });
  form: FormGroup;

  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'lg',
  };

  @Input() onSubmit: (description: string, attachments: File[]) => void;
  @Input() isResolve: boolean = false;
  @Input() deEscalate: boolean = false;
  @Input() closeModal: () => void;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      attachment: new FormControl(null),
      commentControl: this.commentControl,
    });
  }

  onAttachmentsChange(event: any) {
    this.form.get('attachment')?.setValue(event);
  }
}
