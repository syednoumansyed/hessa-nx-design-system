import { Routes } from '@angular/router';
import { rbacGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

const DOCUMENT_ROUTES = [
  {
    data: {
      breadcrumb: 'global.add_question_or_article.title',
    },
    path: 'documentation/create',
    canActivate: [rbacGuard(RESOURCE_PERMISSION.helpCenter.CREATE)],
    loadComponent: () =>
      import('./pages/documentation-form/documentation-form.page').then(
        (m) => m.DocumentationFormPage,
      ),
  },
  {
    path: 'documentation/:docId/edit',
    data: {
      breadcrumb: 'support_ticket.edit_article.title',
    },
    canActivate: [rbacGuard(RESOURCE_PERMISSION.helpCenter.UPDATE)],
    loadComponent: () =>
      import('./pages/documentation-form/documentation-form.page').then(
        (m) => m.DocumentationFormPage,
      ),
  },
];
export const HelpCenterRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./help-center.page').then((m) => m.HelpCenterPage),
      },
      {
        path: 'support-tickets',
        data: {
          breadcrumb: 'global.support_ticket.title',
          pageTitle: 'global.support_ticket.title',
        },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.supportTicket.viewMyInitiatedTickets),
        ],
        loadComponent: () =>
          import('./pages/support-tickets/support-tickets.page').then(
            (m) => m.SupportTicketsPage,
          ),
      },
      {
        path: 'user-manual',
        data: {
          breadcrumb: 'global.user_manual.title',
          pageTitle: 'global.user_manual.title',
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/view-user-manual/view-user-manual.page').then(
                (m) => m.ViewUserManualPage,
              ),
          },
          ...DOCUMENT_ROUTES,
        ],
      },
      {
        data: {
          breadcrumb: 'global.faqs.title',
          pageTitle: 'global.faqs.title',
        },
        path: 'faqs',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/view-faq/view-faq.page').then(
                (m) => m.ViewFaqPage,
              ),
          },
          ...DOCUMENT_ROUTES,
        ],
      },
    ],
  },
];
