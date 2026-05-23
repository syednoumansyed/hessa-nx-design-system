import { ModalController } from '@ionic/angular/standalone';
import { UserProfile } from '@auth/model';
import { MultipleProfilesDialogComponent } from '@pages/login-old/components/multiple-profiles-dialog/multiple-profiles-dialog.component';

export async function openProfilesDetedtedModal({
  modalCtrl,
  phoneNumber,
  profilesList,
  sendSelectedProfile,
  code,
}: {
  modalCtrl: ModalController;
  phoneNumber: string;
  profilesList: Array<UserProfile>;
  sendSelectedProfile: (otp: string, selectedProfile: UserProfile) => void;
  code: string;
}) {
  const modal = await modalCtrl?.create({
    component: MultipleProfilesDialogComponent,
    componentProps: {
      phoneNumber: phoneNumber,
      profilesList: profilesList,
      sendSelectedProfile,
      code,
    },
  });
  modal.present();
}
