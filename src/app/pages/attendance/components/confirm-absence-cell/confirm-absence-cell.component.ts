import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import {
  AttendanceStatus,
  ConfirmationStatus,
} from '@pages/attendance/data-access/attendance.dto';

@Component({
  selector: 'app-confirm-absence-cell',
  templateUrl: './confirm-absence-cell.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
})
export class ConfirmAbsenceCellComponent implements ICellRendererAngularComp {
  AttendanceConfirmStatus = ConfirmationStatus;
  statusValue: string;
  isPresent = false;

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.statusValue = params.value;
    // If current attendance status is PRESENT, don't show confirmation status
    this.isPresent = params.data?.attendance === AttendanceStatus.PRESENT;
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }
}
