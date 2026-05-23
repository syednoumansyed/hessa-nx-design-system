import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';
import { DsInputComponent } from '@ds/input/input.component';
import { DsAttachmentFormControlComponent } from '@ds/attachment/ds-attachment-form-control.component';
import { DsSwitchComponent } from '@ds/switch/switch.component';
import { SupportCustomField } from '@pages/support-hub/data-access/support-custom-field.interface';
import { AnimatedIconComponent } from '@ds-layout/components/animated-icon/animated-icon.component';
import {
  DsAttachmentControlUploadedValue,
  DsAttachmentControlValue,
} from '@ds/attachment/attachment-control-value.interface';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { SupportHubTicketsService } from '@pages/support-hub/data-access/support-hub-tickets.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SupportTicketPayload } from '@shared/interfaces/support-tickets.interface';
import { finalize, of, switchMap, tap, Observable } from 'rxjs';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { DsModalFooterConfig, DsModalHeaderConfig } from '@ds/modal';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-support-ticket-request-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsTextareaComponent,
    DsInputComponent,
    DsAttachmentFormControlComponent,
    AnimatedIconComponent,
    DsSwitchComponent,
    DsTranslatePipe,
  ],
  templateUrl: './support-ticket-request-modal.component.html',
})
export class SupportTicketRequestModalComponent
  implements OnInit, DsModalContentComponent
{
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly toaster = inject(HesToasterService);
  private readonly translateService = inject(HesTranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly subcategoryName = input.required<string>();
  readonly supportTypeId = input.required<number>();
  readonly supportCategoryId = input.required<number>();
  readonly schoolId = input.required<number>();
  readonly studentIds = input<readonly number[]>([]);
  readonly allowPrivateRequest = input<boolean>(false);
  readonly customFields = input<SupportCustomField[]>([]);
  closeModal?: (data?: unknown, role?: string) => void;

  protected readonly descriptionPlaceholder = '';
  protected readonly hasSubmitted = signal(false);
  private submittedTicketId: string | number | null = null;

  protected readonly form = this.fb.group({
    description: this.fb.control<string>('', {
      validators: [Validators.required],
    }),
    attachments: this.fb.control<DsAttachmentControlValue[]>([]),
    hideInitiatorName: this.fb.control<boolean>(false),
  });

  // Dynamic form group for custom fields
  protected customFieldsForm = new FormGroup<
    Record<string, FormControl<string>>
  >({});

  protected readonly isSubmitting = signal(false);
  readonly primaryButtonDisabled = signal(true);
  readonly primaryButtonLoading = signal(false);

  readonly headerConfig = computed<DsModalHeaderConfig | undefined>(() => {
    if (this.hasSubmitted()) {
      return undefined;
    }

    return {
      title: this.subcategoryName(),
      subtitle: this.translateService.t('support.form_header.instruction'),
      showCloseButton: true,
    };
  });

  readonly footerConfig = computed<DsModalFooterConfig | undefined>(() => {
    const isSubmitted = this.hasSubmitted();

    return {
      primaryButton: {
        text: isSubmitted
          ? this.translateService.t('support.back_to_main.btn')
          : this.translateService.t('support.submit.btn'),
      },
      buttonSize: 'lg',
      fullWidthButtons: true,
    };
  });

  ngOnInit(): void {
    this.initializeCustomFieldsForm();
    this.subscribeToCustomFieldsChanges();
    this.syncPrimaryButtonState();
  }

  private subscribeToCustomFieldsChanges(): void {
    this.customFieldsForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncPrimaryButtonState());
  }

  private initializeCustomFieldsForm(): void {
    const fields = this.customFields();
    if (!fields?.length) return;

    const formControls: Record<string, FormControl<string>> = {};
    fields.forEach((field) => {
      formControls[`field_${field.id}`] = new FormControl<string>('', {
        nonNullable: true,
        validators: field.isRequired ? [Validators.required] : [],
      });
    });

    this.customFieldsForm = new FormGroup(formControls);
  }

  protected onCancel(): void {
    if (this.closeModal) {
      this.closeModal(null, 'cancel');
    }
  }

  onCloseClick(): void {
    this.onCancel();
  }

  onPrimaryClick(): void {
    if (this.hasSubmitted()) {
      this.onReturnToSupport();
      return;
    }
    this.onSubmit();
  }

  protected onSubmit(): void {
    const isCustomFieldsInvalid =
      this.customFields().length > 0 && this.customFieldsForm.invalid;

    if (this.form.invalid || isCustomFieldsInvalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      this.customFieldsForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const attachmentsControl = this.form.controls.attachments;
    const currentAttachments = attachmentsControl.value ?? [];
    const attachmentsForUpload = this.mapToUiKitAttachments(currentAttachments);

    const upload$: Observable<IAttachmentControlValue[]> =
      attachmentsForUpload.length
        ? this.supportHubTicketsService
            .uploadTicketAttachments(attachmentsForUpload)
            .pipe(
              tap((uploaded) =>
                attachmentsControl.setValue(
                  this.mapToDesignSystemAttachments(uploaded),
                ),
              ),
            )
        : of(attachmentsForUpload);

    upload$
      .pipe(
        switchMap((uploaded: IAttachmentControlValue[]) => {
          const uploadedKeys = uploaded
            .filter(
              (item): item is IAttachmentControlUploadedValue =>
                typeof item === 'object' && item !== null && 'key' in item,
            )
            .map((item) => item.key);

          const shouldHideInitiatorName =
            this.allowPrivateRequest() &&
            this.form.controls.hideInitiatorName.value === true;

          // Build custom fields payload
          const customFieldValues = this.buildCustomFieldsPayload();

          const payload: SupportTicketPayload = {
            description: this.form.controls.description.value,
            supportTypeId: this.supportTypeId(),
            supportCategoryId: this.supportCategoryId(),
            schoolId: this.schoolId(),
            ...(uploadedKeys.length ? { attachments: uploadedKeys } : {}),
            ...(this.studentIds().length
              ? { studentIds: [...this.studentIds()] }
              : {}),
            ...(shouldHideInitiatorName ? { hideInitiatorName: true } : {}),
            ...(customFieldValues.length
              ? { customFields: customFieldValues }
              : {}),
          };

          return this.supportHubTicketsService.createTicket(payload);
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (response: unknown) => {
          const ticketId = this.extractTicketId(response);
          this.submittedTicketId = ticketId;
          this.hasSubmitted.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.toaster.showBackendError(error);
        },
      });
  }

  private buildCustomFieldsPayload(): Array<{ id: number; value: string }> {
    const fields = this.customFields();
    if (!fields?.length) return [];

    return fields
      .map((field) => {
        const control = this.customFieldsForm.get(`field_${field.id}`);
        const value = control?.value?.trim() ?? '';
        return { id: field.id, value };
      })
      .filter((item) => item.value.length > 0);
  }

  protected onReturnToSupport(): void {
    if (this.closeModal) {
      this.closeModal({ ticketId: this.submittedTicketId }, 'submitted');
    }
  }

  private extractTicketId(response: any): string | number | null {
    if (!response) {
      return null;
    }

    if (typeof response === 'number' || typeof response === 'string') {
      return response;
    }

    if ('id' in response && response.id != null) {
      return response.id;
    }

    if (response?.data?.id != null) {
      return response.data.id;
    }

    if (response?.data?.ticketId != null) {
      return response.data.ticketId;
    }

    return null;
  }

  private mapToUiKitAttachments(
    attachments: DsAttachmentControlValue[],
  ): IAttachmentControlValue[] {
    return attachments.map((attachment) => {
      if (attachment instanceof File) {
        return attachment;
      }

      const { extension, key, url, id, isLink, publishingDate, title, name } =
        attachment as DsAttachmentControlUploadedValue;

      const mapped: IAttachmentControlUploadedValue = {
        extension,
        key,
        url,
        ...(id ? { id } : {}),
        ...(typeof isLink === 'boolean' ? { isLink } : {}),
        ...(typeof publishingDate !== 'undefined' ? { publishingDate } : {}),
        ...(title ? { title } : {}),
        ...(name ? { name } : {}),
        // `viewStatus` is design-system specific and not expected downstream
      };

      return mapped;
    });
  }

  private mapToDesignSystemAttachments(
    attachments: IAttachmentControlValue[],
  ): DsAttachmentControlValue[] {
    return attachments.map((attachment) => {
      if (attachment instanceof File) {
        return attachment;
      }

      const { extension, key, url, id, isLink, publishingDate, title, name } =
        attachment as IAttachmentControlUploadedValue;

      const mapped: DsAttachmentControlUploadedValue = {
        extension,
        key,
        url,
        ...(id ? { id } : {}),
        ...(typeof isLink === 'boolean' ? { isLink } : {}),
        ...(typeof publishingDate !== 'undefined' ? { publishingDate } : {}),
        ...(title ? { title } : {}),
        ...(name ? { name } : {}),
      };

      return mapped;
    });
  }

  constructor() {
    effect(() => {
      const isSubmitted = this.hasSubmitted();
      if (isSubmitted) {
        this.primaryButtonDisabled.set(false);
        this.primaryButtonLoading.set(false);
        return;
      }
      this.syncPrimaryButtonState();
    });

    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncPrimaryButtonState());
  }

  private syncPrimaryButtonState(): void {
    if (this.hasSubmitted()) {
      this.primaryButtonDisabled.set(false);
      this.primaryButtonLoading.set(false);
      return;
    }

    const customFieldsInvalid =
      this.customFields().length > 0 && this.customFieldsForm.invalid;

    this.primaryButtonDisabled.set(
      this.form.invalid || customFieldsInvalid || this.isSubmitting(),
    );
    this.primaryButtonLoading.set(this.isSubmitting());
  }
}
