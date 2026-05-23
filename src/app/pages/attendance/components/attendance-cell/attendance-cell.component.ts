import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ICellRendererParams } from 'ag-grid-community';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import {
  AttendanceStatus,
  StatusHistoryItemDTO,
} from '@pages/attendance/data-access/attendance.dto';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { ModalController } from '@ionic/angular/standalone';
import { openAttendanceHistoryModal } from '../attendance-history-dialog/attendance-history-dialog';

@Component({
  selector: 'app-attendance-cell',
  templateUrl: './attendance-cell.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, FaIconComponent],
})
export class AttendanceCellComponent implements ICellRendererAngularComp {
  private readonly modalCtrl = inject(ModalController);

  AttendanceStatus = AttendanceStatus;
  faCircleInfo = faCircleInfo;

  statusValue: string;
  previousStatus: string | null = null;
  hasStatusTransition = false;
  hasHistory = false;
  statusHistory: StatusHistoryItemDTO[] = [];

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.statusValue = params.value;
    this.statusHistory = params.data?.statusHistory || [];
    this.hasHistory = this.statusHistory.length > 0;

    // Check if there's a status transition
    // Show arrow if there's more than one status change in history (previous → current)
    if (this.statusHistory.length > 1) {
      // statusHistory is sorted by createdAt DESC, so index 1 is the previous status
      this.previousStatus = this.statusHistory[1]?.status || null;
      this.hasStatusTransition = this.previousStatus !== null;
    }
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  onViewHistoryClick() {
    if (this.hasHistory) {
      openAttendanceHistoryModal({
        modalCtrl: this.modalCtrl,
        statusHistory: this.statusHistory,
        closeModal: () => this.modalCtrl.dismiss(),
      });
    }
  }

  getStatusChipClasses(status: string): string {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'bg-success-50 text-success-700';
      case AttendanceStatus.ABSENT:
        return 'bg-error-50 text-error-700';
      case AttendanceStatus.EXCUSED:
        return 'bg-info-50 text-info-700';
      case AttendanceStatus.ON_LEAVE:
        return 'bg-indigo-50 text-indigo-700';
      case AttendanceStatus.LATE_ARRIVAL:
        return 'bg-warning-50 text-warning-700';
      default:
        return '';
    }
  }
}
