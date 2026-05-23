import { Routes } from '@angular/router';
import {
  supportTicketCaterogiesResolver,
  supportTicketDetailsResolver,
  supportTicketsTypesResolver,
} from './support-tickets.resolver';
import { rbacGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

export const SupportTicketsRoutes: Routes = [
  {
    path: '',
    resolve: {
      supportTicketsTypes: supportTicketsTypesResolver,
      supportTicketCaterogies: supportTicketCaterogiesResolver,
    },
    children: [
      {
        path: '',
        data: { breadcrumb: 'global.support_ticket.title' },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.supportTicket.viewMyAssignedTickets),
        ],
        loadComponent: () =>
          import('./support-tickets.page').then((m) => m.SupportTicketsPage),
      },
      {
        path: ':id',
        resolve: {
          ticketDetails: supportTicketDetailsResolver,
        },
        data: { breadcrumb: 'support_ticket.view_assigned_ticket.title' },
        canActivate: [
          rbacGuard(
            RESOURCE_PERMISSION.supportTicket.viewMyAssignedTicketDetails,
          ),
        ],
        loadComponent: () =>
          import(
            './pages/assigned-ticket-details/assigned-ticket-details.page'
          ).then((m) => m.AssignedTicketDetailsPage),
      },
    ],
  },
];
