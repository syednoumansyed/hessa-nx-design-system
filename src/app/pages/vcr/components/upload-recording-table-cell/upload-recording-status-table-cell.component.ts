import { Component, OnInit } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ManageRecordingTableItem } from '@pages/vcr/manage-recordings/manage-recordings.page';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  templateUrl: './upload-recording-status-table-cell.component.html',
  standalone: true,
  imports: [TranslocoDirective],
})
export class UploadRecordingStatusTableCellComponent
  implements ICellRendererAngularComp, OnInit
{
  data: ManageRecordingTableItem;
  constructor() {}
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.data = params.data;
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  ngOnInit() {}
}
