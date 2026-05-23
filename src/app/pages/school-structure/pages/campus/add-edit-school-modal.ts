import { ModalController } from '@ionic/angular/standalone';
import { AddEditSchoolDialogComponent } from '@pages/school-structure/pages/campus/components/add-edit-campus-dialog/add-edit-school-dialog.component';

export async function openAddEditSchoolModal({
  modalCtrl,
  closeModal,
  preDefinedData,
  schoolDetails,
  refreshCampusDetails,
  mobile,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  schoolDetails: any;
  preDefinedData: any;
  refreshCampusDetails: () => void;
  mobile?: boolean;
}) {
  const modal = await modalCtrl?.create({
    component: AddEditSchoolDialogComponent,
    componentProps: {
      closeModal: closeModal,
      schoolDetails,
      preDefinedData,
      refreshCampusDetail: refreshCampusDetails,
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
