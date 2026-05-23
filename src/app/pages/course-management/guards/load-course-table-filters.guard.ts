import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { from, map, catchError, of } from 'rxjs';

export const loadCourseTableFiltersGuard: CanActivateFn = () => {
  const courseService = inject(CourseManagementService);
  return from(courseService.loadSubjectAndTeacherData()).pipe(
    map(() => true),
    catchError(() => of(true)),
  );
};
