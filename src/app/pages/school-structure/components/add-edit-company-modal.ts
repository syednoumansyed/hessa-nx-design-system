import { ModalController } from '@ionic/angular/standalone';
import { AddCompanyComponent } from './add-company/add-company.component';
import { Company } from '@shared/dto-transformation/organization';

export async function openAddEditCompanyModal({
  modalCtrl,
  closeModal,
  companyDetails,
  onSuccess,
  isSubCompany,
  parentCompany,
  mobile,
}: {
  modalCtrl: ModalController;
  closeModal: () => void;
  companyDetails?: Company;
  parentCompany?: Company;
  onSuccess?: () => void;
  isSubCompany: boolean;
  mobile: boolean;
}) {
  const modal = await modalCtrl?.create({
    component: AddCompanyComponent,
    componentProps: {
      closeModal: closeModal,
      companyDetails,
      isSubCompany,
      parentCompany,
    },
    cssClass: `xl-modal ${mobile ? 'respect-safe-area' : 'overflow-y-auto'}`,
    ...(mobile
      ? {
          canDismiss: true,
          handleBehavior: 'cycle',
          breakpoints: [0.5, 0.8, 0.95, 1],
          initialBreakpoint: 0.8,
        }
      : {}),
  });
  modal.present();
  const { role } = await modal.onWillDismiss();

  if (role === 'confirm') {
    if (onSuccess) onSuccess();
  }
}
