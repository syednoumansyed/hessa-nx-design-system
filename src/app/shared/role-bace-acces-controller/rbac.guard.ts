import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { RoleBaseAccessControlService } from './role-base-access-control.service';

export const rbacGuard = (
  permissionId: number,
  bypassSuperAdminCheck = false,
): CanActivateFn => {
  return (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
    const rbacService = inject(RoleBaseAccessControlService);
    const router = inject(Router);
    if (!rbacService.hasPermission(permissionId, bypassSuperAdminCheck)) {
      router.navigate(['/unauthorized']);
      return false;
    }
    return true;
  };
};

export const rbacSomeGuard = (
  permissionIds: number[],
  bypassSuperAdminCheck = false,
): CanActivateFn => {
  return () => {
    const rbacService = inject(RoleBaseAccessControlService);
    const router = inject(Router);
    if (!rbacService.hasSomePermission(permissionIds, bypassSuperAdminCheck)) {
      router.navigate(['/unauthorized']);
      return false;
    }
    return true;
  };
};

export const rbacEveryGuard = (
  permissionIds: number[],
  bypassSuperAdminCheck = false,
): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const rbacService = inject(RoleBaseAccessControlService);
    const router = inject(Router);
    if (!rbacService.hasEveryPermission(permissionIds, bypassSuperAdminCheck)) {
      router.navigate(['/unauthorized']);
      return false;
    }
    return true;
  };
};
