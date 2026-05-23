import { EnvironmentInjector } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { DelegateBottomsheetComponent } from './components/delegate-bottomsheet/delegate-bottomsheet.component';
import { DelegateInfo } from './data-access/delegate-scan.interface';

interface DelegateBottomsheetParams {
  modalCtrl: ModalController;
  delegateInfo: DelegateInfo;
  injector: EnvironmentInjector;
}

export async function openDelegateBottomsheet({
  modalCtrl,
  delegateInfo,
  injector,
}: DelegateBottomsheetParams): Promise<string | null> {
  const modal = await modalCtrl.create({
    component: DelegateBottomsheetComponent,
    componentProps: { delegateInfo },
    cssClass: ['delegate-bottomsheet-modal', 'respect-safe-area'],
    handle: true,
    initialBreakpoint: 0.9,
    breakpoints: [0.6, 0.8, 0.9, 1],
    backdropBreakpoint: 0.5,
    backdropDismiss: true,
    showBackdrop: true,
    animated: true,
  });

  await modal.present();

  const { data } = await modal.onWillDismiss();

  return data ?? null;
}
