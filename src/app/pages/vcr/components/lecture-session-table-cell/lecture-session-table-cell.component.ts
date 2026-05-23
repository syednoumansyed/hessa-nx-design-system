import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Time12hrPipe } from '@pages/course-management/pipes/time-12-hr.pipe';
import { ManageRecordingTableItem } from '@pages/vcr/manage-recordings/manage-recordings.page';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DayOfWeekPipe } from '@pages/course-management/pipes/day-of-week.pipe';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

@Component({
  selector: 'app-lecture-session-table-cell',
  templateUrl: './lecture-session-table-cell.component.html',
  standalone: true,
  imports: [CommonModule, Time12hrPipe, DayOfWeekPipe, DsTranslatePipe],
})
export class LectureSessionTableCellComponent implements ICellRendererAngularComp {
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
