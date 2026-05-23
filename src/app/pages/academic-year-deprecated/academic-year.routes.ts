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
          import('./academic-year.page').then((c) => c.AcademicYearPage),
      },
    ],
  },
];
