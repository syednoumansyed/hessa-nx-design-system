import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { CourseListService } from '../data-access/courses-list.service';

export const ContentCourseListResolver: ResolveFn<any> = (route, _state) => {
  return inject(CourseListService).populateCourses({}, route.data['isCMS']);
};
