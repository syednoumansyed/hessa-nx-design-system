import { Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { TranslocoDirective } from '@jsverse/transloco';
import { StudentAttendanceStatus } from '@shared/enums';

@Component({
  selector: 'app-mark-attendance-cell',
  templateUrl: './mark-attendance-cell.component.html',
  standalone: true,
  imports: [TranslocoDirective],
})
export class MarkAttendanceCellComponent implements ICellRendererAngularComp {
  params = signal<ICustomCellParams | undefined>(undefined);
  status = signal<StudentAttendanceStatus | null>(null);

  agInit(params: ICustomCellParams): void {
    this.params.set(params);
    this.status.set(params.value);
  }

  refresh(params: ICellRendererParams<any>): boolean {
    return false;
  }

  protected readonly StudentAttendanceStatus = StudentAttendanceStatus;

  markAttendance(attendance: StudentAttendanceStatus) {
    const params = this.params()!;
    this.params()?.onMarkAttendance(params.data.id, attendance);
  }
}

type ICustomCellParams = ICellRendererParams & {
  status: StudentAttendanceStatus[];
  onMarkAttendance: (id: number, data: StudentAttendanceStatus) => void;
};
