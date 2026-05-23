import {
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  OnInit,
  Optional,
  output,
  Output,
} from '@angular/core';
import {
  faXmark,
  faEye,
  faTrashCan,
  faCircleCheck,
  faPen,
} from '@fortawesome/pro-regular-svg-icons';
import {
  IonImg,
  ModalController,
  IonProgressBar,
} from '@ionic/angular/standalone';
import { hesIcon, FaIconComponentsProps } from '@shared/types';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { HesActionSheetComponent } from '../../../../ui-kit/hes-action-sheet/hes-action-sheet.component';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { openVideoDialog } from '@ui-kit/hes-video-dialog/hes-video-dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CMSAssignmentsService } from '@pages/course-management/data-access/cms/cms-assignments.service';
import { PreviewExamComponent } from '@pages/course-management/components/preview-exam/preview-exam.component';
import { CMSExamService } from '@pages/course-management/data-access/cms-exam.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { DsModalService } from '@ds/modal/modal.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SubmissionStatusComponent } from '@pages/course-management/components/submission-status/submission-status.component';
import { StudentSubmissionStatus } from '@pages/course-management/data-access/lms-exam.dto';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { CmsAssignmentPreviewComponent } from '../cms-assignment-preview/cms-assignment-preview.component';
import { isMobile } from '@shared/utils/platform';
import { AssignmentStatus } from '@pages/course-management/data-access/lms/lms-assignment.dto';

import { AssignmentType } from '@pages/course-management/data-access/cms/cms-assignment.dto';
import { getAttachmentCategory } from '@shared/utils/get-attachmentType.util';
import { UserEventService } from '@shared/services/user-event.service';
import { CMSOfflineExamDetailsService } from '../topic-form/Modal/cms-offline-exam-details.service';
import { CMSWorksheetOrOfflineExamPreviewComponent } from '../topic-form/cms-worksheet-or-offline-exam-preview/cms-worksheet-or-offline-exam-preview.component';
import { CMSWorksheetDetailsService } from '../topic-form/Modal/cms-worksheet-details.service';
import { HesFileService } from '@shared/services/hes-file.service';
import { isYoutubeUrl } from '@pages/vcr/pages/utils';
import { createYoutubePlayerDialog } from '@shared/components/youtube-player/youtube-player-dialog';
import { createPublishContentDialog } from '@pages/course-management/components/publish-content-dialog/publish-content-dialog';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { createPublishDetailsDialog } from '@pages/course-management/components/publish-details-dialog/publish-details-dialog';

export interface TopicContent {
  type: 'Attachment' | 'video' | 'exam' | 'assignment';
  name: string;
  attachment?: IAttachmentControlUploadedValue;
  // from 0 to 1
  submissionPercentage?: number;
  isOfflineExam?: boolean;
  assignmentType?: AssignmentType;
  isNew?: boolean;
  id?: number;
  topicId?: number;
  isPublished?: boolean;
  publishingDate: string | null;
  status?: AssignmentStatus | StudentSubmissionStatus;
}

@Component({
  selector: 'app-topic-item',
  templateUrl: './topic-item.component.html',
  styleUrl: './topic-item.component.scss',
  standalone: true,
  imports: [
    IonProgressBar,
    IonImg,
    HesActionSheetComponent,
    TranslocoDirective,
    SubmissionStatusComponent,
    HesDatePipe,
  ],
  providers: [CMSWorksheetDetailsService, CMSOfflineExamDetailsService],
})
export class TopicItemComponent implements OnInit {
  private readonly toastService = inject(HesToasterService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly imageSlider = inject(ImageSliderService);
  private readonly transloco = inject(TranslocoService);
  private readonly ModalCtrl = inject(ModalController);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cmsAssignmentService = inject(CMSAssignmentsService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly userEventService = inject(UserEventService);
  private readonly cmsWorksheetDetailsService = inject(
    CMSWorksheetDetailsService,
  );
  private readonly cmsOfflineExamDetailsService = inject(
    CMSOfflineExamDetailsService,
  );
  private readonly fileService = inject(HesFileService);
  private readonly modalService = inject(DsModalService);
  private readonly hesTranslate = inject(HesTranslateService);
  private readonly youTubeDialog = createYoutubePlayerDialog();
  private readonly publishDetailsDialog = createPublishDetailsDialog();
  private readonly publishContentDialog = createPublishContentDialog();

  private readonly isMobile = isMobile();
  content = input.required<TopicContent>();
  isCMS = input<boolean>(false);
  onTopicUpdate = output<void>();
  attachment = computed<IAttachmentControlUploadedValue | undefined>(() => {
    return this.content()?.attachment;
  });
  itemName = computed<string>(() => {
    return this.content().name;
  });

  @Output() removed = new EventEmitter<IAttachmentControlValue>();

  @Output() removedAssignment = new EventEmitter();

  type = computed(() => {
    if (
      this.content().type === 'Attachment' ||
      this.content().type === 'video'
    ) {
      const attachment = this.attachment();
      if (!attachment) return null;
      if (attachment instanceof File) {
        return getAttachmentCategory(attachment);
      }

      return getAttachmentCategory(attachment);
    } else return this.content().type;
  });

  attachmentActions = computed<
    IAction<{ title: string; attachment: IAttachmentControlValue }>[]
  >(() => {
    if (
      this.content().type === 'video' ||
      this.content().type === 'Attachment'
    ) {
      return [
        {
          iconProps: { icon: faEye },
          text: this.transloco.translate('global.preview.btn'),
          onClick: (_data) => {
            this.preview();
          },
          hasPermission: (_data) => {
            if (this.isCMS()) {
              if (this.content().type === 'video')
                return this.rbac.hasPermission(
                  RESOURCE_PERMISSION.COURSE_CONTENT.READ.PREVIEW_VIDEO,
                );
              else
                return this.rbac.hasPermission(
                  RESOURCE_PERMISSION.COURSE_CONTENT.READ.PREVIEW_ATTACHMENT,
                );
            } else return false;
          },
        },
        {
          iconProps: { icon: faCircleCheck },
          text: this.transloco.translate(
            'content_management.view_published_details.txt',
          ),
          onClick: (_data) => {
            // this.showAttachmentPublishConfirmationDialog();
            this.showContentPublishConfirmationDialog(
              this.content().id!,
              this.content().type,
              this.content().publishingDate,
              true,
            );
          },
          hasPermission: (_data) => {
            return this.content().isPublished ?? false;
          },
        },
        {
          iconProps: { icon: faCircleCheck },
          text: this.transloco.translate('global.publish.btn'),
          onClick: (_data) => {
            // this.showAttachmentPublishConfirmationDialog();
            this.showContentPublishConfirmationDialog(
              this.content().id!,
              this.content().type,
            );
          },
          hasPermission: (_data) => {
            return !this.content().isPublished;
          },
        },
        {
          iconProps: { icon: faTrashCan, flip: 'horizontal' },
          text: this.transloco.translate('global.delete.btn'),
          onClick: (_data) => {
            this.onRemove();
          },
          hasPermission: () => {
            if (this.isCMS()) {
              if (this.content().type === 'video') {
                return this.rbac.hasPermission(
                  RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.VIDEO,
                );
              } else {
                return this.rbac.hasPermission(
                  RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.ATTACHMENT,
                );
              }
            } else return false;
          },
        },
      ];
    } else
      return [
        {
          hesIconProps: {
            src: 'assets/icons/chart.svg',
          },
          text: this.transloco.translate('global.view_progress.btn'),
          onClick: (_data) => {
            if (this.content().type === 'exam') {
              this.navigateToExamProgress();
            }
            if (this.content().type === 'assignment') {
              this.navigateToAssignmentProgress();
            }
          },
          hasPermission: (_data) => {
            if (!this.content().isPublished) {
              return false;
            }
            if (this.isExamType()) {
              return this.rbac.hasPermission(
                RESOURCE_PERMISSION.COURSE_CONTENT.READ.VIEW_DELIVERED_EXAM,
              );
            } else if (this.isAssignmentType()) {
              return this.rbac.hasPermission(
                RESOURCE_PERMISSION.COURSE_CONTENT.READ
                  .VIEW_DELIVERED_ASSIGNMENT,
              );
            }
            return true;
          },
        },
        {
          iconProps: { icon: faEye },
          text: this.transloco.translate('global.preview.btn'),
          onClick: (_data) => {
            if (this.content().type === 'assignment' && this.isCMS()) {
              if (this.content().assignmentType === 'WORKSHEET') {
                this.openCMSworkSheetAssignmentPreview();
              } else {
                this.openCMSAssignmentPreview();
              }
            } else if (this.content().type === 'exam') {
              if (this.content().isOfflineExam && this.isCMS()) {
                this.openCMSOfflineExamPreview();
              } else {
                this.openExamPreview(this.content().id!);
              }
            } else {
              this.preview();
            }
          },
          hasPermission: (_data) => {
            if (this.isAssignmentType()) {
              return this.rbac.hasPermission(
                RESOURCE_PERMISSION.COURSE_CONTENT.READ.PREVIEW_ASSIGNMENT,
              );
            }
            return true;
          },
        },
        {
          iconProps: { icon: faCircleCheck },
          text: this.transloco.translate(
            'content_management.view_published_details.txt',
          ),
          onClick: (_data) => {
            if (this.content().type === 'exam') {
              this.showContentPublishConfirmationDialog(
                this.content().id!,
                'exam',
                this.content().publishingDate,
                true,
              );
            } else {
              // this.showPublishAssignmentConfirmationDialog();
              this.showContentPublishConfirmationDialog(
                this.content().id!,
                'assignment',
                this.content().publishingDate,
                true,
              );
            }
          },
          hasPermission: (_data) => {
            if (!this.content().isPublished) {
              return false;
            }
            if (this.content().type === 'exam') {
              return this.rbac.hasPermission(
                RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.PUBLISH_EXAM,
              );
            } else if (this.isAssignmentType()) {
              return this.rbac.hasPermission(
                RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.PUBLISH_ASSIGNMENT,
              );
            }
            return true;
          },
        },
        {
          iconProps: { icon: faCircleCheck },
          text: this.transloco.translate('global.publish.btn'),
          onClick: (_data) => {
            if (this.content().type === 'exam') {
              this.showContentPublishConfirmationDialog(
                this.content().id!,
                'exam',
              );
            } else {
              // this.showPublishAssignmentConfirmationDialog();
              this.showContentPublishConfirmationDialog(
                this.content().id!,
                'assignment',
              );
            }
          },
          hasPermission: (_data) => {
            if (this.content().isPublished) {
              return false;
            }
            if (this.content().type === 'exam') {
              return this.rbac.hasPermission(
                RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.PUBLISH_EXAM,
              );
            } else if (this.isAssignmentType()) {
              return this.rbac.hasPermission(
                RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.PUBLISH_ASSIGNMENT,
              );
            }
            return true;
          },
        },
        {
          iconProps: { icon: faPen },
          text: this.transloco.translate('global.edit.btn'),
          onClick: (_data) => {
            if (this.content().type === 'exam') {
              this.navigateToExam();
            } else {
              this.navigateToAssignment();
            }
          },
          hasPermission: (_data) => {
            if (this.content().type === 'exam' && !this.content().isPublished) {
              return this.rbac.hasPermission(
                RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.EXAM,
              );
            } else if (this.isAssignmentType() && !this.content().isPublished) {
              return this.rbac.hasPermission(
                RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.ASSIGNMENT,
              );
            }
            return false;
          },
        },
        {
          iconProps: { icon: faTrashCan, flip: 'horizontal' },
          text: this.transloco.translate('global.delete.btn'),
          onClick: (_data) => {
            this.onRemove();
          },
          hasPermission: (_data) => {
            if (this.content().submissionPercentage != 0) {
              if (this.content().type === 'exam') {
                return this.rbac.hasPermission(
                  RESOURCE_PERMISSION.COURSE_CONTENT.DELETE
                    .EXAM_WITH_SUBMISSION,
                );
              } else if (this.isAssignmentType()) {
                return this.rbac.hasPermission(
                  RESOURCE_PERMISSION.COURSE_CONTENT.DELETE
                    .ASSIGNMENT_WITH_SUBMISSION,
                );
              }
              return false;
            }
            if (this.content().type === 'exam') {
              return this.rbac.hasSomePermission([
                RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.EXAM,
                RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.EXAM_WITH_SUBMISSION,
              ]);
            } else if (this.isAssignmentType()) {
              return this.rbac.hasSomePermission([
                RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.ASSIGNMENT,
                RESOURCE_PERMISSION.COURSE_CONTENT.DELETE
                  .ASSIGNMENT_WITH_SUBMISSION,
              ]);
            }
            return true;
          },
        },
      ];
  });

  previewImage = computed<IAttachmentControlUploadedValue | null>(
    () => this.attachment() ?? null,
  );

  readonly faPDF: hesIcon = {
    src: 'assets/icons/folder-outline.svg',
  };

  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'xs',
  };

  constructor(@Optional() private cmsExamService: CMSExamService) {}

  private navigateToExam() {
    if (this.isMobile)
      this.router.navigate(['exams', this.content().id], {
        relativeTo: this.route,
      });
    else
      this.router.navigate(
        [this.content().topicId, 'exams', this.content().id],
        { relativeTo: this.route },
      );
  }

  private navigateToExamProgress() {
    if (this.isMobile)
      this.router.navigate(['exams', this.content().id, 'students'], {
        relativeTo: this.route,
      });
    else
      this.router.navigate(
        [this.content().topicId, 'exams', this.content().id, 'students'],
        {
          relativeTo: this.route,
        },
      );
  }

  private navigateToAssignment() {
    if (this.isMobile)
      this.router.navigate(['assignments', this.content().id], {
        relativeTo: this.route,
      });
    else
      this.router.navigate(
        [this.content().topicId, 'assignments', this.content().id],
        {
          relativeTo: this.route,
        },
      );
  }

  ngOnInit() {}

  getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
  }

  preview() {
    if (this.type() === 'pdf' || this.type() === 'ppt') {
      const attachment = this.attachment()!;
      this.fileService.downloadFile({
        url: attachment.url,
        fileName: attachment.name ?? attachment.key.split('/').pop(),
        extension: attachment.extension,
      });
      this.userEventService.fireAttachmentEvent(
        attachment.id!,
        this.content().topicId!,
      );
    } else if (this.type() === 'video') {
      const attachment = this.attachment()!;
      if (this.attachment()?.isLink) {
        const isYoutubeLink = isYoutubeUrl(attachment.url);
        if (isYoutubeLink) {
          // open youtube player dialog
          this.youTubeDialog(this.itemName(), attachment.url);
        } else {
          window.open(attachment.url, '_blank');
        }
        this.userEventService.fireVideoEvent(
          attachment.id!,
          this.content().topicId!,
        );
      } else {
        openVideoDialog({
          modalCtrl: this.ModalCtrl,
          src: attachment.url,
          title: this.itemName(),
          onPlay: () =>
            this.userEventService.fireVideoEvent(
              attachment.id!,
              this.content().topicId!,
            ),
        });
      }
    } else if (this.type() === 'image') {
      const previewImage = this.previewImage();
      this.userEventService.fireAttachmentEvent(
        previewImage?.id!,
        this.content().topicId!,
      );
      if (previewImage) this.imageSlider.show([previewImage.url]);
    } else if (this.type() === 'exam') {
      if (this.isCMS()) {
        if (
          this.rbac.hasPermission(
            RESOURCE_PERMISSION.COURSE_CONTENT.READ.PREVIEW_EXAM,
          )
        ) {
          this.navigateToExamProgress();
        }
      } else {
        this.router.navigate([`exams/`, this.content().id], {
          relativeTo: this.route,
        });
      }
    } else if (this.type() === 'assignment') {
      if (this.isCMS()) {
        this.navigateToAssignmentProgress();
      } else {
        this.router.navigate(['assignments', this.content().id], {
          relativeTo: this.route,
        });
      }
    }
  }

  async openCMSAssignmentPreview() {
    const modal = await this.ModalCtrl.create({
      component: CmsAssignmentPreviewComponent,
      cssClass: this.isMobile ? 'modal-full radius-none' : 'xl-modal',
      componentProps: {
        assignmentId: this.content().id,
        closeFn: () => {
          modal.dismiss();
        },
      },
    });
    modal.present();
  }

  async openCMSworkSheetAssignmentPreview() {
    const assignmentDetails =
      await this.cmsWorksheetDetailsService.getWorksheetData(
        this.content().id!,
      );
    const worksheetAttachment =
      this.cmsWorksheetDetailsService.getWorksheetAttachment();
    const modal = await this.ModalCtrl.create({
      component: CMSWorksheetOrOfflineExamPreviewComponent,
      cssClass: this.isMobile ? 'modal-full radius-none' : 'xl-modal',
      componentProps: {
        modalTitle: this.transloco.translate(
          'content_management.assignment_details.title',
        ),
        gridData: assignmentDetails,
        worksheet: worksheetAttachment,
        closeFn: () => {
          modal.dismiss();
        },
      },
    });
    await modal.present();
  }

  async openCMSOfflineExamPreview() {
    const examDetails =
      await this.cmsOfflineExamDetailsService.getOfflineExamData(
        this.content().id!,
      );
    const modal = await this.ModalCtrl.create({
      component: CMSWorksheetOrOfflineExamPreviewComponent,
      cssClass: this.isMobile ? 'modal-full radius-none' : 'xl-modal',
      componentProps: {
        modalTitle: this.transloco.translate(
          'content_management.exam_details.title',
        ),
        gridData: examDetails,
        closeFn: () => {
          modal.dismiss();
        },
      },
    });
    await modal.present();
  }

  openExamPreview(examId: number) {
    if (!this.content().isOfflineExam) {
      this.modalService.open({
        component: PreviewExamComponent,
        componentProps: { examId },
        headerConfig: {
          title: this.hesTranslate.t('action.course_contents.preview_exam'),
          showCloseButton: true,
        },
        size: 'lg',
        scrollableContent: true,
        respectTopSafeArea: true,
      });
    }
  }

  onRemove() {
    if (
      this.content().type === 'Attachment' ||
      this.content().type === 'video'
    ) {
      this.removed.emit(this.attachment());
    } else if (this.content().type === 'assignment') {
      this.removedAssignment.emit(this.content().id!);
    } else if (this.content().type === 'exam') {
      this.showExamDeleteConfirmationDialog(this.content().id!);
    }
  }

  showExamDeleteConfirmationDialog(id: number) {
    const hasDeleteExamWithSubmissionPermission = this.rbac.hasPermission(
      RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.EXAM_WITH_SUBMISSION,
    );
    const hasDeleteExamPermission = this.rbac.hasPermission(
      RESOURCE_PERMISSION.COURSE_CONTENT.DELETE.EXAM,
    );
    const confirmationMessage =
      this.content().submissionPercentage != 0 &&
      hasDeleteExamWithSubmissionPermission
        ? 'course_management.delete_exam_submission.txt'
        : 'course_management.delete_exam.txt';
    if (!hasDeleteExamPermission && !hasDeleteExamWithSubmissionPermission) {
      return;
    }
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.transloco.translate(confirmationMessage),
        primaryBtnStr: this.transloco.translate('global.delete.btn'),
        secondaryBtnStr: this.transloco.translate('global.cancel.btn'),
      },
      () =>
        this.cmsExamService
          .deleteExam(id, hasDeleteExamWithSubmissionPermission)
          .subscribe({
            next: () => {
              this.toastService.success(
                this.transloco.translate(
                  'content_management.delete_exam_successfully.txt',
                ),
              );
              this.removed.emit();
            },
            error: (err) => {
              this.toastService.showBackendError(err);
            },
          }),
    );
  }

  async showContentPublishConfirmationDialog(
    id: number,
    type: 'exam' | 'assignment' | 'Attachment' | 'video',
    publishedDate?: string | null,
    isEdit = false,
    openDetailsDialog = true,
  ) {
    if (
      !this.rbac.hasPermission(
        RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.PUBLISH_EXAM,
      )
    ) {
      return;
    }
    const modal =
      isEdit && openDetailsDialog
        ? await this.publishDetailsDialog(
            type,
            id,
            publishedDate ?? null,
            isEdit,
          )
        : await this.publishContentDialog(type, id, isEdit);

    modal.onDidDismiss().then((modal) => {
      const { success, editDialog } = modal.data.data;
      if (editDialog && isEdit) {
        this.showContentPublishConfirmationDialog(
          id,
          type,
          publishedDate,
          true,
          false,
        );
      } else {
        if (success) {
          this.onTopicUpdate.emit();
          let msg = '';
          switch (type) {
            case 'exam':
              msg = this.transloco.translate(
                'content_management.publish_exam_successfully.txt',
              );
              break;
            case 'assignment':
              msg = this.transloco.translate(
                'content_management.publish_assignment_successfully.txt',
              );
              break;
            case 'video':
            case 'Attachment':
              msg = this.transloco.translate(
                `content_management.publish_${type === 'video' ? 'video' : 'attachment'}_successfully.txt`,
              );
          }
          this.toastService.success(msg);
        }
      }
    });
  }

  private navigateToAssignmentProgress() {
    if (this.isMobile)
      this.router.navigate(['assignments', this.content().id, 'students'], {
        relativeTo: this.route,
      });
    else
      this.router.navigate(
        [this.content().topicId, 'assignments', this.content().id, 'students'],
        {
          relativeTo: this.route,
        },
      );
  }

  private isAssignmentType() {
    return this.content().type === 'assignment';
  }

  private isExamType() {
    return this.content().type === 'exam';
  }
}
