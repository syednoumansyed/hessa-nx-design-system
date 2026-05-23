import { Routes } from '@angular/router';
import { rbacGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ManageAttendancePage } from '@pages/vcr/manage-attendance/manage-attendance.page';

export const VCRRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'global.virtual_classrooms.title' },
        loadComponent: () =>
          import('./personnel/personnel-vcr.page').then(
            (m) => m.PersonnelVCRPage,
          ),
      },
      {
        path: 'add',
        data: {
          breadcrumb: 'global.virtual_classroom.add.title',
          pageTitle: 'global.virtual_classroom.add.title',
        },
        canActivate: [rbacGuard(RESOURCE_PERMISSION.VCR.CREATE.ADD)],
        loadComponent: () =>
          import(
            './pages/virtual-classroom-form/virtual-classroom-form.page'
          ).then((m) => m.VirtualClassRoomPages),
      },
      {
        path: ':id',
        data: {
          breadcrumb: 'global.view_virtual_classrooms.title',
          pageTitle: 'global.view_virtual_classrooms.title',
        },
        canActivate: [rbacGuard(RESOURCE_PERMISSION.VCR.READ.VIEW_VCR_DETAILS)],
        loadComponent: () =>
          import(
            './pages/view-virtual-classroom/view-virtual-classroom.page'
          ).then((m) => m.ViewVirtualClassRoomPages),
      },
      {
        path: ':id/update',
        data: {
          breadcrumb: 'global.virtual_classroom.edit.title',
          pageTitle: 'global.virtual_classroom.edit.title',
        },
        canActivate: [rbacGuard(RESOURCE_PERMISSION.VCR.UPDATE.UPDATE_VCR)],
        loadComponent: () =>
          import(
            './pages/virtual-classroom-form/virtual-classroom-form.page'
          ).then((m) => m.VirtualClassRoomPages),
      },
      {
        path: 'manage-recordings/:vcrId',
        data: { breadcrumb: 'virtual_classrooms.manage_recordings.btn' },
        loadComponent: () =>
          import('./manage-recordings/manage-recordings.page').then(
            (m) => m.ManageRecordingsPage,
          ),
      },
      {
        path: 'attendance/:vcrId',
        data: { breadcrumb: 'virtual_classrooms.manage_attendance.btn' },
        loadComponent: () =>
          import('./attendance-list/attendance-list.page').then(
            (m) => m.AttendanceListPage,
          ),
      },
      {
        path: 'attendance/:vcrId/manage/:lectureId',
        data: { breadcrumb: 'virtual_classrooms.manage_attendance.btn' },
        loadComponent: () =>
          import('./manage-attendance/manage-attendance.page').then(
            (m) => m.ManageAttendancePage,
          ),
      },
    ],
  },
];
