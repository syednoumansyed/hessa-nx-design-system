import { Routes } from '@angular/router';
import {
  rbacGuard,
  rbacSomeGuard,
} from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { settingPermissions } from './settings.page';
import { TimePeriodsColDefService } from '@pages/time-periods/time-periods-col-def.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';

export const SettingsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        canActivate: [rbacSomeGuard(settingPermissions())],
        loadComponent: () =>
          import('./settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'attendance-setting',
        data: {
          breadcrumb: 'attendance.attendance_settings.title',
          pageTitle: 'attendance.attendance_settings.title',
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.attendance.VIEW_GLOBAL_END_TIME),
        ],
        loadComponent: () =>
          import('./pages/attendance-setting/attendance-setting.page').then(
            (m) => m.AttendanceSettingPage,
          ),
      },
      {
        path: 'roles',
        data: {
          breadcrumb: 'roles_permissions.roles_and_permissions.title',
          pageTitle: 'roles_permissions.roles_and_permissions.title',
        },
        loadChildren: () =>
          import('./pages/role-management/role-management.routes').then(
            (m) => m.RoleManagmentRoutes,
          ),
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.rolesAndPermission.viewRoleListing),
        ],
      },
      {
        path: 'configure-escalation',
        data: {
          breadcrumb: 'support_ticket.support_tickets_settings.title',
          pageTitle: 'support_ticket.support_tickets_settings.title',
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../configure-escalation/configure-escalation.page').then(
                (m) => m.ConfigureEscalationPage,
              ),
            canActivate: [
              rbacGuard(RESOURCE_PERMISSION.supportTicket.viewEscalationList),
            ],
          },
          {
            path: ':id/escalation-levels',
            data: {
              breadcrumb: 'support_ticket.escalation_levels.title',
            },
            loadComponent: () =>
              import(
                '../configure-escalation/pages/configure-escalation-type/configure-escalation-type.page'
              ).then((m) => m.ConfigureEscalationTypePage),
            canActivate: [
              rbacGuard(RESOURCE_PERMISSION.supportTicket.viewEscalationList),
            ],
          },
        ],
      },
      {
        path: 'time-periods',
        data: {
          breadcrumb: 'time_period.time_periods.title',
          pageTitle: 'time_period.time_periods.title',
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../time-periods/time-periods.page').then(
                (m) => m.TimePeriodsPage,
              ),
            providers: [
              TimePeriodsColDefService,
              SchoolStructureListingService,
            ],
            canActivate: [
              rbacGuard(
                RESOURCE_PERMISSION.TIME_PERIODS.READ.VIEW_TIME_PERIODS_LIST,
              ),
            ],
          },
        ],
      },
      {
        path: 'ticket-type',
        data: {
          breadcrumb: 'support_tickets.category_settings.title',
          pageTitle: 'support_tickets.category_settings.title',
        },
        children: [
          {
            path: '',
            canActivate: [
              rbacGuard(RESOURCE_PERMISSION.supportTicket.viewCategoryDetails),
            ],
            loadComponent: () =>
              import(
                './pages/ticket-type-setting/pages/ticket-type-setting.page'
              ).then((m) => m.TicketTypeSettingPage),
          },
          {
            path: ':subCategoryID',
            data: {
              breadcrumb: { alias: 'subCatName' }, //Replace with Key: How to write feedback dynamically
              pageTitle: { alias: 'subCatName' },
              noMobilePadding: true,
            },
            canActivate: [
              rbacGuard(RESOURCE_PERMISSION.supportTicket.viewCategoryDetails),
            ],
            loadComponent: () =>
              import(
                './pages/ticket-type-setting/pages/view-category-details/view-category-details.page'
              ).then((m) => m.ViewCategoryDetailsPage),
          },
        ],
      },
    ],
  },
];
