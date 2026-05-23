import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { CMSCourseContentService } from '../data-access/cms/cms-course-content.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { PageTitleService } from '@layout/page-title.service';
import { CourseListService } from '../data-access/courses-list.service';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { LayoutService } from '@layout/layout.service';

export const CMSCourseContentResolver: ResolveFn<any> = (route, _state) => {
  const academicYearsScopeService = inject(AcademicYearsScopeService);
  const academicYearId = academicYearsScopeService.selectedAcademicYear()?.id;
  const semesterId = academicYearsScopeService.selectedSemester()?.id;

  const pageTitleService = inject(PageTitleService);
  const breadcrumbService = inject(BreadcrumbService);
  const layout = inject(LayoutService);
  const courseListService = inject(CourseListService);

  const subject = courseListService
    .coursesList()
    .find((c) => c.course.id === +route.params['courseId']);

  const subjectTitle = subject?.subject.displayName;

  if (subjectTitle) {
    pageTitleService.setAliasValue(subjectTitle);
    breadcrumbService.set('@subjectName', subjectTitle);
  }

  if (subject) {
    layout.updateLevelName(subject.level.displayName);
  }

  return inject(CMSCourseContentService).getCourseTopics({
    courseId: route.params['courseId'],
    academicYearId: academicYearId,
    semesterId: semesterId ? +semesterId : undefined,
  });
};
