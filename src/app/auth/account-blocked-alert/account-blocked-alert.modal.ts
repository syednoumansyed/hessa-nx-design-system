import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { AccountBlockedAlertComponent } from './account-blocked-alert.component';
import { USER_STATUS } from '@auth/model';

export function createAccountBlockedAlertModal() {
  const modalCtrl = inject(ModalController);
  return async function (blockedStatus: USER_STATUS) {
    const modal = await modalCtrl?.create({
      component: AccountBlockedAlertComponent,
      componentProps: {
        blockedStatus: blockedStatus,
      },
    });
    modal?.present();
  };
}
