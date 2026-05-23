import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login.page').then((m) => m.LoginPage),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/login-otp/login-otp.page').then(
            (m) => m.LoginOtpPage,
          ),
      },
    ],
  },
];
