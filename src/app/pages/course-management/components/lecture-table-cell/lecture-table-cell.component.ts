import { Component, inject } from '@angular/core';
import { LectureDTO } from '@pages/course-management/data-access/course-management.dto';
import { DayOfWeekPipe } from '@pages/course-management/pipes/day-of-week.pipe';
import { Time12hrPipe } from '@pages/course-management/pipes/time-12-hr.pipe';
import { LectureModalService } from '@pages/course-management/utils/lecture-modal.service';
import { ICourseData } from '@shared/interfaces/course.interface';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { TranslocoDirective } from '@jsverse/transloco';
import { CourseManagement } from '@pages/course-management/data-access/course-management.interface';

@Component({
  selector: 'app-lecture-table-cell',
  templateUrl: './lecture-table-cell.component.html',
  standalone: true,
  imports: [DayOfWeekPipe, Time12hrPipe, TranslocoDirective],
  styles: [':host { display: block; width: 100%; min-width: 0; }'],
})
export class LectureTableCellComponent implements ICellRendererAngularComp {
  lectures: LectureDTO[];
  course: CourseManagement;
  private readonly lectureModalService = inject(LectureModalService);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.lectures = this.sort(params.data?.lectures) || [];
    this.course = params.data.course;
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
        return 0;
      }
    });
  }

  onViewLecture(event: MouseEvent, lecture: LectureDTO) {
    event.stopPropagation();
    this.lectureModalService.onViewLecture(this.course, lecture);
  }
}
