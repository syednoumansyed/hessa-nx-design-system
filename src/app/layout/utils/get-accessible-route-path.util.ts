// menu-navigation.util.ts

import { inject } from '@angular/core';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

export function getAccessibleRoutePath() {
  const rbacService = inject(RoleBaseAccessControlService);

  return function (menuItem: IMenuRoutes): string {
    if (menuItem.subRoutes && menuItem.subRoutes.length > 0) {
      const accessibleSubRoutes = menuItem.subRoutes.filter((subRoute) => {
        if (subRoute.permissions) {
          return rbacService.hasSomePermission(subRoute.permissions);
        } else if (subRoute.permission) {
          return rbacService.hasPermission(subRoute.permission);
        }
        return true;
      });

      if (accessibleSubRoutes.length === 1) {
        return accessibleSubRoutes[0].path;
      } else if (accessibleSubRoutes.length > 1) {
        return menuItem.path;
      }
    }
    return menuItem.path;
  };
}
