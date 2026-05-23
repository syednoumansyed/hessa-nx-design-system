import {
  Component,
  computed,
  inject,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  IonButton,
  ModalController,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { HesButtonModule } from '../../../../ui-kit/hes-button/hes-button.module';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponentsProps } from '@shared/types';
import {
  IControl,
  FormControlGeneratorComponent,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

import { CMSCourseContentService } from '@pages/course-management/data-access/cms/cms-course-content.service';
import { Subscription, switchMap } from 'rxjs';
import {
  CourseTopicDTO,
  CourseTopicPayload,
} from '@pages/course-management/data-access/course-content.dto';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { NgClass } from '@angular/common';
import { FeedbackService } from '@shared/services/feedback.service';
import { attachmentValidator } from './attachment-validator';
import { IS_VALID_LINK } from '@shared/constants/regex-patterns.constant';

@Component({
  selector: 'app-add-attachment-dialog',
  templateUrl: './add-attachment-dialog.component.html',
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
  providers: [CMSCourseContentService],
})
export class AddAttachmentDialogComponent implements OnInit, OnDestroy {
  private readonly translocoService = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  private modalCtrl = inject(ModalController);
  private readonly toasterService = inject(HesToasterService);
  private readonly feedbackService = inject(FeedbackService);

  modal: HTMLIonModalElement;

  @Input() isVideo = false;
  @Input() topic: CourseTopicDTO;

  isUploading = signal(false);

  uploadSubscription: Subscription;

  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'lg',
  };

  form: FormGroup<{
    title: FormControl<string>;
    attachment: FormControl<Array<IAttachmentControlValue> | null>;
    link: FormControl<string | null>;
  }> = this.fb.group(
    {
      title: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.maxLength(250),
      ]),
      attachment: this.fb.control<Array<IAttachmentControlValue> | null>(null),
      link: this.fb.control<string | null>(null, [
        Validators.pattern(new RegExp(IS_VALID_LINK)),
      ]),
    },
    { validators: attachmentValidator() },
  );

  formConfig = computed<IControl[]>(() => {
    const isVideo = this.isVideo;
    if (!isVideo)
      return [
        {
          label: this.transloco.translate('global.title.label'),
          placeholder: this.transloco.translate(
            'content_management.enter_topic_name.placeholder',
          ),
          type: 'input',
          formControlName: 'title',
          required: true,
        },
        {
          type: 'file',
          formControlName: 'attachment',
          required: true,
          isMultiple: false,
          acceptFileTypes: ['FILES', 'COMMON_IMAGES'],
          maxSizeInMB: 1024,
        },
      ];
    else {
      let controls: IControl[] = [
        {
          label: this.transloco.translate('global.video.title'),
          placeholder: this.transloco.translate('global.video.placeholder'),
          type: 'input',
          formControlName: 'title',
          required: true,
        },
      ];

      if (this.isAttachmentDisabled()) {
        controls = controls.filter(
          (control) => control.formControlName !== 'attachment',
        );
      } else {
        controls.push({
          type: 'file',
          formControlName: 'attachment',
          required: true,
          isMultiple: false,
          acceptFileTypes: ['VIDEOS'],
          maxSizeInMB: 1024,
        });
      }

      if (this.isLinkDisabled()) {
        // remove link form field
        controls = controls.filter(
          (control) => control.formControlName !== 'link',
        );
      } else {
        controls.push({
          label: this.transloco.translate('content_management.link.title'),
          placeholder: this.transloco.translate(
            'content_management.add_link.placeholder',
          ),
          type: 'input',
          formControlName: 'link',
          helperText: this.transloco.translate(
            'content_management.link_note.txt',
          ),
          required: true,
        });
      }
      return controls;
    }
  });

  isLinkDisabled = signal(false);
  isAttachmentDisabled = signal(false);
  isSubmitDisabled = signal(true);
  private formSubscription: Subscription;
  private attachmentStatusSubscription: Subscription;
  private linkStatusSubscription: Subscription;

  constructor(private courseContentService: CMSCourseContentService) {}

  ngOnInit() {
    this.attachmentStatusSubscription =
      this.form.controls.attachment?.statusChanges.subscribe((status) => {
        this.isSubmitDisabled.set(status !== 'VALID');
        if (status === 'VALID') {
          this.form.controls.link?.setErrors(null);
        }
      });

    this.linkStatusSubscription =
      this.form.controls.link?.statusChanges.subscribe((status) => {
        this.isSubmitDisabled.set(status !== 'VALID');
      });

    this.formSubscription = this.form.valueChanges.subscribe((value) => {
      if (this.isVideo && !value.attachment && this.form.controls.link.valid) {
        this.isLinkDisabled.set(false);
        this.isAttachmentDisabled.set(true);
        // Clear attachment validators when link is provided
        this.form.controls.attachment.clearValidators();
        this.form.controls.attachment.updateValueAndValidity({
          emitEvent: false,
        });
      } else if (this.isVideo && value.attachment && !value.link) {
        this.isLinkDisabled.set(true);
        this.isAttachmentDisabled.set(false);
        // Clear link validators when attachment is provided
        this.form.controls.link.clearValidators();
        this.form.controls.link.updateValueAndValidity({ emitEvent: false });
      } else if (
        this.isVideo &&
        !this.form.controls.attachment.valid &&
        !this.form.controls.link.valid
      ) {
        this.isLinkDisabled.set(false);
        this.isAttachmentDisabled.set(false);
      }
    });
  }

  addAttachment() {
    let obs;
    this.isUploading.set(true);
    if (this.isVideo) {
      if (this.form.value.link) {
        this.addLink();
        return;
      }
      obs = this.courseContentService.uploadVideos(this.form.value.attachment!);
    } else {
      obs = this.courseContentService.uploadAttachments(
        this.form.value.attachment!,
      );
    }
    this.uploadSubscription = obs
      .pipe(
        switchMap((videos) => {
          return this.updateAttachment(
            (videos[0] as IAttachmentControlUploadedValue).key,
            false,
          );
        }),
      )
      .subscribe({
        next: () => {
          this.displaySuccessMessage();
        },
        error: (err) => {
          this.displayErrorMessage();
        },
      });
  }

  addLink() {
    this.uploadSubscription = this.updateAttachment(
      this.form.value.link!,
      true,
    ).subscribe({
      next: () => {
        this.displaySuccessMessage();
      },
      error: (err) => {
        this.displayErrorMessage();
      },
    });
  }

  displaySuccessMessage() {
    this.isUploading.set(false);
    this.toasterService.success(
      this.transloco.translate(
        this.isVideo
          ? 'content_management.video_added_successfully.txt'
          : 'content_management.attachment_added_successfully.txt',
      ),
      '',
    );
    this.isUploading.set(false);
    this.modalCtrl.dismiss(null, 'confirm');
  }

  private displayErrorMessage() {
    this.isUploading.set(false);
    this.toasterService.error(
      this.transloco.translate('global.wrong_msg.title'),
      this.transloco.translate('global.adding_error.txt'),
    );
  }

  updateAttachment(path: string, isUrl: boolean) {
    const payload: Partial<CourseTopicPayload> = {
      attachments: [
        {
          name: this.form.value.title!,
          path: path,
          isLink: isUrl,
        },
      ],
    };
    return this.courseContentService.updateCourseTopic(+this.topic.id, payload);
  }

  async cancel() {
    if (this.isUploading()) {
      const cancelUpload = await this.feedbackService.openFeedbackModal({
        type: 'error',
        modalTitle: this.transloco.translate('global.unsaved_changes.txt'),
        primaryBtnStr: this.transloco.translate(
          'global.unsaved_changes.leave_btn',
        ),
        secondaryBtnStr: this.transloco.translate(
          'global.unsaved_changes.stay_btn',
        ),
      });
      if (cancelUpload) {
        this.uploadSubscription.unsubscribe();
        this.modal.dismiss(null, 'cancel');
      }
    } else this.modalCtrl.dismiss(null, 'cancel');
  }

  ngOnDestroy(): void {
    this.attachmentStatusSubscription.unsubscribe();
    this.linkStatusSubscription.unsubscribe();
    this.formSubscription.unsubscribe();
  }
}
