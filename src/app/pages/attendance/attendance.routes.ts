import { Routes } from '@angular/router';
import { AttendanceService } from './data-access/attendance.service';
import { markStudentsAttendanceResolver } from './Resolvers/mark-attendance.resolver';
import { rbacSomeGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { MarkAttendanceGuard } from './Guards/mark-attendance.guard';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { studentsListFilterResolver } from './Resolvers/students-list-filter.resolver';
import { ViewAttendanceColDefService } from './data-access/view-attendance-col-def.service';
import { StudentAttendanceService } from './pages/student-attendance/data-access/student-attendance.service';

export const AttendanceRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./attendance.page').then((m) => m.AttendancePage),
      },
      {
        path: 'view',
        data: {
          breadcrumb: 'attendance.view_attendance.title',
          pageTitle: 'attendance.view_attendance.title',
          fullWidth: true,
        },
        resolve: {
          StudentsListFilter: studentsListFilterResolver,
        },
        canActivate: [rbacSomeGuard([RESOURCE_PERMISSION.attendance.DETAIL])],
        loadComponent: () =>
          import('./pages/student-attendance/student-attendance.page').then(
            (m) => m.StudentAttendancePage,
          ),
        providers: [StudentAttendanceService, ViewAttendanceColDefService],
      },
      {
        // v2 attendance redesign route
        path: 'monthly-detail',
        data: {
          breadcrumb: 'attendance.view_attendance.title',
          pageTitle: 'attendance.view_attendance.title',
        },
        canActivate: [rbacSomeGuard([RESOURCE_PERMISSION.attendance.DETAIL])],
        loadComponent: () =>
          import('./pages/v2/student-attendance/student-attendance-detail.page').then(
            (m) => m.StudentAttendanceDetailPage,
          ),
      },
      {
        path: 'list',
        data: {
          breadcrumb: 'attendance.mark_attendance.title',
          pageTitle: 'attendance.mark_attendance.title',
          fullWidth: true,
        },
        canActivate: [rbacSomeGuard([RESOURCE_PERMISSION.attendance.LIST])],
        loadComponent: () =>
          import('./pages/attendance-list/attendance-list.page').then(
            (m) => m.AttendanceListPage,
          ),
      },
      {
        path: 'mark',
        data: {
          breadcrumb: 'attendance.mark_attendance.title',
          pageTitle: 'attendance.mark_attendance.title',
          fullWidth: true,
        },
        resolve: {
          StudentsAttendance: markStudentsAttendanceResolver,
        },
        canActivate: [
          rbacSomeGuard([
            RESOURCE_PERMISSION.attendance.CREATE,
            RESOURCE_PERMISSION.attendance.UPDATE,
            RESOURCE_PERMISSION.attendance.LIST,
          ]),
          MarkAttendanceGuard,
        ],
        loadComponent: () =>
          import('./pages/mark-attendance/mark-attendance.page').then(
            (m) => m.MarkStudentsAttendanceListPage,
          ),
      },
      {
        path: 'confirm-absence',
        data: {
          breadcrumb: 'attendance.confirm_absence.title',
          pageTitle: 'attendance.confirm_absence.title',
          fullWidth: true,
        },
        loadComponent: () =>
          import('./pages/confirm-absence/confirm-absence.page').then(
            (m) => m.ConfirmAbsencePage,
          ),
      },
    ],
    providers: [AttendanceService, SchoolStructureListingService],
  },
];
