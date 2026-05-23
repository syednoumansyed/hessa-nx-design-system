import { Routes } from '@angular/router';
import {
  rbacGuard,
  rbacSomeGuard,
} from '@shared/role-bace-acces-controller/rbac.guard';
import { ContentCourseListResolver } from './resolvers/content-course-list.resolver';
import { AssignmentGuard } from '@pages/course-management/guards/assignment.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { LMSAssignmentQuestionsResolver } from './resolvers/lms-assignment-questions.resolver';
import { LMSAssignmentService } from './data-access/lms/lms-assignment.service';
import { LMSCourseContentService } from './data-access/lms/lms-course-content.service';
import { LMSCourseContentResolver } from './resolvers/lms-course-content.resolver';
import { LMSExamService } from '@pages/course-management/data-access/lms-exam.service';
import { CourseListService } from './data-access/courses-list.service';

// For students and guardians
export const MyCoursesRoutes: Routes = [
  {
    path: '',
    data: {
      isLMS: true,
      isCMS: false,
      breadcrumb: 'global.my_courses.title',
    },
    resolve: {
      courses: ContentCourseListResolver,
    },
    canActivate: [
      rbacGuard(RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_STUDENTS),
    ],
    canActivateChild: [
      rbacGuard(RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_STUDENTS),
    ],
    children: [
      // my courses list
      {
        path: '',
        loadComponent: () =>
          import('./pages/courses-list/courses-list.page').then(
            (c) => c.CoursesListPage,
          ),
      },
      // course details
      {
        path: ':courseId/topics',
        data: {
          breadcrumb: 'global.course_details.title',
          pageTitle: {
            alias: 'subjectName',
          },
        },
        resolve: {
          content: LMSCourseContentResolver,
        },
        providers: [LMSCourseContentService],
        children: [
          {
            path: '',
            data: {
              pageTitle: {
                alias: 'subjectName',
              },
            },
            canActivate: [
              rbacGuard(
                RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSE_CONTENT_STUDENTS,
              ),
            ],
            loadComponent: () =>
              import('./pages/lms-course-topics/lms-course-topics.page').then(
                (m) => m.LMSCourseTopicsPage,
              ),
          },
          // assignment details
          {
            path: 'assignments/:assignmentId',
            data: {
              breadcrumb: { skip: true },
              pageTitle: {
                alias: 'subjectName',
              },
            },
            providers: [LMSAssignmentService],
            // assignment is resolved in the guard as guards run before resolver anyway
            canActivate: [
              AssignmentGuard,
              rbacGuard(
                RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSE_CONTENT_STUDENTS,
              ),
            ],
            children: [
              {
                path: '',
                data: {
                  breadcrumb: { skip: true },
                },
                loadComponent: () =>
                  import(
                    './pages/assignment-details/assignment-details.page'
                  ).then((m) => m.AssignmentDetailsPage),
              },
              // view,deliver assignment
              {
                path: 'questions',
                data: {
                  breadcrumb: { skip: true },
                },
                resolve: { questions: LMSAssignmentQuestionsResolver },
                canActivate: [
                  rbacSomeGuard([
                    RESOURCE_PERMISSION.COURSE_CONTENT.READ
                      .VIEW_DELIVERED_ASSIGNMENT,
                    RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.START_ASSIGNMENT,
                  ]),
                ],
                loadComponent: () =>
                  import(
                    './pages/assignment-questions/assignment-questions.page'
                  ).then((m) => m.AssignmentQuestionsPage),
              },
            ],
          },
          // exam details and deliver
          {
            path: 'exams/:examId',
            providers: [LMSExamService],
            children: [
              {
                path: '',
                data: {
                  breadcrumb: { skip: true },
                  pageTitle: {
                    alias: 'subjectName',
                  },
                },
                loadComponent: () =>
                  import('./pages/exam-details/exam-details.page').then(
                    (m) => m.ExamDetailsPage,
                  ),
              },
              // view exam submission
              {
                path: 'questions',
                data: { breadcrumb: '' },
                resolve: {},
                canActivate: [
                  rbacSomeGuard([
                    RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.START_EXAM,
                  ]),
                ],
                loadComponent: () =>
                  import('./pages/deliver-exam/deliver-exam.page').then(
                    (m) => m.DeliverExamPage,
                  ),
              },
              {
                path: 'result',
                data: { breadcrumb: '' },
                resolve: {},
                canActivate: [
                  rbacSomeGuard([
                    RESOURCE_PERMISSION.COURSE_CONTENT.READ.VIEW_DELIVERED_EXAM,
                  ]),
                ],
                loadComponent: () =>
                  import('./pages/exam-result/exam-result.page').then(
                    (m) => m.ExamResultPage,
                  ),
              },
            ],
          },
        ],
      },
    ],
    providers: [CourseListService],
  },
];
