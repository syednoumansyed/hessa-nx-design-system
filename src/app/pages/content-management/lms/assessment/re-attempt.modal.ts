import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';
import { ReAttemptComponent } from './components/re-attempt/re-attempt.component';

export function createReAttemptModal() {
  const modalCtrl = inject(ModalController);
  const isMobileView = isMobile();

  return async function (
    title: string,
    description: string,
    btnText: string,
    startCallback: () => void,
  ) {
    const modal = await modalCtrl.create({
      component: ReAttemptComponent,
      componentProps: {
        title,
        description,
        btnText,
        reAttempt: () => {
          startCallback();
          modal.dismiss();
        },
        onClose: () => {
          modal.dismiss();
        },
      },
      ...(isMobileView && {
        initialBreakpoint: 0.9,
        breakpoints: [0, 0.9],
      }),
      ...(!isMobileView && { cssClass: 'lg-modal' }),
    });

    await modal.present();
    return modal.onDidDismiss();
  };
}
