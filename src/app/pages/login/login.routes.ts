import { Routes } from '@angular/router';
import { LoginPage } from '@pages/login/login-shell.page';
import { LanguageSelectionComponent } from '@pages/login/components/language-selection/language-selection.component';
import { RoleSelectionComponent } from '@pages/login/components/role-selection/role-selection.component';
import {
  FlowStepGuard,
  UserTypeGuard,
} from '@pages/login/guards/user-type-guard.guard';
import { MethodSelectionComponent } from '@pages/login/components/method-selection/method-selection.component';
import { MobileEntryComponent } from '@pages/login/components/mobile-entry/mobile-entry.component';
import { OtpEntryComponent } from '@pages/login/components/otp-entry/otp-entry.component';
import { PasswordEntryComponent } from '@pages/login/components/password-entry/password-entry.component';
import { AccountSelectionComponent } from '@pages/login/components/account-selection/account-selection.component';
import { NameVerificationComponent } from '@pages/login/components/name-verification/name-verification.component';
import { PasswordSetupComponent } from '@pages/login/components/password-setup/password-setup.component';
import { LoginSuccessComponent } from '@pages/login/components/login-success/login-success.component';
import { WelcomeMascotComponent } from '@pages/login/components/welcome-mascot/welcome-mascot.component';
import { TimerService } from '@shared/services/timer-service';
import { AccountPausedComponent } from '@pages/login/components/account-paused/account-paused.component';

export const authRoutes: Routes = [
  {
    path: '',
    component: LoginPage,
    providers: [TimerService],
    children: [
      // Default redirect to language selection
      {
        path: '',
        redirectTo: 'language-selection',
        pathMatch: 'full',
      },

      // Language selection - first step
      {
        path: 'language-selection',
        component: LanguageSelectionComponent,
      },

      {
        path: 'welcome',
        component: WelcomeMascotComponent,
      },

      // Role selection - second step
      {
        path: 'role-selection',
        component: RoleSelectionComponent,
        canActivate: [FlowStepGuard],
        data: { requiredStep: 'language-selection' },
      },

      // Method selection - third step
      {
        path: 'method-selection',
        component: MethodSelectionComponent,
        canActivate: [FlowStepGuard],
        data: { requiredStep: 'role-selection' },
      },

      // Mobile entry - for OTP and onboarding flows
      {
        path: 'mobile-entry',
        component: MobileEntryComponent,
        canActivate: [FlowStepGuard],
        data: {
          requiredStep: ['method-selection', 'role-selection'],
          allowedFlows: ['otp', 'setup', 'forgot'],
        },
      },

      // OTP entry
      {
        path: 'otp-entry',
        component: OtpEntryComponent,
        canActivate: [FlowStepGuard],
        data: {
          requiredStep: 'mobile-entry',
          allowedFlows: ['otp', 'setup', 'forgot'],
        },
      },

      // Password entry - for password login flow
      {
        path: 'password-entry',
        component: PasswordEntryComponent,
        canActivate: [FlowStepGuard],
        data: {
          requiredStep: 'method-selection',
          allowedFlows: ['password', 'forgot'],
        },
      },

      // Account selection - after OTP verification
      {
        path: 'account-selection',
        component: AccountSelectionComponent,
        canActivate: [FlowStepGuard],
        data: {
          requiredStep: 'otp-entry',
          allowedFlows: ['otp', 'setup', 'forgot'],
        },
      },

      // Name verification - for existing users
      {
        path: 'name-verification',
        component: NameVerificationComponent,
        canActivate: [FlowStepGuard],
        data: {
          requiredStep: ['password-entry', 'account-selection', 'otp-entry'],
          allowedFlows: ['otp', 'password', 'setup'],
        },
      },

      // Password setup - for new users
      {
        path: 'password-setup',
        component: PasswordSetupComponent,
        canActivate: [FlowStepGuard],
        data: {
          requiredStep: ['account-selection', 'otp-entry'],
          allowedFlows: ['setup', 'otp', 'forgot'],
        },
      },
      {
        path: 'no-access/:reason',
        component: AccountPausedComponent,
      },
      // Success page
      {
        path: 'success',
        component: LoginSuccessComponent,
        canActivate: [FlowStepGuard],
        data: {
          requiredStep: [
            'name-verification',
            'password-setup',
            'password-entry',
          ],
        },
      },

      // Guardian specific routes (if needed)
      {
        path: 'guardian',
        children: [
          {
            path: 'login-choice',
            component: MethodSelectionComponent, // Reuse with guardian context
            canActivate: [UserTypeGuard],
            data: { requiredUserType: 'guardian' },
          },
        ],
      },
      // Wildcard route - redirect to start
      {
        path: '**',
        redirectTo: 'language-selection',
      },
    ],
  },
];
