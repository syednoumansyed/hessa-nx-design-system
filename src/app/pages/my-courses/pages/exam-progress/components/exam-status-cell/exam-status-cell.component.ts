import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { StudentSubmissionStatus } from '@pages/course-management/data-access/lms-exam.dto';

@Component({
  selector: 'app-exam-status-cell',
  templateUrl: './exam-status-cell.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
})
export class ExamStatusCellComponent implements ICellRendererAngularComp {
  StudentSubmissionStatus = StudentSubmissionStatus;
  statusValue: string;
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.statusValue = params.value;
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }
}
