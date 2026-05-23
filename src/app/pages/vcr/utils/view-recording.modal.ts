import { ModalController } from '@ionic/angular/standalone';
import { inject } from '@angular/core';
import { ViewRecordingModalComponent } from '../components/view-recording-modal/view-recording-modal.component';

export function createViewRecordingModal() {
  const modalCtrl = inject(ModalController);
  return async function ({
    headerTitle,
    subTitle,
    uploadURl,
    sessionId,
    vcrId,
  }: {
    headerTitle?: string;
    subTitle?: string;
    uploadURl?: string;
    sessionId?: number;
    vcrId?: number;
    afterSuccess?: () => {};
  }) {
    const modal = await modalCtrl?.create({
      component: ViewRecordingModalComponent,
      componentProps: {
        headerTitle,
        subTitle,
        uploadURl,
        sessionId,
        vcrId,
        closeModal: () => {
          modal.dismiss();
        },
      },
      cssClass: 'xl-modal overflow-y-auto',
    });
    modal.present();
  };
}
