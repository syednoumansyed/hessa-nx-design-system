import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { StudentSubmissionStatus } from '@pages/course-management/data-access/lms/lms-assignment.dto';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-assignment-status-cell',
  templateUrl: './assignment-status-cell.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
})
export class AssignmentStatusCellComponent implements ICellRendererAngularComp {
  StudentSubmissionStatus = StudentSubmissionStatus;
  statusValue: string;
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.statusValue = params.value;
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }
}
