import { computed, inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { LMSCourseContentService } from '../data-access/lms/lms-course-content.service';
import { PageTitleService } from '@layout/page-title.service';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { CourseListService } from '../data-access/courses-list.service';
import { LayoutService } from '@layout/layout.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';

export const LMSCourseContentResolver: ResolveFn<any> = (route, _state) => {
  const academicYearId = inject(
    AcademicYearsScopeService,
  ).selectedAcademicYear()?.id;

  const studentScope = inject(StudentSelectionScopeService);
  const studentId = computed(() => {
    return studentScope.selectedStudent()?.id ?? null;
  });
  const semesterId = inject(AcademicYearsScopeService).selectedSemester()?.id;
  const scopeSelectionService = inject(StudentSelectionScopeService);
  const pageTitleService = inject(PageTitleService);
  const breadcrumbService = inject(BreadcrumbService);
  const layout = inject(LayoutService);
  const courseListService = inject(CourseListService);

  const subject = courseListService
    .coursesList()
    .find((c) => c.course.id === +route.params['courseId']);

  const subjectTitle = subject?.subject?.displayName;

  if (subjectTitle) {
    pageTitleService.setAliasValue(subjectTitle);
    breadcrumbService.set('@subjectName', subjectTitle);
  }

  if (subject) {
    layout.updateClassName(
      scopeSelectionService.selectedStudent()?.school?.class?.displayName ??
        null,
    );
    layout.updateLevelName(subject.level.displayName);
  }

  return inject(LMSCourseContentService).getCourseTopics({
    courseId: route.params['courseId'],
    academicYearId,
    semesterId: semesterId ? +semesterId : undefined,
    studentId: studentId() ?? undefined,
  });
};
