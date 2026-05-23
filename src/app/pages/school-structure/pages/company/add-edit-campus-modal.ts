import { ModalController } from '@ionic/angular/standalone';
import { AddEditCampusDialogComponent } from '@pages/school-structure/pages/company/components/add-edit-campus-dialog/add-edit-campus-dialog.component';

export async function openAddEditCampusModal({
  modalCtrl,
  closeModal,
  companyDetails,
  campusDetails,
  refreshCompanyDetails,
  mobile,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  companyDetails: any;
  campusDetails: any;
  refreshCompanyDetails: () => void;
  mobile?: boolean;
}) {
  const modal = await modalCtrl?.create({
    component: AddEditCampusDialogComponent,
    componentProps: {
      closeModal: closeModal,
      companyDetails,
      campusDetails,
      refreshCompanyDetail: refreshCompanyDetails,
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
