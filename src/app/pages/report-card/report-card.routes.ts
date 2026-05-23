import { Routes } from '@angular/router';
import { settingPermissions } from '@pages/settings/settings.page';
import {
  rbacGuard,
  rbacSomeGuard,
} from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { gradeManagementPermissions } from './report-card-landing.page';
import { canFormDeactivateGuard } from '@shared/guards/form-can-deactivate.guard';

export const ReportCardRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        canActivate: [rbacSomeGuard(gradeManagementPermissions())],
        loadComponent: () =>
          import('./report-card-landing.page').then(
            (m) => m.ReportCardLandingPage,
          ),
      },
      {
        path: 'grade-scale',
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.GRADE_MANAGEMENT.GRADE_SCALE.READ),
        ],
        data: {
          breadcrumb: 'grade_management.manage_grade_scale.title',
          noMobilePadding: true,
        },
        loadComponent: () =>
          import('./configuration/pages/grade-scale/grade-scale.page').then(
            (m) => m.GradeScalePage,
          ),
      },
      {
        path: 'list-courses',
        canActivate: [
          rbacGuard(
            RESOURCE_PERMISSION.GRADE_MANAGEMENT.CONFIGURATION.MANAGE_GRADES,
          ),
        ],
        data: {
          breadcrumb: 'grade_management.report_card_entries.title',
          noMobilePadding: true,
        },
        loadComponent: () =>
          import(
            '@pages/report-card/entry-management/pages/grade-course-list/grade-course-list.page'
          ).then((m) => m.GradeCourseListPage),
      },
      {
        path: 'mark-report-card/:reportCardId/:levelId/:classId/:subjectId',
        canActivate: [
          rbacGuard(
            RESOURCE_PERMISSION.GRADE_MANAGEMENT.TEACHER_MARKS.CREATE_MARK,
          ),
        ],
        data: {
          breadcrumb: 'grade_management.report_card_entries.title',
          noMobilePadding: true,
        },
        canDeactivate: [canFormDeactivateGuard],
        loadComponent: () =>
          import(
            '@pages/report-card/entry-management/pages/mark-report-card/mark-report-card.page'
          ).then((m) => m.MarkReportCardPage),
      },
      {
        path: 'manage-report-card',
        canActivate: [
          rbacGuard(
            RESOURCE_PERMISSION.GRADE_MANAGEMENT.CONFIGURATION
              .MANAGE_REPORT_CARDS,
          ),
        ],
        data: {
          breadcrumb: 'global.manage_report_card.title',
          pageTitle: 'global.manage_report_card.title',
        },
        children: [
          {
            path: '',
            data: {
              noMobilePadding: true,
            },
            loadComponent: () =>
              import(
                './configuration/pages/report-cards/report-cards.page'
              ).then((m) => m.ReportCardsPage),
          },
          {
            path: 'add-report-card',
            canActivate: [
              rbacGuard(
                RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.CREATE,
              ),
            ],
            data: {
              breadcrumb: 'grade_management.add_report_card.title',
            },
            loadComponent: () =>
              import(
                './configuration/pages/report-card-form/report-card-form.page'
              ).then((m) => m.ReportCardFormPage),
          },
          {
            path: ':reportCardId',
            canActivate: [
              rbacGuard(
                RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.UPDATE,
              ),
            ],
            data: {
              breadcrumb: 'grade_management.view_report_card.title',
            },
            loadComponent: () =>
              import(
                './configuration/pages/report-card-form/report-card-form.page'
              ).then((m) => m.ReportCardFormPage),
          },
        ],
      },
      {
        path: 'process-report-cards',
        canActivate: [
          rbacGuard(
            RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.LIST_CARDS,
          ),
        ],
        data: {
          breadcrumb: 'global.report_cards.tilte',
          noMobilePadding: true,
        },
        children: [
          {
            path: '',
            data: {
              fullWidth: true,
            },
            loadComponent: () =>
              import(
                './processing/pages/report-card-list/report-card-list.page'
              ).then((m) => m.ReportCardListPage),
          },
          {
            path: ':reportCardId/class/:classId',
            canActivate: [
              rbacGuard(RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.VIEW),
            ],
            data: {
              breadcrumb: 'grade_management.view_report_card.title',
            },
            children: [
              {
                path: '',
                loadComponent: () =>
                  import(
                    './processing/pages/student-report-card-list/student-report-card-list.page'
                  ).then((m) => m.StudentReportCardsList),
              },
              {
                path: 'review',
                canActivate: [
                  rbacGuard(
                    RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.VIEW,
                  ),
                ],
                data: {
                  breadcrumb: 'grade_management.report_card.title',
                  pageTitle: 'grade_management.report_card.title',
                },
                loadComponent: () =>
                  import(
                    './processing/pages/student-report-detail/student-report-review.page'
                  ).then((m) => m.StudentReportReviewPage),
              },
            ],
          },
        ],
      },
    ],
  },
];
