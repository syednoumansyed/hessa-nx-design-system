import { Routes } from '@angular/router';
import {
  companyResolver,
  subCompanyResolver,
} from './pages/company/company.resolver';
import { campusResolver } from './pages/campus/campus.resolver';
import { schoolResolver } from './pages/school/school.resolver';
import { rbacGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { levelResolver } from './pages/level/resolver/level.resolver';

export const SchoolStructureRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'course_management.company.title' },
        loadComponent: () =>
          import('./school-structure.page').then((m) => m.SchoolStructurePage),
      },
      {
        path: 'company/:id',
        data: { breadcrumb: { alias: 'companyName' } },
        resolve: { company: companyResolver },
        loadComponent: () =>
          import('./pages/company/company.page').then((m) => m.CompanyPage),
      },
      {
        path: 'sub-company/:id',
        data: {
          breadcrumbs: [{ alias: 'companyName' }, { alias: 'subCompanyName' }],
        },
        resolve: { company: subCompanyResolver },
        loadComponent: () =>
          import('./pages/company/company.page').then((m) => m.CompanyPage),
      },
      {
        path: 'campus/:campusId',
        data: {
          breadcrumbs: [{ alias: 'companyName' }, { alias: 'campusName' }],
        },
        resolve: { campus: campusResolver },
        loadComponent: () =>
          import('./pages/campus/campus.page').then((m) => m.CampusPage),
      },
      {
        path: 'school/:id',
        data: {
          breadcrumbs: [
            { alias: 'companyName' },
            { alias: 'campusName' },
            { alias: 'schoolName' },
          ],
        },
        resolve: { school: schoolResolver },
        loadComponent: () =>
          import('./pages/school/school.page').then((m) => m.SchoolPage),
      },
      {
        path: 'level/:id',
        loadComponent: () =>
          import('./pages/campus/campus.page').then((m) => m.CampusPage),
        canActivate: [rbacGuard(RESOURCE_PERMISSION.school.viewSchoolDetails)],
      },
      {
        path: 'class/:id',
        loadComponent: () =>
          import('./pages/campus/campus.page').then((m) => m.CampusPage),
      },
      {
        path: 'school/:schoolId/level/:levelId',
        data: {
          breadcrumbs: [
            { alias: 'companyName' },
            { alias: 'campusName' },
            { alias: 'schoolName' },
            { alias: 'levelName' },
          ],
        },
        resolve: { school: levelResolver },
        loadComponent: () =>
          import('./pages/level/level.page').then((m) => m.LevelPage),
      },
      {
        path: 'school/:schoolId/level/:levelId/class/:classId',
        data: {
          breadcrumbs: [
            { alias: 'companyName' },
            { alias: 'campusName' },
            { alias: 'schoolName' },
            { alias: 'levelName' },
            { alias: 'className' },
          ],
          fullWidth: true,
        },
        resolve: { school: levelResolver },
        loadComponent: () =>
          import('./pages/class/class.page').then((m) => m.ClassPage),
      },
      {
        path: 'school/:schoolId/level/:levelId/class/:classId/assign',
        data: {
          breadcrumbs: [
            { alias: 'companyName' },
            { alias: 'campusName' },
            { alias: 'schoolName' },
            { alias: 'levelName' },
            { alias: 'className' },
            'school_structure.assign_studnts.title',
          ],
          fullWidth: true,
        },
        resolve: { school: levelResolver },
        loadComponent: () =>
          import('./pages/class/pages/assign-student/assign-student.page').then(
            (m) => m.AssignStudentPage,
          ),
      },
    ],
  },
];
