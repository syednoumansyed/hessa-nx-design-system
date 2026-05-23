import { Routes } from '@angular/router';
import { rbacSomeGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { supportHubTicketPresenceResolver } from './support-hub.resolver';

export const SupportHubRoutes: Routes = [
  {
    path: '',
    canActivate: [
      rbacSomeGuard([
        RESOURCE_PERMISSION.supportTicket.viewMyInitiatedTickets,
        RESOURCE_PERMISSION.supportTicket.viewMyAssignedTickets,
      ]),
    ],
    data: {
      fullWidth: true,
    },
    resolve: {
      ticketPresence: supportHubTicketPresenceResolver,
    },
    loadComponent: () =>
      import('./support-hub.page').then((m) => m.SupportHubPage),
  },
];
