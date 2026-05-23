import { ModalController } from '@ionic/angular/standalone';
import { ViewTimePeriodModalComponent } from '../components/view-time-period-modal/view-time-period-modal.component';

export async function openViewTimePeriodModal({
  modalCtrl,
  closeModal,
  id,
  mobile,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  id: number;
  mobile?: boolean;
}) {
  const modal = await modalCtrl?.create({
    component: ViewTimePeriodModalComponent,
    componentProps: {
      closeModal: closeModal,
      id,
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
