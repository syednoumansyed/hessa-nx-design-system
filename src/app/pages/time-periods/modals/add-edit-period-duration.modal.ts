import { ModalController } from '@ionic/angular/standalone';
import { PeriodDurationModalComponent } from '../components/period-duration-modal/period-duration-modal.component';
import { ITimePeriodQueryParams } from '@shared/dto-transformation/time-period/time-period.interface';
import { Subject } from 'rxjs';

export async function openAddEditPeriodDurationModal({
  modalCtrl,
  closeModal,
  timePeriodPayload,
  onRefresh,
  id,
  isEdit,
  mobile,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  timePeriodPayload?: ITimePeriodQueryParams;
  onRefresh: Subject<void>;
  id?: number;
  isEdit?: boolean;
  mobile: boolean;
}) {
  const modal = await modalCtrl?.create({
    component: PeriodDurationModalComponent,
    componentProps: {
      closeModal: closeModal,
      timePeriodPayload,
      onRefresh,
      id,
      isEdit,
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
