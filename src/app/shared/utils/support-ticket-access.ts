import { computed, inject } from '@angular/core';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

const SUPPORT_TICKET_MANAGE_PERMISSIONS = [
  RESOURCE_PERMISSION.supportTicket.updateTicket,
  RESOURCE_PERMISSION.supportTicket.reassign,
  RESOURCE_PERMISSION.supportTicket.resolveTicket,
];

export function createSupportTicketAccess() {
  const rbacService = inject(RoleBaseAccessControlService);

  const canManageTickets = computed(() =>
    rbacService.hasSomePermission(SUPPORT_TICKET_MANAGE_PERMISSIONS),
  );

  return {
    canManageTickets,
    managePermissions: SUPPORT_TICKET_MANAGE_PERMISSIONS,
  };
}
