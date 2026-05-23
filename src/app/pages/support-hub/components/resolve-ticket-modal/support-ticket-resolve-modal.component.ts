import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';
import { DsAttachmentFormControlComponent } from '@ds/attachment/ds-attachment-form-control.component';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { DsAcceptFileType } from '@ds/attachment/attachment-type.constant';
import { ModalController } from '@ionic/angular/standalone';
import { SupportHubTicket } from '../../data-access/support-hub-initiated-tickets.interface';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

export interface SupportTicketResolvePayload {
  readonly message: string;
  readonly attachments: ReadonlyArray<DsAttachmentControlValue>;
}

@Component({
  selector: 'app-support-ticket-resolve-modal',
  standalone: true,
  templateUrl: './support-ticket-resolve-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsAttachmentFormControlComponent,
    DsTextareaComponent,
    DsTranslatePipe,
  ],
})
export class SupportTicketResolveModalComponent implements DsModalContentComponent {
  private readonly modalController = inject(ModalController);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly ticket = input<SupportHubTicket | null>(null);
  readonly onSubmit = input<
    ((payload: SupportTicketResolvePayload) => Promise<void> | void) | undefined
  >(undefined);
  closeModal?: (data?: unknown, role?: string) => void;

  protected readonly isSubmitting = signal(false);
  readonly primaryButtonLoading = this.isSubmitting;
  readonly primaryButtonDisabled = signal(true);
  protected readonly attachmentAcceptTypes: DsAcceptFileType = [
    'IMAGES',
    'FILES',
  ];
  protected readonly attachmentMaxSizeMb = 5;

  protected readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.maxLength(1000)]],
    attachments: this.fb.nonNullable.control<DsAttachmentControlValue[]>([]),
  });

  constructor() {
    this.primaryButtonDisabled.set(this.form.invalid || this.isSubmitting());
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.primaryButtonDisabled.set(
          this.form.invalid || this.isSubmitting(),
        );
      });
    effect(() => {
      this.primaryButtonDisabled.set(this.form.invalid || this.isSubmitting());
    });
  }

  onPrimaryClick(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    void this.handleSubmit();
  }

  onSecondaryClick(): void {
    if (this.closeModal) {
      this.closeModal(null, 'cancel');
      return;
    }
    void this.modalController.dismiss(null, 'cancel');
  }

  protected async handleSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    const submitHandler = this.onSubmit();

    if (!submitHandler || this.form.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      await Promise.resolve(
        submitHandler({
          message: this.form.controls.message.value.trim(),
          attachments: [...this.form.controls.attachments.value],
        }),
      );
    } catch (error) {
      console.error('Failed to resolve ticket', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected onClose(): void {
    if (this.closeModal) {
      this.closeModal(null, 'cancel');
      return;
    }
    void this.modalController.dismiss(null, 'cancel');
  }
}
