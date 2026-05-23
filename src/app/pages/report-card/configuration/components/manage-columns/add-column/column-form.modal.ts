import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { ColumnFormComponent } from './column-form.component';
import {
  ReportCardColumnDetailDTO,
  ReportCardExistingColumnDTO,
} from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { ReportCardDetail } from '@pages/report-card/configuration/data-access/report-card-configuration.interface';

export function createColumnModal() {
  const modalCtrl = inject(ModalController);
  return async function (args: {
    reportCard: ReportCardDetail;
    column: ReportCardColumnDetailDTO | null;
    existingColumn: ReportCardExistingColumnDTO | null;
  }) {
    const { reportCard, column = null, existingColumn = null } = args;
    const modal = await modalCtrl.create({
      component: ColumnFormComponent,
      componentProps: {
        reportCard,
        column,
        existingColumn,
        closeModal: () => {
          modal.dismiss();
        },
      },
      cssClass: 'xl-modal overflow-y-auto',
    });
    modal.present();
  };
}
