import { Routes } from '@angular/router';
import { rbacGuard } from '@shared/role-bace-acces-controller/rbac.guard';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { canFormDeactivateGuard } from '@shared/guards/form-can-deactivate.guard';

export const AnnouncementsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'global.announcements.title' },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.announcement.announcementListView),
        ],
        loadComponent: () =>
          import('./announcements-home.component').then(
            (m) => m.AnnouncementsHomeComponent,
          ),
      },
      {
        path: 'user-feed',
        data: {
          breadcrumb: 'global.view_announcements.title',
          pageTitle: 'global.view_announcements.title',
        },
        loadComponent: () =>
          import('./pages/view-posts/view-posts.component').then(
            (m) => m.ViewPostsComponent,
          ),
      },
      {
        path: 'manage',
        data: { breadcrumb: 'global.manage_announcements.title' },
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.announcement.announcementListView),
        ],
        loadComponent: () =>
          import('./pages/announcements/announcements.page').then(
            (m) => m.AnnouncementsPages,
          ),
      },
      {
        path: 'post',
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.announcement.announcementCreatePost),
        ],
        canDeactivate: [canFormDeactivateGuard],
        loadComponent: () =>
          import('./pages/post-form/post-form.page').then(
            (m) => m.PostFormPage,
          ),
      },
      {
        path: 'post/:postId',
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.announcement.announcementUpdatePost),
        ],
        canDeactivate: [canFormDeactivateGuard],
        loadComponent: () =>
          import('./pages/post-form/post-form.page').then(
            (m) => m.PostFormPage,
          ),
      },
      {
        path: 'sms',
        canActivate: [
          rbacGuard(RESOURCE_PERMISSION.announcement.announcementCreateSms),
        ],
        canDeactivate: [canFormDeactivateGuard],
        loadComponent: () =>
          import('./pages/sms-form/sms-form.page').then((m) => m.SmsFormPage),
      },
      {
        path: 'notification',
        canActivate: [
          rbacGuard(
            RESOURCE_PERMISSION.announcement.announcementCreateNotification,
          ),
        ],
        canDeactivate: [canFormDeactivateGuard],
        loadComponent: () =>
          import('./pages/notification-form/notification-form.page').then(
            (m) => m.NotificationFormPage,
          ),
      },
    ],
  },
];
