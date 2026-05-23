import { ModalController } from '@ionic/angular/standalone';
import { MediaAttachmentDialogComponent } from './media-attachment.component';
import {
  MediaAttachmentConfig,
  MediaAttachmentFormData,
  MediaAttachmentRecordUpdateCallbacks,
} from './media-attachment.interface';
import { inject } from '@angular/core';

export function createMediaAttachmentDialog(config: MediaAttachmentConfig) {
  const modalCtrl = inject(ModalController);
  return async function (args?: {
    recordUpdateCallback?: MediaAttachmentRecordUpdateCallbacks;
    mediaAttachmentFormData?: MediaAttachmentFormData;
  }) {
    const { recordUpdateCallback, mediaAttachmentFormData } = args || {};
    const newConfig = {
      ...config,
      ...(recordUpdateCallback && { recordUpdateCallback }),
      ...(mediaAttachmentFormData && {
        mediaAttachmentFormData,
      }),
    };
    const modal = await modalCtrl?.create({
      component: MediaAttachmentDialogComponent,
      componentProps: {
        config: {
          ...newConfig,
          onSuccess: () => {
            newConfig.onSuccess?.();
            modal.dismiss();
          },
          onCancel: () => {
            newConfig.onCancel?.();
            modal.dismiss();
          },
        },
      },
      cssClass: 'xl-modal overflow-y-auto',
      backdropDismiss: false,
    });
    await modal.present();
    return modal;
  };
}
