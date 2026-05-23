import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { PublishContentDialogComponent } from '@pages/course-management/components/publish-content-dialog/publish-content-dialog.component';

export function createPublishContentDialog() {
  const modalCtrl = inject(ModalController);
  return async function (
    contentType: 'exam' | 'assignment' | 'Attachment' | 'video',
    contentId: number,
    isEditMode: boolean,
  ) {
    const modal = await modalCtrl?.create({
      component: PublishContentDialogComponent,
      componentProps: {
        close: (success: boolean, cancelled: boolean) =>
          modal.dismiss({ data: { success, cancelled } }),
        contentId,
        contentType,
        isEditMode,
      },
      cssClass: 'xl-modal overflow-y-auto',
      backdropDismiss: true,
    });
    await modal.present();
    return modal;
  };
}
