import { ModalController } from '@ionic/angular/standalone';
import { inject } from '@angular/core';
import { ReportHistoryDetailsComponent } from './report-history-details.component';
import { ReportItemDTO } from '@pages/reports/reports';

export function createReportHistoryDetailModal() {
  const modalCtrl = inject(ModalController);
  return async function ({ report }: { report: ReportItemDTO }) {
    const modal = await modalCtrl?.create({
      component: ReportHistoryDetailsComponent,
      componentProps: {
        closeModal: () => {
          modal.dismiss();
        },
        report,
      },
      cssClass: 'xl-modal overflow-y-auto',
    });
    modal.present();
  };
}
