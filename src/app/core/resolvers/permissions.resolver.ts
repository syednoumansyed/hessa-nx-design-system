import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

export const permissionsResolver: ResolveFn<any> = (_route, _state) => {
  const rbac = inject(RoleBaseAccessControlService);

  return rbac.fetchPermission();
};
