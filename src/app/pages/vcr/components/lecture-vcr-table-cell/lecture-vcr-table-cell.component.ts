import { Component, inject, Input } from '@angular/core';
import { LectureDTO } from '@pages/course-management/data-access/course-management.dto';
import { DayOfWeekPipe } from '@pages/course-management/pipes/day-of-week.pipe';
import { Time12hrPipe } from '@pages/course-management/pipes/time-12-hr.pipe';
import { LectureModalService } from '@pages/course-management/utils/lecture-modal.service';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  templateUrl: './lecture-vcr-table-cell.component.html',
  standalone: true,
  imports: [DayOfWeekPipe, Time12hrPipe, DsTranslatePipe],
})
export class LectureVCRTableCellComponent implements ICellRendererAngularComp {
  lectures: LectureDTO[];
  private readonly lectureModalService = inject(LectureModalService);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.lectures = this.sort(params.data?.lectures) || [];
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  sort(lectures: LectureDTO[]) {
    if (!lectures) {
      return lectures;
    }
    return lectures.sort((a: LectureDTO, b: LectureDTO) => {
      if (a.dayOfWeek < b.dayOfWeek) {
        return -1;
      } else if (a.dayOfWeek > b.dayOfWeek) {
        return 1;
      } else {
        return a.periodNumber - b.periodNumber;
      }
    });
  }
}
