import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import {
  ModalController,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { faPen, faTrashCan, faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponentsProps } from '@shared/types';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { RecodingDTO } from '@pages/vcr/data-access/manage-recording.dto';
import { openVideoDialog } from '@ui-kit/hes-video-dialog/hes-video-dialog';
import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { HesActionSheetComponent } from '@ui-kit/hes-action-sheet/hes-action-sheet.component';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { FeedbackService } from '@shared/services/feedback.service';
import { VcrAPIService } from '@pages/vcr/data-access/vcr.api-service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { createMediaAttachmentDialog } from '@shared/components/media-attachment-dialog/media-attachment-dialog';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { tap } from 'rxjs';
import { ObjId } from '@shared/interfaces/common.interface';
import { FlipProp } from '@fortawesome/fontawesome-svg-core';
import { isYoutubeUrl } from '@pages/vcr/pages/utils';
import { createYoutubePlayerDialog } from '@shared/components/youtube-player/youtube-player-dialog';

@Component({
  selector: 'app-view-recording-modal',
  templateUrl: './view-recording-modal.component.html',
  standalone: true,
  imports: [
    IonSpinner,
    IonIcon,
    CommonModule,
    HesButtonModule,
    TranslocoDirective,
    HesDatePipe,
    NoDataCardComponent,
    HesActionSheetComponent,
  ],
})
export class ViewRecordingModalComponent implements OnInit {
  // #region injection
  private readonly vcrApiService = inject(VcrAPIService);
  private readonly transloco = inject(TranslocoService);
  private readonly modalCtrl = inject(ModalController);
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly toaster = inject(HesToasterService);
  private readonly translateService = inject(HesTranslateService);
  private readonly youTubeDialog = createYoutubePlayerDialog();
  // #endregion

  // #region input
  @Input() headerTitle: string;
  @Input() subTitle: string;
  @Input() videoUploadUrl: string;
  @Input() sessionId: number;
  @Input() vcrId: number;

  // #endregion

  // #region public properties
  readonly subjectName: string;
  readonly recordingsData = signal<RecodingDTO[]>([]);
  readonly isLoading = signal(false);
  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'lg',
  };
  readonly editVCRPermission = RESOURCE_PERMISSION.VCR.UPDATE.UPDATE_VCR;
  readonly deleteVCRPermission = RESOURCE_PERMISSION.VCR.DELETE.DELETE_VCR;

  // #endregion

  // #region private properties
  private readonly mediaAttachmentDialog = createMediaAttachmentDialog({
    header: this.translateService.t('virtual_classrooms.edit_recording.title'),
    subHeader: this.translateService.t(
      'virtual_classrooms.upload_recording.txt',
    ),
    mediaType: 'video',
    titleInput: {
      placeholder: this.translateService.t('global.enter_title.placeholder'),
      label: this.translateService.t('global.title.label'),
    },
    attachmentConfig: {
      label: '',
      uploadUrl: this.vcrApiService.getUploadVideoUrl(),
      isMultiple: false,
    },
    toastMessages: {
      success: this.translateService.t(
        'virtual_classrooms.recording_uploaded_successfully.txt',
      ),
    },
    isEditMode: true,
  });
  // #endregion

  // #region public methods
  ngOnInit(): void {
    this.fetchRecordings();
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  onClickVideo(attachment: IAttachmentControlUploadedValue) {
    if (attachment.isLink) {
      // check if it is YouTube link
      if (isYoutubeUrl(attachment.url)) {
        this.youTubeDialog(attachment.name ?? '', attachment.url);
      } else {
        window.open(attachment.url, '_blank');
      }
    } else {
      openVideoDialog({
        modalCtrl: this.modalCtrl,
        title: attachment.title!,
        src: attachment.url,
      });
    }
  }
  // #endregion

  attachmentActions = computed<IAction<AttchmentActionData>[]>(() => {
    return [
      {
        hasPermission: (_data: AttchmentActionData) => {
          return this.rbac.hasPermission(this.editVCRPermission);
        },
        iconProps: { icon: faPen },
        text: this.transloco.translate('global.edit.btn'),
        onClick: (data: AttchmentActionData) => {
          this.uploadRecording(data);
        },
      },
      {
        hasPermission: () => {
          return this.rbac.hasPermission(this.deleteVCRPermission);
        },
        iconProps: { icon: faTrashCan, flip: 'horizontal' },
        text: this.transloco.translate('global.delete.btn'),
        onClick: (data: AttchmentActionData) => {
          const { attachment, lectureId } = data;
          this.onDeleteRecording(lectureId, attachment.id!);
        },
      },
    ];
  });

  // #region private methods
  private onDeleteRecording(lectureId: ObjId, attachmentId: ObjId) {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.transloco.translate(
          'virtual_classrooms.delete_recording_msg.text',
        ),
        primaryBtnStr: this.transloco.translate('global.delete.btn'),
        secondaryBtnStr: this.transloco.translate('global.cancel.btn'),
      },
      () => {
        if (attachmentId)
          this.vcrApiService
            .deleteRecording(lectureId, attachmentId)
            .subscribe({
              next: () => {
                const message = this.transloco.translate(
                  'virtual_classrooms.delete_recording_successfully.text',
                );
                this.toaster.success(message);
                this.fetchRecordings();
              },
              error: () => {
                this.toaster.showGlobalWrongMessage();
              },
            });
      },
    );
  }

  private uploadRecording({ attachment, lectureId }: AttchmentActionData) {
    console.log({ attachment, lectureId });
    this.mediaAttachmentDialog({
      ...(attachment && { mediaAttachmentFormData: [attachment] }),
      recordUpdateCallback: (data) => {
        return this.vcrApiService
          .updateUploadedRecordingTitle(lectureId, attachment.id!, {
            title: data.attachments[0].name,
          })
          .pipe(
            tap(() => {
              this.fetchRecordings();
            }),
          );
      },
    });
  }

  private fetchRecordings() {
    if (this.vcrId) {
      this.fetchRecordingsByVcrId();
    } else if (this.fetchByLectureId) {
      this.fetchByLectureId();
    }
  }

  private fetchRecordingsByVcrId() {
    this.isLoading.set(true);
    this.vcrApiService.fetchRcordingsByVcrId(this.vcrId).subscribe({
      next: (data) => {
        this.setRecordingsData(data);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  private fetchByLectureId() {
    this.isLoading.set(true);
    this.vcrApiService.fetchRecordingsByLectureId(this.sessionId).subscribe({
      next: (data) => {
        this.setRecordingsData([data]);
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  private setRecordingsData(data: RecodingDTO[]) {
    this.recordingsData.set(
      data.filter((item) => item.attachments?.length > 0),
    );
  }
  // #endregion
}

// #region internal
export interface AttchmentActionData {
  attachment: IAttachmentControlUploadedValue;
  lectureId: number;
}
// #endregion
