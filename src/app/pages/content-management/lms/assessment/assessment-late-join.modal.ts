import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { LateJoinComponent } from './components/late-join/late-join.component';
import { isMobile } from '@shared/utils/platform';

export function createLateJoinModal() {
  const modalCtrl = inject(ModalController);
  const isMobileView = isMobile();
  return async function (
    dueDate: string,
    duration: number,
    startCallback: () => void,
  ) {
    const modal = await modalCtrl.create({
      component: LateJoinComponent,
      componentProps: {
        dueDate,
        duration,
        onStart: () => {
          startCallback();
          modal.dismiss();
        },
        onClose: () => {
          modal.dismiss();
        },
      },
      ...(isMobileView && {
        initialBreakpoint: 0.9,
        breakpoints: [0.5, 0.9],
      }),
      ...(!isMobileView && { cssClass: 'lg-modal' }),
    });
    await modal.present();
  };
}
