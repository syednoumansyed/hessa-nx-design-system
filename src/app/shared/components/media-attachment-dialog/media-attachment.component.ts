import {
  Component,
  computed,
  DestroyRef,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { IonButton, IonProgressBar } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponentsProps } from '@shared/types';
import {
  IControl,
  FormControlGeneratorComponent,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

import { switchMap } from 'rxjs';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { NgClass } from '@angular/common';
import { FeedbackService } from '@shared/services/feedback.service';
import { IS_VALID_LINK } from '@shared/constants/regex-patterns.constant';
import {
  MediaAttachmentConfig,
  MediaAttachmentRecordUpdateCallbacks,
} from './media-attachment.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FileUploadService } from '@shared/services/file-upload.service';
import { environment } from 'src/environments/environment';
import { HesSubscription } from '@shared/utils/hes-subscription.util';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

type MediaAttachmentInputConfig = Omit<
  MediaAttachmentConfig,
  'recordUpdateCallbacks'
> & { recordUpdateCallbacks: MediaAttachmentRecordUpdateCallbacks };

@Component({
  selector: 'app-media-attachment-dialog',
  templateUrl: './media-attachment.component.html',
  standalone: true,
  imports: [
    IonProgressBar,
    IonButton,
    HesButtonModule,
    FormControlGeneratorComponent,
    ReactiveFormsModule,
    TranslocoDirective,
    NgClass,
  ],
})
export class MediaAttachmentDialogComponent implements OnInit {
  // #region injection
  private readonly fb = inject(FormBuilder);
  private readonly translateService = inject(HesTranslateService);
  private readonly toasterService = inject(HesToasterService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly fileUploadService = inject(FileUploadService);

  // #endregion

  // #region input
  @Input() config: MediaAttachmentInputConfig;
  // #endregion

  // #region public properties
  readonly isUploading = signal(false);
  readonly isLinkDisabled = signal(false);
  readonly isAttachmentDisabled = signal(false);
  readonly isSubmitDisabled = signal(true);
  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'lg',
  };
  // #endregion

  // #region private properties
  private readonly destroyRef = inject(DestroyRef);
  private readonly uploadSubscription = new HesSubscription();
  // #endregion

  // #region form configuration
  form = this.fb.group(
    {
      title: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.maxLength(250),
      ]),
      attachments: this.fb.control<Array<IAttachmentControlValue> | null>(null),
      link: this.fb.control<string | null>(null, [
        Validators.pattern(new RegExp(IS_VALID_LINK)),
      ]),
    },
    { validators: attachmentValidator() },
  );

  formConfig = computed<IControl[]>(() => {
    const titleControl: IControl = {
      label: this.translateService.t(
        this.config?.titleInput?.label
          ? this.config.titleInput.label
          : this.isVideoMediaType()
            ? 'global.video.title'
            : 'global.title.label',
      ),
      placeholder: this.translateService.t(
        this.config?.titleInput?.placeholder
          ? this.config.titleInput.placeholder
          : this.isVideoMediaType()
            ? 'content_management.video.title'
            : 'content_management.enter_topic_name.placeholder',
      ),
      type: 'input',
      formControlName: 'title',
      required: true,
    };

    const attachmentControl: IControl = {
      type: 'file',
      formControlName: 'attachments',
      ...(!this.isVideoMediaType() && {
        placeholder: this.translateService.t('global.file_types.txt'),
      }),
      required: true,
      isMultiple: this.config.attachmentConfig.isMultiple ?? false,
      acceptFileTypes: this.isVideoMediaType()
        ? ['VIDEOS']
        : ['FILES', 'IMAGES'],
      maxSizeInMB: 1024,
      readonly: !!this.config.isEditMode,
    };

    const linkControl: IControl = {
      label: this.translateService.t('content_management.link.title'),
      placeholder: this.translateService.t(
        'content_management.add_link.placeholder',
      ),
      type: 'input',
      formControlName: 'link',
      required: true,
      readonly: !!this.config.isEditMode,
    };

    const controls: IControl[] = [titleControl];

    if (!this.isVideoMediaType()) {
      controls.push(attachmentControl);
    } else {
      if (!this.isAttachmentDisabled()) {
        controls.push(attachmentControl);
      }
      if (!this.isLinkDisabled()) {
        controls.push(linkControl);
      }
    }

    return controls;
  });

  // #endregion

  // #region public methods
  ngOnInit() {
    this.form.controls.attachments?.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        this.isSubmitDisabled.set(status !== 'VALID');
        if (status === 'VALID') {
          this.form.controls.link?.setErrors(null);
        }
      });

    this.form.controls.link?.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        this.isSubmitDisabled.set(status !== 'VALID');
      });

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.isLinkDisabled.set(!!value.attachments?.length);
        this.isAttachmentDisabled.set(!!value.link);
      });
    this.patchForm();
  }

  addAttachment() {
    this.isUploading.set(true);
    if (this.isVideoMediaType() && this.form.value.link) {
      this.addLink();
      return;
    }

    this.uploadSubscription.add = this.handleUploadAttachment(
      this.form.value.attachments!,
    )
      .pipe(
        switchMap((uploadAttachmentResp) => {
          this.form.controls.attachments.setValue(uploadAttachmentResp);
          const updateObservable = this.config.recordUpdateCallback;

          // Throw an error if the callback is undefined
          if (!updateObservable) {
            throw new Error('recordUpdateCallback is undefined.');
          }

          // Call the callback and return its observable
          return updateObservable({
            attachments: uploadAttachmentResp.map((attachment) => ({
              path: attachment.key,
              isLink: false,
              name: this.getTitle(),
            })),
          });
        }),
      )
      .subscribe({
        next: () => {
          this.displaySuccessMessage();
        },
        error: (err) => {
          this.displayErrorMessage();
          this.config.onError?.(err);
        },
      });
  }

  addLink() {
    const updateObservable = this.config.recordUpdateCallback;

    // Throw an error if the callback is undefined
    if (!updateObservable) {
      throw new Error('recordUpdateCallback is undefined.');
    }
    updateObservable({
      attachments: [
        {
          path: this.form.value.link!,
          isLink: true,
          name: this.getTitle(),
        },
      ],
    }).subscribe({
      next: () => {
        this.displaySuccessMessage();
      },
      error: (err) => {
        this.displayErrorMessage();
        this.config.onError?.(err);
      },
    });
  }

  async cancel() {
    if (this.isUploading()) {
      const cancelUpload = await this.feedbackService.openFeedbackModal({
        type: 'error',
        modalTitle: this.translateService.t('global.unsaved_changes.txt'),
        primaryBtnStr: this.translateService.t(
          'global.unsaved_changes.leave_btn',
        ),
        secondaryBtnStr: this.translateService.t(
          'global.unsaved_changes.stay_btn',
        ),
      });
      if (cancelUpload) {
        this.uploadSubscription.unsubscribe();
        this.config.onCancel?.();
      }
    } else {
      this.config.onCancel?.();
    }
  }

  isVideoMediaType() {
    return this.config.mediaType === 'video';
  }
  // #endregion

  // #region private methods
  private displaySuccessMessage() {
    this.toasterService.success(
      this.translateService.t(
        this.config.toastMessages?.success
          ? this.config.toastMessages?.success
          : this.isVideoMediaType()
            ? 'content_management.video_added_successfully.txt'
            : 'content_management.delete_attachment_successfully.txt',
      ),
      '',
    );
    this.isUploading.set(false);
    this.config.onSuccess?.();
  }

  private displayErrorMessage() {
    this.isUploading.set(false);
    this.toasterService.error(
      this.translateService.t('global.wrong_msg.title'),
      this.translateService.t('global.adding_error.txt'),
    );
  }

  private handleUploadAttachment(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadMediaFiles({
      uploadUrlConfig: {
        video: {
          url: this.config.attachmentConfig?.uploadUrl,
          uploadAsFormData: true,
        },
        file: {
          url: this.config.attachmentConfig?.uploadUrl,
          uploadAsFormData: true,
        },
      },
      attachments,
    });
  }

  private getTitle() {
    return this.form.value.title ?? '';
  }

  private patchForm() {
    if (!this.config.mediaAttachmentFormData) {
      return;
    }
    const { title, name } = this.config.mediaAttachmentFormData?.[0] || {};
    if (this.config.mediaAttachmentFormData) {
      const link = this.config.mediaAttachmentFormData.find(
        (i) => i.isLink,
      )?.url;
      this.form.patchValue({
        title: title || name,
        ...(!link && { attachments: this.config.mediaAttachmentFormData }),
        link: link ?? null,
      });
    }
  }
  // #endregion
}

// #region internal
function attachmentValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const attachment = control.get('attachments')?.value;
    const link = control.get('link')?.value;

    if (!attachment && !link) {
      return { atLeastOneRequired: true };
    }
    return null;
  };
}
// #endregion
