import { Routes } from '@angular/router';
import { rbacSomeGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { journalsGuard } from '@pages/journal/guards/journals.guard';

export const JournalRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        canActivate: [journalsGuard],
        data: {
          breadcrumb: 'journals.journals.title',
          noMobilePadding: true,
        },
        loadComponent: () =>
          import('./journal.page').then((m) => m.JournalPage),
      },
      {
        path: 'user-journal',
        canActivate: [
          rbacSomeGuard([
            RESOURCE_PERMISSION.JOURNAL.READ.VIEW_JOURNAL_LIST_GUARDIAN,
          ]),
        ],
        data: {
          noMobilePadding: true,
          showChildSelector: true,
        },
        loadComponent: () =>
          import('./pages/user-journal/user-journal.page').then(
            (m) => m.UserJournalPage,
          ),
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./pages/admin-journal/admin-journal.page').then(
            (m) => m.AdminJournalPage,
          ),
      },
      {
        path: 'personnel',
        loadComponent: () =>
          import('./pages/personnel-journal/personnel-journal.page').then(
            (m) => m.PersonnelJournalPage,
          ),
      },
      {
        path: 'add/daily/:studentId',
        data: { breadcrumb: 'journals.add_daily_journal.btn' }, //Replace with key
        loadComponent: () =>
          import('./pages/add-journal/add-journal.page').then(
            (m) => m.AddJournalPage,
          ),
      },
      {
        path: 'add/weekly/:studentId',
        data: { breadcrumb: 'journals.add_weekly_journal.btn' }, //Replace with key
        loadComponent: () =>
          import('./pages/add-journal/add-journal.page').then(
            (m) => m.AddJournalPage,
          ),
      },
      {
        path: 'view/:journalId',
        data: { breadcrumb: 'journals.view_journal.btn' }, //Replace with key
        loadComponent: () =>
          import('./pages/add-journal/add-journal.page').then(
            (m) => m.AddJournalPage,
          ),
      },
      {
        path: 'edit/:journalId',
        data: { breadcrumb: 'journals.edit_weekly_journal.btn' }, //Replace with key
        loadComponent: () =>
          import('./pages/add-journal/add-journal.page').then(
            (m) => m.AddJournalPage,
          ),
      },
    ],
  },
];
