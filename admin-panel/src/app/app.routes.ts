import { Routes } from '@angular/router';
import { AuthGuard, RedirectFromLoginPageGuard } from '@auth/auth.guard';
import { StorageCleanupGuard } from '@core/guards/storage-cleanup.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [StorageCleanupGuard, RedirectFromLoginPageGuard],
    loadChildren: () =>
      import('./pages/login/login.routes').then((mod) => mod.authRoutes),
  },
  {
    path: '',
    canActivate: [StorageCleanupGuard, AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
