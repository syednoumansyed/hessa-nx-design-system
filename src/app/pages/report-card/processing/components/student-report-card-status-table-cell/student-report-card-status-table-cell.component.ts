import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { STUDENT_REPORT_CARD_STATUS } from '../../data-access/report-card-list.enum';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { StudentReportCardStatusComponent } from '../student-report-card-status/student-report-card-status.component';
import { signal } from '@angular/core';
@Component({
  selector: 'app-student-report-card-status-table-cell',
  templateUrl: './student-report-card-status-table-cell.component.html',
  standalone: true,
  imports: [CommonModule, StudentReportCardStatusComponent],
})
export class StudentReportCardStatusTableCellComponent
  implements ICellRendererAngularComp
{
  // #region private properties
  private readonly translate = inject(HesTranslateService);
  protected status = signal<string>('');
  // #endregion

  constructor() {}

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.status.set(params.value);
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }
}
