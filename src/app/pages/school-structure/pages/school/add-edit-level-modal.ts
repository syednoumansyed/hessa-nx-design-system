import { ModalController } from '@ionic/angular/standalone';
import { AddEditLevelDialogComponent } from '@pages/school-structure/pages/school/components/add-edit-level-dialog/add-edit-level-dialog.component';
import { School } from '@shared/dto-transformation/organization';

export async function openAddEditLevelModal({
  modalCtrl,
  closeModal,
  schoolDetails,
  refreshSchoolDetails,
  mobile,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  schoolDetails: School;
  refreshSchoolDetails: () => void;
  mobile?: boolean;
}) {
  const modal = await modalCtrl?.create({
    component: AddEditLevelDialogComponent,
    componentProps: {
      closeModal: closeModal,
      schoolDetails,
      refreshSchoolDetails: refreshSchoolDetails,
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
