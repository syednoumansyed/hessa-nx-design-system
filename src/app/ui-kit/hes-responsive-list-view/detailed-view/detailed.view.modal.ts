import { inject, Injector, signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { DetailedViewComponent } from './detailed-view.component';
import { ITableCol, UnknownObject } from '@ui-kit/hes-table/model';
import { ListViewContextService } from '../list-view-context.service';

export function createDetailedViewModal() {
  const modalControl = inject(ModalController);
  const injector = inject(Injector);

  return async function ({
    data,
    columns,
  }: {
    data: UnknownObject;
    columns: ITableCol[];
  }) {
    const modal = await modalControl?.create({
      component: DetailedViewComponent,
      componentProps: {
        closeModal: () => {
          modal.dismiss();
        },
        data,
        columns,
        listViewContextService: injector.get(ListViewContextService),
      },
      breakpoints: [0.5, 0.8, 1],
      initialBreakpoint: 0.8,
    });
    modal.present();
  };
}
