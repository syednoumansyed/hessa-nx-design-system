import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { ReportCardPreviewComponent } from '@pages/report-card/configuration/components/report-card-preview/report-card-preview.component';
import { ReportCardDetail } from '../../data-access/report-card-configuration.interface';

export function createReportCardPreviewDialog() {
  const modalCtrl = inject(ModalController);
  return async function (reportCard: ReportCardDetail, isMobile: boolean) {
    const modal = await modalCtrl?.create({
      component: ReportCardPreviewComponent,
      ...(isMobile && {
        breakpoints: [0, 0.25, 0.5, 0.9],
        initialBreakpoint: 0.9,
      }),
      componentProps: {
        close: () => modal.dismiss(),
        reportCard,
      },
      cssClass: 'xl-mobile-modal overflow-x-auto overflow-y-auto',
    });
    await modal.present();
    return modal;
  };
}
