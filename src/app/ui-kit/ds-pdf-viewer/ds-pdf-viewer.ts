import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';
import { DsPdfViewerComponent } from './ds-pdf-viewer.component';

export interface DsPdfViewerConfig {
  src: string;
  title?: string;
  fileName?: string;
}

export function createPdfViewerDialog() {
  const modalCtrl = inject(ModalController);
  const mobile = isMobile();

  return async (config: DsPdfViewerConfig) => {
    const modal = await modalCtrl.create({
      component: DsPdfViewerComponent,
      componentProps: {
        src: config.src,
        title: config.title,
        fileName: config.fileName,
      },
      cssClass: mobile ? 'full-modal' : 'xl-modal',
      ...(mobile
        ? {
            initialBreakpoint: 0.95,
            breakpoints: [0.5, 0.95, 1],
            handle: true,
          }
        : {}),
    });

    await modal.present();
    return modal;
  };
}
