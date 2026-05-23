import { ModalController } from '@ionic/angular/standalone';
import { TimePeriodModalComponent } from '../components/time-period-modal/time-period-modal.component';

export async function openAddTimePeriodModal({
  modalCtrl,
  closeModal,
  mobile,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  mobile?: boolean;
}) {
  const modal = await modalCtrl?.create({
    component: TimePeriodModalComponent,
    componentProps: {
      closeModal: closeModal,
    },
    cssClass: `xl-modal ${mobile ? '' : 'overflow-y-auto'}`,
    ...(mobile
      ? {
          canDismiss: true,
          handleBehavior: 'cycle',
          breakpoints: [0.5, 0.8, 1],
          initialBreakpoint: 0.8,
        }
      : {}),
  });
  modal.present();
}
