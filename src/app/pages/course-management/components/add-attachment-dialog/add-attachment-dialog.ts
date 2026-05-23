import { ModalController } from '@ionic/angular/standalone';
import { AddAttachmentDialogComponent } from './add-attachment-dialog.component';
import { CourseTopicDTO } from '@pages/course-management/data-access/course-content.dto';

export async function openAddAttachmentDialog({
  modalCtrl,
  isVideo,
  topic,
}: {
  modalCtrl: ModalController;
  isVideo: boolean;
  topic: CourseTopicDTO;
}) {
  const modal = await modalCtrl?.create({
    component: AddAttachmentDialogComponent,
    componentProps: {
      isVideo,
      topic,
      modalCtrl,
    },
    cssClass: 'xl-modal overflow-y-auto',
    backdropDismiss: false,
  });
  modal.present();
  return modal;
}
