import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { PickupRequestTableStatus } from '@shared/enums';
import { IPickupRequestItem } from '@pages/pickup/data-access/pickup.utils';
import { openPickupTimelineModal } from '@pages/pickup/pickup-timeline-modal';
import { DsModalService } from '@ds/modal/modal.service';

@Component({
  selector: 'app-pickup-status-table-cell',
  templateUrl: './pickup-status-table-cell.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class PickupStatusTableCellComponent implements ICellRendererAngularComp {
  private readonly translateService = inject(HesTranslateService);
  private readonly modalService = inject(DsModalService);
  private readonly translocoService = inject(TranslocoService);
  status: PickupRequestTableStatus;
  pickupRequestId: number | null;
  agInit(params: ICellRendererParams<IPickupRequestItem, any, any>): void {
    const { data } = params;
    console.log(data);

    if (data) {
      this.status = data.status;
      this.pickupRequestId = data.pickupRequestId;
    }
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  get statusName() {
    return this.translateService.enumT(this.status);
  }

  get isRequested() {
    return this.status === PickupRequestTableStatus.REQUESTED;
  }

  get isInProcess() {
    return this.status === PickupRequestTableStatus.IN_PROCESS;
  }

  get isPicked() {
    return this.status === PickupRequestTableStatus.PICKED;
  }

  get isDenied() {
    return this.status === PickupRequestTableStatus.DENIED;
  }

  get isLeftSchool() {
    return this.status === PickupRequestTableStatus.LEFT_SCHOOL;
  }

  onStatusClick() {
    if (!this.pickupRequestId) {
      return;
    }
    openPickupTimelineModal({
      modalService: this.modalService,
      translocoService: this.translocoService,
      timelineId: this.pickupRequestId,
    });
  }
}
