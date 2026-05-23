import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

/**
 * Guard that restricts access to guardians only.
 * SuperAdmins are allowed by default unless bypassSuperAdminCheck is true.
 */
export const guardianOnlyGuard = (
  bypassSuperAdminCheck = false,
): CanActivateFn => {
  return (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const rbacService = inject(RoleBaseAccessControlService);
    const router = inject(Router);

    // Allow superadmin unless bypass is requested
    if (rbacService.isSuperAdmin() && !bypassSuperAdminCheck) {
      return true;
    }

    // Check if user is a guardian
    if (authService.user()?.type === UserType.GUARDIAN) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};
