import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { TitleCasePipe } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-attendance-list-status-table-cell',
  templateUrl: './attendance-list-status-table-cell.component.html',
  imports: [TitleCasePipe, TranslocoDirective],
  standalone: true,
})
export class AttendanceListStatusTableCellComponent
  implements ICellRendererAngularComp
{
  status: string;
  constructor() {}
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.status = params.value;
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }
}
