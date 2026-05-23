import { ModalController } from '@ionic/angular/standalone';
import { EscalateResolveDialogComponent } from '@pages/support-tickets/components/escalate-dialog/escalate-dialog.component';

export async function openEscalationModal({
  modalCtrl,
  closeModal,
  onEscalate,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  onEscalate: (description: string, attachments: File[]) => void;
}) {
  const modal = await modalCtrl?.create({
    component: EscalateResolveDialogComponent,
    componentProps: {
      closeModal: closeModal,
      onSubmit: onEscalate,
    },
    cssClass: 'xl-modal overflow-y-auto',
  });
  modal.present();
}

export async function openDeEscalationModal({
  modalCtrl,
  deEscalate,
  closeModal,
  onDeEscalate,
}: {
  modalCtrl: ModalController;
  deEscalate: boolean;
  closeModal: () => void;
  onDeEscalate: (description: string, attachments: File[]) => void;
}) {
  const modal = await modalCtrl?.create({
    component: EscalateResolveDialogComponent,
    componentProps: {
      closeModal: closeModal,
      onSubmit: onDeEscalate,
      deEscalate,
    },
    cssClass: 'xl-modal overflow-y-auto',
  });
  modal.present();
}

export async function openResolveModal({
  modalCtrl,
  closeModal,
  onResolve,
  isResolve,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  onResolve: (description: string, attachments: File[]) => void;
  isResolve: boolean;
}) {
  const modal = await modalCtrl?.create({
    component: EscalateResolveDialogComponent,
    componentProps: {
      closeModal: closeModal,
      isResolve,
      onSubmit: onResolve,
    },
    cssClass: 'xl-modal overflow-y-auto',
  });
  modal.present();
}
