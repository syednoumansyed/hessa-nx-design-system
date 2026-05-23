import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ClassAttendanceStatus } from '@pages/attendance/data-access/attendance.dto';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-attendance-status-cell',
  templateUrl: './class-attendance-status-cell.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
})
export class AttendanceStatusCellComponent implements ICellRendererAngularComp {
  ClassAttendanceStatus = ClassAttendanceStatus;
  statusValue: string;
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.statusValue = params.value;
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }
}
