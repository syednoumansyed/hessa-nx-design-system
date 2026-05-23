import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { CourseTableColDefService } from '@pages/course-management/data-access/course-col-def.service';
import { tap } from 'rxjs';

export const courseFilterDataResolver: ResolveFn<any> = (_route, _state) => {
  const courseService = inject(CourseManagementService);
  const courseTableColDefService = inject(CourseTableColDefService);

  return courseService.loadSubjectAndTeacherData();
};
