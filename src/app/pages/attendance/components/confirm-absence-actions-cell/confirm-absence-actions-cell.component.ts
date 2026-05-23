import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { IClassAttendanceAbsence } from '@pages/attendance/data-access/attendance.interface';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { openAttendanceHistoryModal } from '../attendance-history-dialog/attendance-history-dialog';

type ICustomCellParams = ICellRendererParams & {
  onViewHistory?: (data: IClassAttendanceAbsence) => void;
};

@Component({
  selector: 'app-confirm-absence-actions-cell',
  standalone: true,
  template: `
    <div class="flex items-center justify-center">
      <button
        type="button"
        *ngIf="hasHistory()"
        class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-primary-600"
        (click)="onViewHistoryClick()"
        aria-label="View history"
      >
        <fa-icon [icon]="faCircleInfo" size="lg"></fa-icon>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FaIconComponent],
})
export class ConfirmAbsenceActionsCellComponent implements ICellRendererAngularComp {
  private readonly modalCtrl = inject(ModalController);

  faCircleInfo = faCircleInfo;
  params = signal<ICustomCellParams | undefined>(undefined);
  rowData = signal<IClassAttendanceAbsence | undefined>(undefined);

  agInit(params: ICustomCellParams): void {
    this.params.set(params);
    this.rowData.set(params.data);
  }

  refresh(_params: ICustomCellParams): boolean {
    return false;
  }

  hasHistory(): boolean {
    return (this.rowData()?.statusHistory?.length ?? 0) > 0;
  }

  onViewHistoryClick() {
    const data = this.rowData();
    if (data) {
      openAttendanceHistoryModal({
        modalCtrl: this.modalCtrl,
        statusHistory: data.statusHistory || [],
        closeModal: () => this.modalCtrl.dismiss(),
      });
    }
  }
}
