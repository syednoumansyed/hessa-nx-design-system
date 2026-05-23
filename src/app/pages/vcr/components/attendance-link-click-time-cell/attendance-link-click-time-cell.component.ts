import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-attendance-link-click-time-cell',
  templateUrl: './attendance-link-click-time-cell.component.html',
  standalone: true,
})
export class AttendanceLinkClickTimeCellComponent
  implements ICellRendererAngularComp
{
  clickDate = '';
  clickTime = '';

  agInit(params: ICellRendererParams): void {
    console.log(params.data);
    this.clickDate = params.data.clickDate;
    this.clickTime = params.data.clickTime;
  }

  refresh(_params: ICellRendererParams): boolean {
    return false;
  }
}
