import { Routes } from '@angular/router';
import {
  rbacGuard,
  rbacSomeGuard,
} from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ContentCourseListResolver } from './resolvers/content-course-list.resolver';
import { CMSCourseContentService } from './data-access/cms/cms-course-content.service';
import { CMSCourseContentResolver } from './resolvers/cms-course-content.resolver';
import { CourseListService } from './data-access/courses-list.service';
import { AddTopicGuard } from './guards/add-topic.guard';

// For teachers and admins
export const CourseManagementRoutes: Routes = [
  {
    path: '',
    data: {
      isLMS: false,
      isCMS: true,
    },
    children: [
      // course management home page
      {
        path: '',
        canActivate: [
          rbacSomeGuard([
            RESOURCE_PERMISSION.course.courseListView,
            RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_TEACHERS,
          ]),
        ],
        loadComponent: () =>
          import('./course-management-home.page').then(
            (c) => c.CourseManagementHomePage,
          ),
      },
      // course management
      {
        path: 'courses',
        data: {
          breadcrumb: 'global.courses.title',
          pageTitle: 'global.courses.title',
          fullWidth: true,
        },
        loadComponent: () =>
          import('./pages/course-management/course-management.page').then(
            (c) => c.CourseManagementPage,
          ),
      },
      // content base route
      {
        path: 'content/courses',
        data: {
          breadcrumb: 'global.courses.title',
          pageTitle: 'global.courses.title',
        },
        resolve: {
          courses: ContentCourseListResolver,
        },
        children: [
          // content courses list
          {
            path: '',
            canActivate: [
              rbacGuard(
                RESOURCE_PERMISSION.COURSE_CONTENT.READ.COURSES_LIST_TEACHERS,
              ),
            ],
            loadComponent: () =>
              import('./pages/courses-list/courses-list.page').then(
                (c) => c.CoursesListPage,
              ),
          },
          {
            path: ':courseId/topics',
            data: {
              breadcrumb: { alias: 'subjectName' },
              pageTitle: {
                alias: 'subjectName',
              },
            },
            resolve: {
              content: CMSCourseContentResolver,
            },
            providers: [CMSCourseContentService],
            children: [
              // course details
              {
                path: '',
                data: {
                  pageTitle: {
                    alias: 'subjectName',
                  },
                },
                canActivate: [
                  rbacGuard(
                    RESOURCE_PERMISSION.COURSE_CONTENT.READ
                      .COURSE_CONTENT_TEACHERS,
                  ),
                ],
                loadComponent: () =>
                  import('./pages/cms-course-topics/cms-course-topics.page').then(
                    (m) => m.CMSCourseTopicsPage,
                  ),
              },
              // add topic
              {
                path: 'add',
                data: {
                  breadcrumb: { skip: true },
                  pageTitle: {
                    alias: 'subjectName',
                  },
                },
                canActivate: [
                  rbacGuard(RESOURCE_PERMISSION.COURSE_CONTENT.CREATE.TOPIC),
                  AddTopicGuard,
                ],
                loadComponent: () =>
                  import('./pages/add-topic/add-topic.page').then(
                    (m) => m.AddTopicPage,
                  ),
              },
              // Topic details
              {
                path: ':topicId',
                loadComponent: () =>
                  import('./pages/cms-course-topic/cms-course-topic.page').then(
                    (m) => m.CMSCourseTopicsPage,
                  ),
              },
              //  view assignment details
              // add asiignment
              {
                path: ':topicId/assignments/add',
                loadComponent: () =>
                  import('./pages/assigments/assignment-form/assignment-form.page').then(
                    (m) => m.AssignmentFormPage,
                  ),
              },
              {
                path: ':topicId/assignments/:assignmentId',
                children: [
                  {
                    path: '',
                    loadComponent: () =>
                      import('./pages/assigments/assignment-form/assignment-form.page').then(
                        (m) => m.AssignmentFormPage,
                      ),
                  },
                  {
                    path: 'students',
                    children: [
                      {
                        path: '',
                        loadComponent: () =>
                          import('../my-courses/pages/assignment-progress/assignment-progress.page').then(
                            (m) => m.AssignmentProgressPage,
                          ),
                      },
                      {
                        path: ':studentId/assignment-result',
                        loadComponent: () =>
                          import('../my-courses/pages/cms-assignment-result/cms-assignment-result.page').then(
                            (c) => c.CmsAssignmentResultPage,
                          ),
                      },
                    ],
                  },
                ],
              },
              // add exam
              {
                path: ':topicId/exams/add',
                canActivate: [
                  rbacGuard(RESOURCE_PERMISSION.COURSE_CONTENT.CREATE.EXAM),
                ],
                loadComponent: () =>
                  import('./pages/add-exam/add-exam.page').then(
                    (m) => m.AddExamPage,
                  ),
              },
              // view exam details
              {
                path: ':topicId/exams/:examId',
                children: [
                  {
                    path: '',
                    loadComponent: () =>
                      import('./pages/add-exam/add-exam.page').then(
                        (m) => m.AddExamPage,
                      ),
                    canActivate: [
                      rbacSomeGuard([
                        RESOURCE_PERMISSION.COURSE_CONTENT.UPDATE.EXAM,
                        RESOURCE_PERMISSION.COURSE_CONTENT.CREATE.QUESTION,
                      ]),
                    ],
                  },
                  {
                    path: 'students',
                    children: [
                      {
                        path: '',
                        loadComponent: () =>
                          import('../my-courses/pages/exam-progress/exam-progress.page').then(
                            (m) => m.ExamProgressPage,
                          ),
                      },
                      {
                        path: ':studentId/exam-result',
                        loadComponent: () =>
                          import('./pages/cms-exam-result/cms-exam-result.page').then(
                            (c) => c.CmsExamResultPage,
                          ),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        providers: [CourseListService],
      },
    ],
  },
];
