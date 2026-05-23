import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { PublishContentDialogComponent } from '@pages/course-management/components/publish-content-dialog/publish-content-dialog.component';
import { PublishDetailsDialogComponent } from '@pages/course-management/components/publish-details-dialog/publish-details-dialog.component';

export function createPublishDetailsDialog() {
  const modalCtrl = inject(ModalController);
  return async function (
    contentType: 'exam' | 'assignment' | 'Attachment' | 'video',
    contentId: number,
    publishedDate: string | null,
    isEditMode: boolean,
  ) {
    const modal = await modalCtrl?.create({
      component: PublishDetailsDialogComponent,
      componentProps: {
        close: (success: boolean, cancelled: boolean, editDialog: boolean) =>
          modal.dismiss({ data: { success, cancelled, editDialog } }),
        contentId,
        contentType,
        publishedDate,
        isEditMode,
      },
      cssClass: 'xl-modal overflow-y-auto',
      backdropDismiss: true,
    });
    await modal.present();
    return modal;
  };
}
