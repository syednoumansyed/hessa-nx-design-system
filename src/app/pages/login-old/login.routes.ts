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
      {
        path: 'students',
        loadComponent: () =>
          import('./pages/login-students/login-students.page').then(
            (m) => m.LoginStudentsPage,
          ),
      },
      {
        path: 'setup',
        loadComponent: () =>
          import('./pages/setup-student/setup-student.page').then(
            (m) => m.SetupStudentPage,
          ),
      },
      {
        path: 'forget-password',
        loadComponent: () =>
          import('./pages/forget-password/forget-password.page').then(
            (m) => m.ForgetPasswordPage,
          ),
      },
    ],
  },
];
