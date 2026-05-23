import { ModalController } from '@ionic/angular/standalone';
import { AttendanceHistoryDialogComponent } from './attendance-history-dialog.component';
import { StatusHistoryItemDTO } from '@pages/attendance/data-access/attendance.dto';

export async function openAttendanceHistoryModal({
  modalCtrl,
  statusHistory,
  closeModal,
}: {
  modalCtrl: ModalController;
  statusHistory: StatusHistoryItemDTO[];
  closeModal: () => void;
}) {
  const modal = await modalCtrl?.create({
    component: AttendanceHistoryDialogComponent,
    componentProps: {
      statusHistory,
      closeModal,
    },
    cssClass: 'lg-modal',
  });
  modal.present();
  return modal;
}
