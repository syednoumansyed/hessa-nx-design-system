import { Routes } from '@angular/router';
import { rbacGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

export const AcademicRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: {
          breadcrumb: 'academic_enrollment.academic_years_semesters.title',
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.academicYear.academicYearListView),
        ],
        loadComponent: () =>
          import('./academic-year.page').then((m) => m.AcademicYearPage),
      },
      {
        path: 'previous',
        data: {
          breadcrumb: 'academic_calendar.previous_year.btn',
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.academicYear.academicYearListView),
        ],
        loadComponent: () =>
          import('./academic-year.page').then((m) => m.AcademicYearPage),
      },
      {
        path: 'add',
        data: {
          breadcrumb: 'academic_calendar.add_academic_year_dates.title',
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.academicYear.academicYearCreate),
        ],
        loadComponent: () =>
          import(
            './components/manage-academic-year/manage-academic-year.component'
          ).then((m) => m.ManageAcademicYearComponent),
      },
      {
        path: 'edit/:academicYearId',
        data: {
          breadcrumb: 'academic_year.edit_academic_year_dates.title',
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.academicYear.academicYearUpdate),
        ],
        loadComponent: () =>
          import(
            './components/manage-academic-year/manage-academic-year.component'
          ).then((m) => m.ManageAcademicYearComponent),
      },
      {
        path: ':academicYearId/add-semester',
        data: {
          breadcrumb: 'academic_enrolment.add_semester.title',
        },
        canActivate: [rbacGuard(RESOURCE_PERMISSION.semester.semesterCreate)],
        loadComponent: () =>
          import('./components/manage-semester/manage-semester.component').then(
            (m) => m.ManageSemesterComponent,
          ),
      },
      {
        path: ':academicYearId/edit-semester/:semesterId',
        data: {
          breadcrumb: 'academic_enrolment.edit_semester.title',
        },
        canActivate: [rbacGuard(RESOURCE_PERMISSION.semester.semesterUpdate)],
        loadComponent: () =>
          import('./components/manage-semester/manage-semester.component').then(
            (m) => m.ManageSemesterComponent,
          ),
      },
      {
        path: ':academicYearId/add-holiday',
        data: {
          breadcrumb: 'academic_calendar.add_holiday',
        },
        canActivate: [rbacGuard(RESOURCE_PERMISSION.holiday.holidayCreate)],
        loadComponent: () =>
          import('./components/manage-holidays/manage-holidays.component').then(
            (m) => m.ManageHolidaysComponent,
          ),
      },
      {
        path: ':academicYearId/edit-holiday/:holidayId',
        data: {
          breadcrumb: 'academic_calendar.add_holiday',
        },
        canActivate: [rbacGuard(RESOURCE_PERMISSION.holiday.holidayUpdate)],
        loadComponent: () =>
          import('./components/manage-holidays/manage-holidays.component').then(
            (m) => m.ManageHolidaysComponent,
          ),
      },
    ],
  },
];
