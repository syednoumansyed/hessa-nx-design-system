import { Injectable, inject } from '@angular/core';
import { DsActionListConfig } from '@ds/action-list';
import { DsActionListComponent } from '@ds/action-list/action-list.component';
import { ModalController } from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';

@Injectable({
  providedIn: 'root',
})
export class ActionListService {
  private modalController = inject(ModalController);
  private isMobile = isMobile();

  async show(config: DsActionListConfig): Promise<void> {
    const modal = await this.modalController.create({
      component: DsActionListComponent,
      componentProps: {
        config: config,
        closeCb: () => modal.dismiss(),
      },

      backdropDismiss: true,
      showBackdrop: true,
      ...(this.isMobile
        ? {
            breakpoints: [0, 0.8, 1],
            initialBreakpoint: 1,
          }
        : {
            cssClass: 'xl-modal h-90 respect-safe-area',
          }),
    });

    await modal.present();
  }
}
