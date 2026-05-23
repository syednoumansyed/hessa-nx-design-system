import { Routes } from '@angular/router';
import { canFormDeactivateGuard } from '@shared/guards/form-can-deactivate.guard';
import {
  rbacGuard,
  rbacSomeGuard,
} from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { NationalitiesApiService } from '@core/api-services/nationalities-api/nationalities.api-service';

export const UserManagementRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./user-management.page').then((m) => m.UserManagementPage),
        canActivate: [
          rbacSomeGuard([
            RESOURCE_PERMISSION.guardians.viewGuardiansList,
            RESOURCE_PERMISSION.personnel.viewPersonnelList,
            RESOURCE_PERMISSION.student.viewStudentsList,
          ]),
        ],
        data: {
          noMobilePadding: true,
          fullWidth: true,
        },
      },
      {
        path: 'students',
        data: { breadcrumb: 'global.students.title' },
        children: [
          { path: '', redirectTo: '/user-management', pathMatch: 'full' },
          {
            path: 'add',
            data: { breadcrumb: 'user_management.add_student.title' },
            canActivate: [rbacGuard(RESOURCE_PERMISSION.student.addNewStudent)],
            canDeactivate: [canFormDeactivateGuard],
            loadComponent: () =>
              import('./students/student-form/student-form.page').then(
                (m) => m.StudentFormPage,
              ),
          },
          {
            path: ':id',
            data: { breadcrumb: 'global.profile.title' },
            // TODO: allow self view
            // canActivate: [
            //   rbacGuard(RESOURCE_PERMISSION.student.viewStudentProfile),
            // ],
            loadComponent: () =>
              import('./students/student-profile/student-profile.page').then(
                (m) => m.StudentProfilePage,
              ),
          },
          {
            path: ':id/update',
            data: { breadcrumb: 'global.update_profile.title' },
            canDeactivate: [canFormDeactivateGuard],
            // TODO: allow self update
            // canActivate: [
            //   rbacGuard(RESOURCE_PERMISSION.student.editStudentProfile),
            // ],
            loadComponent: () =>
              import('./students/student-form/student-form.page').then(
                (m) => m.StudentFormPage,
              ),
          },
        ],
      },
      {
        path: 'guardians',
        data: { breadcrumb: 'global.guardians.title' },
        children: [
          { path: '', redirectTo: '/user-management', pathMatch: 'full' },
          {
            path: 'add',
            data: { breadcrumb: 'action.guardian.new.add' },
            canActivate: [
              rbacGuard(RESOURCE_PERMISSION.guardians.addNewGuardian),
            ],
            canDeactivate: [canFormDeactivateGuard],
            loadComponent: () =>
              import('./guardians/guardian-form/guardian-form.page').then(
                (m) => m.GurdianFormPage,
              ),
          },
          {
            path: ':id',
            data: { breadcrumb: 'global.profile.title' },
            // TODO: allow self view
            // canActivate: [
            //   rbacGuard(RESOURCE_PERMISSION.guardians.viewGuardianProfile),
            // ],
            loadComponent: () =>
              import('./guardians/guardian-profile/guardian-profile.page').then(
                (m) => m.GuardianProfilePage,
              ),
          },
          {
            path: ':id/update',
            // TODO: allow self update
            // canActivate: [
            //   rbacGuard(RESOURCE_PERMISSION.guardians.updateGuardainsProfile),
            // ],
            data: { breadcrumb: 'global.update_profile.title' },
            canDeactivate: [canFormDeactivateGuard],
            loadComponent: () =>
              import('./guardians/guardian-form/guardian-form.page').then(
                (m) => m.GurdianFormPage,
              ),
          },
        ],
      },
      {
        path: 'personnels',
        data: { breadcrumb: 'global.personnels.title' },
        children: [
          { path: '', redirectTo: '/user-management', pathMatch: 'full' },
          {
            path: 'add',
            data: { breadcrumb: 'user_management.add_personnel.title' },
            canActivate: [
              rbacGuard(RESOURCE_PERMISSION.personnel.addNewPersonnel),
            ],
            canDeactivate: [canFormDeactivateGuard],
            loadComponent: () =>
              import('./personnels/personnel-form/personnel-form.page').then(
                (m) => m.PersonnelFormPage,
              ),
          },
          {
            path: ':id',
            data: { breadcrumb: 'global.profile.title' },
            // TODO: allow self view
            // canActivate: [
            // rbacGuard(RESOURCE_PERMISSION.personnel.viewPersonnelProfile),
            // ],
            loadComponent: () =>
              import('./personnels/personnel-profile/personnel-profile.page').then(
                (m) => m.PersonnelProfilePage,
              ),
          },
          {
            path: ':id/update',
            data: { breadcrumb: 'global.update_profile.title' },
            // TODO: allow self update
            // canActivate: [
            // rbacGuard(RESOURCE_PERMISSION.personnel.editPersonnelProfile),
            // ],
            canDeactivate: [canFormDeactivateGuard],
            loadComponent: () =>
              import('./personnels/personnel-form/personnel-form.page').then(
                (m) => m.PersonnelFormPage,
              ),
          },
        ],
      },
    ],

    providers: [NationalitiesApiService],
  },
];
