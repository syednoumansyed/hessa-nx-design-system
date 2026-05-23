import { ModalController } from '@ionic/angular/standalone';
import { MyTicketDetailsDialogComponent } from './my-ticket-details-dialog.component';
import { WritableSignal } from '@angular/core';
import { SupportTicketDetail } from '@shared/dto-transformation';

export async function openInitiatorTicketDetailsModal({
  modalCtrl,
  closeModal,
  ticketDetails,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  ticketDetails: WritableSignal<SupportTicketDetail>;
}) {
  const modal = await modalCtrl?.create({
    component: MyTicketDetailsDialogComponent,
    componentProps: {
      closeModal: closeModal,
      ticketDetails,
    },
    cssClass: 'xl-modal',
  });
  modal.present();
}
