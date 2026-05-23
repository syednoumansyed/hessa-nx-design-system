import { ModalController } from '@ionic/angular/standalone';
import { ReassignDialogComponent } from '../components/reassign-dialog/reassign-dialog.component';
import { inject } from '@angular/core';

export function createReassignModal() {
  const modalCtrl = inject(ModalController);
  return async function ({
    ticketId,
    afterReassigned,
  }: {
    ticketId: string;
    afterReassigned?: () => void;
  }) {
    const modal = await modalCtrl?.create({
      component: ReassignDialogComponent,
      componentProps: {
        closeModal: () => {
          modal.dismiss();
        },
        afterReassigned: afterReassigned,
        ticketId,
      },
      cssClass: 'xl-modal overflow-y-auto',
    });
    modal.present();
  };
}
