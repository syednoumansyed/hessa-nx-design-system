import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

export const journalsGuard: CanActivateFn = (route, state) => {
  const rbac = inject(RoleBaseAccessControlService);
  const router = inject(Router);
  if (
    rbac.hasPermission(
      RESOURCE_PERMISSION.JOURNAL.READ.VIEW_JOURNAL_LIST_PERSONNEL,
    )
  ) {
    // 1) If user has "personnel" permission, allow them to proceed
    return true;
  } else if (
    rbac.hasPermission(
      RESOURCE_PERMISSION.JOURNAL.READ.VIEW_JOURNAL_LIST_GUARDIAN,
    )
  ) {
    // 2) If user does *not* have "guardian" permission, redirect to /journal/user-journal
    router.navigate(['/journal/user-journal']);
    return false;
  } else {
    // 3) Otherwise, go unauthorized
    router.navigate(['/unauthorized']);
  }
  return false;
};
