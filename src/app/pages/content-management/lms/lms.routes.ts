import { Routes } from '@angular/router';
import { rbacGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

// For students and guardians
export const LMSRoutes: Routes = [
  {
    path: '',
    data: {
      isLMS: true,
      isCMS: false,
      breadcrumb: 'global.courses.title',
    },
    canActivate: [
      rbacGuard(RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_STUDENTS),
    ],
    canActivateChild: [
      rbacGuard(RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_STUDENTS),
    ],
    children: [
      {
        path: '',
        redirectTo: 'courses',
        pathMatch: 'full',
      },
      {
        data: {
          showChildSelector: true,
        },
        path: 'courses',
        loadComponent: () =>
          import('./course-list/course-list.page').then(
            (c) => c.CourseListPage,
          ),
      },
      {
        data: {
          breadcrumb: 'global.course_details.title',
        },
        path: 'course/:courseId',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./course-details/course-details.page').then(
                (c) => c.CourseDetailsPage,
              ),
          },
          {
            path: 'assignment/:assignmentId',
            loadComponent: () =>
              import(
                './assessment/pages/assessment-assignment-detail/assessment-assignment-detail.page'
              ).then((c) => c.AssessmentAssignmentDetailPage),
            data: {
              assessmentType: 'assignment',
              breadcrumb: 'content_management.assignment.title',
              backgroundImage: 'bg-assessment-image',
            },
          },
          {
            path: 'exam/:examId',
            loadComponent: () =>
              import(
                './assessment/pages/assessment-exam-detail/assessment-exam-detail.page'
              ).then((c) => c.AssessmentExamDetailPage),
            data: {
              assessmentType: 'exam',
              breadcrumb: 'content_management.exam.title',
              backgroundImage: 'bg-assessment-image',
            },
          },
        ],
      },
    ],
  },
];
