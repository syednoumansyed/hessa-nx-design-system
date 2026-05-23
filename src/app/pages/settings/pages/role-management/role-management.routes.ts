import { Routes } from '@angular/router';
import { rbacGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

export const RoleManagmentRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/role-list/role-list.page').then(
            (m) => m.RoleListPage,
          ),
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.rolesAndPermission.viewRoleListing),
        ],
      },
      {
        path: 'add',
        data: { breadcrumb: 'roles_permissions.add_role.title' },
        loadComponent: () =>
          import(
            './pages/role-and-permission-form/role-and-permission-form.page'
          ).then((m) => m.RoleAndPermissionFormPage),
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.rolesAndPermission.createRole),
        ],
      },
      {
        path: 'detail/:roleId',
        data: { breadcrumb: 'roles_permissions.role_details.title' },
        loadComponent: () =>
          import('./pages/role-detail/role-detail.page').then(
            (m) => m.RoleDetailPage,
          ),
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.rolesAndPermission.viewRoleDetail),
        ],
      },
      {
        path: 'edit/:roleId',
        data: { breadcrumb: 'roles_permissions.edit_role.title' },
        loadComponent: () =>
          import(
            './pages/role-and-permission-form/role-and-permission-form.page'
          ).then((m) => m.RoleAndPermissionFormPage),
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.rolesAndPermission.updateRole),
        ],
      },
    ],
  },
];
