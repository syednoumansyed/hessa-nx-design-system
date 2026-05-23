import { Routes } from '@angular/router';
import { AuthGuard, RedirectFromLoginPageGuard } from '@auth/auth.guard';
import {
  rbacGuard,
  rbacSomeGuard,
} from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { permissionsResolver } from '@core/resolvers/permissions.resolver';
import { academicYearResolver } from '@core/resolvers/academic-year.resolver';
import { StudentsScopeResolver } from '@core/resolvers/students-scope.resolver';
import { MobileMenuGuard } from '@core/guards/mobile-menu.guard';
import { UnauthorizedPage } from '@pages/unauthorized/unauthorized.page';
import { redirectIfSchoolStructureEmptyGuard } from '@shared/guards/redirect-if-school-structure-empty.guard';
import { StorageCleanupGuard } from '@core/guards/storage-cleanup.guard';
import { DsLayoutComponent } from './ds-layout/components/layout/layout.component';
import { authRoutes } from '@pages/login/login.routes';
import { chatGuard, chatDeactivateGuard } from '@pages/chat/chat.guard';
import { loadCourseTableFiltersGuard } from '@pages/course-management/guards/load-course-table-filters.guard';

export const routes: Routes = [
  {
    path: 'pages/support',
    title: 'Support',
    loadComponent: () =>
      import('./pages/support/support.component').then(
        (p) => p.SupportComponent,
      ),
  },
  {
    path: 'pages/terms-and-conditions',
    title: 'Terms & Conditions',
    loadComponent: () =>
      import('./pages/terms-conditions/terms-conditions.component').then(
        (p) => p.TermsConditionsComponent,
      ),
  },
  {
    path: 'pages/privacy-policy',
    title: 'Privacy policy',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy.component').then(
        (p) => p.PrivacyPolicyComponent,
      ),
  },
  {
    path: 'app-update',
    loadComponent: () =>
      import('./pages/app-update/app-update.page').then((m) => m.AppUpdatePage),
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./pages/maintenance/maintenance.page').then(
        (m) => m.MaintenancePage,
      ),
  },
  {
    path: 'login',
    canActivate: [StorageCleanupGuard, RedirectFromLoginPageGuard],
    loadChildren: () =>
      import('./pages/login/login.routes').then((mod) => mod.authRoutes),
  },
  // Authenticated users only
  {
    path: '',
    component: DsLayoutComponent,
    // component: LayoutComponent,
    resolve: {
      Permissions: permissionsResolver,
      academicYears: academicYearResolver,
      guardianStudents: StudentsScopeResolver,
    },
    canActivate: [
      StorageCleanupGuard,
      AuthGuard,
      redirectIfSchoolStructureEmptyGuard,
    ],
    data: { breadcrumb: 'global.home.title' },
    children: [
      {
        path: 'home',
        data: { pageTitle: 'global.home.title', showChildSelector: true },
        loadComponent: () =>
          import('./pages/announcements/pages/view-posts/view-posts.component').then(
            (m) => m.ViewPostsComponent,
          ),
      },
      {
        path: 'notifications',
        data: {
          breadcrumb: 'notification.title',
          pageTitle: 'notification.title',
        },
        loadComponent: () =>
          import('./pages/notification/notification.page').then(
            (m) => m.NotificationPage,
          ),
      },
      {
        path: 'notifications/settings',
        data: {
          breadcrumb: 'notification.settings.title',
          pageTitle: 'notification.settings.title',
        },
        loadComponent: () =>
          import('./pages/notification/notification-settings/notification-settings.page').then(
            (m) => m.NotificationSettingsPage,
          ),
      },

      {
        path: 'user-management',
        data: {
          breadcrumb: 'global.user_management.title',
          pageTitle: 'global.user_management.title',
        },
        loadChildren: () =>
          import('./pages/user-management/user-management.routes').then(
            (m) => m.UserManagementRoutes,
          ),
      },
      {
        path: 'school-structure',
        data: {
          breadcrumb: 'global.school_structure.title',
          pageTitle: 'global.school_structure.title',
        },
        canActivate: [rbacGuard(RESOURCE_PERMISSION.company.viewCompanyList)],
        loadChildren: () =>
          import('./pages/school-structure/school-structure.routes').then(
            (m) => m.SchoolStructureRoutes,
          ),
      },
      {
        path: 'academic-year',
        data: {
          breadcrumb: 'academic_enrollment.academic_years_semesters.title',
          pageTitle: 'academic_enrollment.academic_years_semesters.title',
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.academicYear.academicYearListView),
        ],
        loadChildren: () =>
          import('./pages/academic-year/academic-year.routes').then(
            (m) => m.AcademicRoutes,
          ),
      },
      {
        path: 'course-management',
        data: {
          breadcrumb: 'global.course_management.title',
          pageTitle: 'global.course_management.title',
        },
        canActivate: [loadCourseTableFiltersGuard],
        loadChildren: () =>
          import('./pages/course-management/course-management.routes').then(
            (m) => m.CourseManagementRoutes,
          ),
      },
      // TODO: Remove this when the Redesign LMS is fully integrated
      {
        path: 'my-courses',
        data: {
          breadcrumb: 'global.my_courses.title',
          pageTitle: 'global.my_courses.title',
        },
        loadChildren: () =>
          import('./pages/course-management/my-courses.routes').then(
            (m) => m.MyCoursesRoutes,
          ),
      },
      {
        path: 'lms',
        data: {
          breadcrumb: 'global.courses.title',
          pageTitle: 'global.courses.title',
        },
        loadChildren: () =>
          import('./pages/content-management/lms/lms.routes').then(
            (m) => m.LMSRoutes,
          ),
      },
      {
        path: 'announcements',
        data: {
          breadcrumb: 'global.announcements.title',
          pageTitle: 'global.announcements.title',
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.announcement.announcementListView),
        ],
        loadChildren: () =>
          import('./pages/announcements/announcements.routes').then(
            (m) => m.AnnouncementsRoutes,
          ),
      },
      {
        path: 'support-tickets',
        data: {
          breadcrumb: 'global.support_ticket.title',
          pageTitle: 'global.support_ticket.title',
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.supportTicket.viewMyAssignedTickets),
        ],
        loadChildren: () =>
          import('./pages/support-tickets/support-tickets.routes').then(
            (m) => m.SupportTicketsRoutes,
          ),
      },
      {
        path: 'support-hub',
        canActivate: [
          rbacSomeGuard([
            RESOURCE_PERMISSION.supportTicket.viewMyAssignedTickets,
            RESOURCE_PERMISSION.supportTicket.viewMyInitiatedTickets,
          ]),
        ],
        data: {
          breadcrumb: 'global.support_ticket.title',
          pageTitle: 'global.support_ticket.title',
        },
        loadChildren: () =>
          import('./pages/support-hub/support-hub.routes').then(
            (m) => m.SupportHubRoutes,
          ),
      },
      {
        path: 'user-feed',
        data: {
          breadcrumb: 'global.announcements.title',
          pageTitle: 'global.announcements.title',
        },
        loadComponent: () =>
          import('./pages/announcements/pages/view-posts/view-posts.component').then(
            (m) => m.ViewPostsComponent,
          ),
      },
      {
        path: 'chat',
        data: {
          pageTitle: 'global.chats.title',
          fullWidth: true,
          breadcrumb: 'global.chats.title',
          // hideHeaderMobile: true, //use this to control visibility of the header on any route
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.chat.chatListView),
          chatGuard(),
        ],
        canDeactivate: [chatDeactivateGuard()],
        loadComponent: () =>
          import('./pages/chat/chat.component').then((m) => m.ChatComponent),
      },
      {
        path: 'settings',
        data: {
          breadcrumb: 'global.settings.title',
          pageTitle: 'global.settings.title',
        },
        loadChildren: () =>
          import('./pages/settings/settings.routes').then(
            (m) => m.SettingsRoutes,
          ),
      },
      {
        path: 'help-center',
        data: {
          breadcrumb: 'global.help_center.title',
          pageTitle: 'global.help_center.title',
        },
        loadChildren: () =>
          import('./pages/help-center/help-center.routes').then(
            (m) => m.HelpCenterRoutes,
          ),
      },
      {
        path: 'attendance',
        data: {
          breadcrumb: 'global.attendance.title',
          pageTitle: 'global.attendance.title',
          showChildSelector: true,
        },
        loadChildren: () =>
          import('./pages/attendance/attendance.routes').then(
            (m) => m.AttendanceRoutes,
          ),
        canActivate: [
          rbacSomeGuard([
            RESOURCE_PERMISSION.attendance.LIST,
            RESOURCE_PERMISSION.attendance.DETAIL,
            RESOURCE_PERMISSION.attendance.CREATE,
            RESOURCE_PERMISSION.attendance.UPDATE,
            RESOURCE_PERMISSION.attendance.CONFIRM_ABSENCE,
          ]),
        ],
      },
      {
        path: 'reports',
        data: {
          breadcrumb: 'global.reports.title',
          pageTitle: 'global.reports.title',
          title: 'global.reports.title',
        },
        loadComponent: () =>
          import('./pages/reports/reports.page').then((m) => m.ReportsPage),
        canActivate: [
          rbacSomeGuard([...Object.values(RESOURCE_PERMISSION.REPORTS.READ)]),
        ],
      },
      {
        path: 'vcr',
        data: {
          fullWidth: true, //To set any route as full width specifically for tables just pass this as true
          breadcrumb: 'global.virtual_classrooms.title',
          pageTitle: 'global.virtual_classrooms.title',
          title: 'global.virtual_classrooms.title',
          showChildSelector: true,
        },
        loadChildren: () =>
          import('./pages/vcr/vcr.routes').then((m) => m.VCRRoutes),
      },
      {
        path: 'journal',
        data: {
          breadcrumb: 'journals.journals.title',
          pageTitle: 'journals.journals.title',
          title: 'Journal',
        },
        loadChildren: () =>
          import('./pages/journal/journal.routes').then((m) => m.JournalRoutes),
      },
      {
        path: 'learning-outcomes',
        data: {
          breadcrumb: 'learning_outcome.select_level_subject.title',
          pageTitle: 'resource.learning_outcome',
        },
        loadChildren: () =>
          import('./pages/learning-outcomes/learning-outcomes.routes').then(
            (m) => m.LearningOutcomesRoutes,
          ),
      },
      {
        path: 'grade-management',
        data: {
          breadcrumb: 'course_management.main_content.grade_management_header',
          pageTitle: 'course_management.main_content.grade_management_header',
          title: 'course_management.main_content.grade_management_header',
          showChildSelector: true,
        },
        loadChildren: () =>
          import('./pages/report-card/report-card.routes').then(
            (m) => m.ReportCardRoutes,
          ),
      },
      {
        path: 'report-card',
        data: {
          breadcrumb: 'global.report_card.title',
          pageTitle: 'global.report_card.title',
          title: 'global.report_card.title',
          showChildSelector: true,
        },
        loadComponent: () =>
          import('./pages/report-card/view/pages/students-report-card/students-report-card.page').then(
            (m) => m.StudentsReportCardPage,
          ),
      },
      {
        path: 'pickup',
        data: {
          breadcrumb: 'dismissal.pickup.btn',
          pageTitle: 'dismissal.pickup.btn',
        },
        loadChildren: () =>
          import('./pages/pickup/pickup.routes').then((m) => m.PickupRoutes),
      },
      {
        path: 'no-location-permission',
        data: {
          breadcrumb: 'dismissal.pickup.btn',
          pageTitle: 'dismissal.pickup.btn',
        },
        loadComponent: () =>
          import('./pages/pickup/components/location-permission/location-permission.component').then(
            (m) => m.LocationPermissionComponent,
          ),
      },
      {
        path: 'menu',
        canActivate: [MobileMenuGuard],
        data: {
          showChildSelector: true,
        },
        loadComponent: () =>
          import('./ds-layout/components/mobile-menu/mobile-menu.page').then(
            (m) => m.MobileMenuPage,
          ),
      },
      {
        path: 'profile-settings',
        data: {
          pageTitle: '',
          breadcrumb: '',
        },
        canActivate: [MobileMenuGuard],
        loadComponent: () =>
          import('./ds-layout/profile-settings/profile-settings.page').then(
            (m) => m.ProfileSettingsPage,
          ),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'design-system-demo',
        data: {
          noMobilePadding: true,
        },
        loadChildren: () =>
          import('./pages/design-system-demo/design-system-demo.routes').then(
            (m) => m.DesignSystemDemoRoutes,
          ),
      },
      {
        path: 'responsive-table-demo',
        data: {
          noMobilePadding: true,
          fullWidth: true,
        },
        loadComponent: () =>
          import('./pages/responsive-table-demo/responsive-table-demo.page').then(
            (m) => m.ResponsiveTableDemoPage,
          ),
      },
      {
        path: 'course-detail',
        loadComponent: () =>
          import('./pages/content-management/lms/course-details/course-details.page').then(
            (m) => m.CourseDetailsPage,
          ),
      },
      {
        path: 'profile',
        data: {
          breadcrumb: 'global.profile.title',
        },
        children: [
          {
            path: '',
            data: {
              pageTitle: 'global.profile.title',
            },
            loadComponent: () =>
              import('./pages/profile/profile.page').then((m) => m.ProfilePage),
          },
          {
            path: 'personnel',
            data: {
              pageTitle: 'profile.personal_details.txt',
              breadcrumb: 'profile.personal_details.txt',
            },
            loadComponent: () =>
              import('./pages/profile/profile.page').then((m) => m.ProfilePage),
          },
          {
            path: 'identification',
            data: {
              pageTitle: 'profile.identification_details.txt',
              breadcrumb: 'profile.identification_details.txt',
            },
            loadComponent: () =>
              import('./pages/profile/profile.page').then((m) => m.ProfilePage),
          },
          {
            path: 'supplementary',
            data: {
              pageTitle: 'profile.associated_organisations.txt',
              breadcrumb: 'profile.associated_organisations.txt',
            },
            loadComponent: () =>
              import('./pages/profile/profile.page').then((m) => m.ProfilePage),
          },
          {
            path: 'academic',
            data: {
              pageTitle: 'profile.academic_details.txt',
              breadcrumb: 'profile.academic_details.txt',
            },
            loadComponent: () =>
              import('./pages/profile/profile.page').then((m) => m.ProfilePage),
          },
          {
            path: 'subjects',
            data: {
              pageTitle: 'profile.associated_subjects.txt',
              breadcrumb: 'profile.associated_subjects.txt',
            },
            loadComponent: () =>
              import('./pages/profile/profile.page').then((m) => m.ProfilePage),
          },
          {
            path: 'change-password',
            data: {
              pageTitle: 'profile.change_password.title',
              breadcrumb: 'profile.change_password.title',
            },
            loadComponent: () =>
              import('./pages/profile/pages/change-password/change-password.page').then(
                (m) => m.ChangePasswordPage,
              ),
          },
          {
            path: 'change-number',
            data: {
              pageTitle: 'profile.change_number.title',
              breadcrumb: 'profile.change_number.title',
            },
            loadComponent: () =>
              import('./pages/profile/pages/change-number/change-number.page').then(
                (m) => m.ChangeNumberPage,
              ),
          },
          {
            path: 'student/:studentId',
            data: {
              breadcrumb: 'profile.student_title.txt',
            },
            children: [
              {
                path: '',
                data: {
                  pageTitle: 'profile.student_title.txt',
                },
                loadComponent: () =>
                  import('./pages/profile/profile.page').then(
                    (m) => m.ProfilePage,
                  ),
              },
              {
                path: 'personnel',
                data: {
                  pageTitle: 'profile.personal_details.txt',
                  breadcrumb: 'profile.personal_details.txt',
                },
                loadComponent: () =>
                  import('./pages/profile/profile.page').then(
                    (m) => m.ProfilePage,
                  ),
              },
              {
                path: 'identification',
                data: {
                  pageTitle: 'profile.identification_details.txt',
                  breadcrumb: 'profile.identification_details.txt',
                },
                loadComponent: () =>
                  import('./pages/profile/profile.page').then(
                    (m) => m.ProfilePage,
                  ),
              },
              {
                path: 'supplementary',
                data: {
                  pageTitle: 'profile.academic_details.txt',
                  breadcrumb: 'profile.academic_details.txt',
                },
                loadComponent: () =>
                  import('./pages/profile/profile.page').then(
                    (m) => m.ProfilePage,
                  ),
              },
              {
                path: 'academic',
                data: {
                  pageTitle: 'profile.academic_details.txt',
                  breadcrumb: 'profile.academic_details.txt',
                },
                loadComponent: () =>
                  import('./pages/profile/profile.page').then(
                    (m) => m.ProfilePage,
                  ),
              },
              {
                path: 'change-password',
                data: {
                  pageTitle: 'profile.change_password.title',
                  breadcrumb: 'profile.change_password.title',
                },
                loadComponent: () =>
                  import('./pages/profile/pages/change-password/change-password.page').then(
                    (m) => m.ChangePasswordPage,
                  ),
              },
              {
                path: 'change-number',
                data: {
                  pageTitle: 'profile.change_number.title',
                  breadcrumb: 'profile.change_number.title',
                },
                loadComponent: () =>
                  import('./pages/profile/pages/change-number/change-number.page').then(
                    (m) => m.ChangeNumberPage,
                  ),
              },
            ],
          },
        ],
      },
      { path: 'unauthorized', component: UnauthorizedPage },
      {
        path: '404',
        loadComponent: () =>
          import('./pages/page-not-found/page-not-found.page').then(
            (m) => m.PageNotFoundPage,
          ),
      },
      { path: '**', redirectTo: '/404', pathMatch: 'full' },
    ],
  },
];
