import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AuthFlowService,
  AuthStep,
  FlowType,
} from '../../services/auth-flow.service';
import { MascotSituation, MascotContext } from '../../services/mascot.service';
import { DsInputComponent } from '@ds/input/input.component';
import { ILoginPayload } from '@auth/model';
import { AuthService } from '@auth/auth.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { LoginDataService } from '@pages/login/services/login-data.service';
import { nationalIdMax18Validator } from '@validators/nationalID';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faCheckCircle,
  faExclamationCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-password-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsInputComponent,
    DsIconComponent,
    TranslocoDirective,
  ],
  templateUrl: './password-entry.component.html',
})
export class PasswordEntryComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authFlowService = inject(AuthFlowService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toaster = inject(HesToasterService);
  private readonly loginDataService = inject(LoginDataService);
  private readonly transloco = inject(TranslocoService);

  faEye = faEye;
  faEyeCross = faEyeSlash;
  faCheck = faCheckCircle;
  faWarning = faExclamationCircle;

  private destroy$ = new Subject<void>();

  passwordValue = signal('');
  isLoggingIn = signal(false);
  showPassword = signal(false);
  private nationalIdValidators = [
    Validators.required,
    nationalIdMax18Validator,
  ];

  eyeIcon = computed(() =>
    this.showPassword() ? this.faEyeCross : this.faEye,
  );

  private passwordValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    if (value.length < 8) {
      return { minLength: true };
    }

    return null;
  }
  passwordForm: FormGroup = this.fb.group({
    nationalId: ['', [...this.nationalIdValidators]],
    password: ['', [Validators.required, this.passwordValidator]],
  });

  // Computed validation messages
  nationalIdError = computed(() => {
    const control = this.passwordForm?.get('nationalId');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return this.transloco.translate('global.enter_national_id.placeholder');
    }

    if (control.hasError('minLength')) {
      return this.transloco.translate('global.national_id_length_error.txt');
    }

    if (control.hasError('invalidFormat')) {
      return this.transloco.translate('login.enter_correct_national_id.error');
    }

    return '';
  });

  hasNationalIdError = computed(() => {
    const control = this.passwordForm?.get('nationalId');
    return !!(control && control.invalid && control.touched);
  });

  ngOnInit(): void {
    this.authFlowService.dispatch({ type: 'PASSWORD_STEP' });
    this.authFlowService.setCurrentStep(AuthStep.PASSWORD_ENTRY);

    // Listen for continue button clicks
    this.authFlowService.continue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleContinue();
      });

    // Update canContinue based on form validity
    this.passwordForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.authFlowService.setCanContinue(this.passwordForm.valid);
      });

    this.passwordForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.passwordValue.set(this.passwordForm.value.password);
      });

    // Check for previously entered values
    const currentState = this.authFlowService.getCurrentState();
    if (currentState.nationalId) {
      this.passwordForm.patchValue({ nationalId: currentState.nationalId });
    }

    // Handle password visibility changes by updating the input type dynamically
    setTimeout(() => {
      this.updatePasswordInputType();
    });
  }

  private updatePasswordInputType(): void {
    const passwordInput = document.querySelector(
      'input[formControlName="password"]',
    ) as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = this.showPassword() ? 'text' : 'password';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleContinue(): void {
    if (this.passwordForm.valid && !this.isLoggingIn()) {
      this.login();
    }
  }

  private login(): void {
    if (!this.passwordForm.valid) return;

    this.isLoggingIn.set(true);
    this.authFlowService.setCanContinue(false);

    const nationalId = this.passwordForm.get('nationalId')?.value;
    const password = this.passwordForm.get('password')?.value;

    // Store in auth flow
    this.authFlowService.setNationalId(nationalId);
    this.authFlowService.setData('password', password);
    let payload: ILoginPayload;
    if (this.passwordForm.valid) {
      payload = {
        type: 'nationalId',
        channel: 'sms',
        nationalId: nationalId,
        password: password,
      };
      this.auth.studentLogin(payload).subscribe({
        next: (res) => {
          this.isLoggingIn.set(false);
          if (res.success && res.data.userInfo) {
            this.loginDataService.loginRes.set(res);
            this.authFlowService.setSelectedAccount(
              res?.data?.userInfo || null,
            );
            console.log('Login Set', res);
            this.loginDataService
              .loadAccountDetails()
              ?.pipe(takeUntil(this.destroy$))
              .subscribe(() => {
                if (this.loginDataService.isNameSetupRequired()) {
                  this.authFlowService.setCurrentStep(
                    AuthStep.NAME_VERIFICATION,
                  );
                  this.router.navigate(['/login/name-verification']);
                } else {
                  this.auth.setSession(res);
                  this.auth.redirect();
                }
              });
          }
        },
        error: (err) => {
          this.isLoggingIn.set(false);
          this.toaster.showBackendError(err);
        },
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
    this.updatePasswordInputType();
  }

  forgotPassword(): void {
    // switch flow so guards/routes know the intent
    this.authFlowService.setFlowType(FlowType.FORGOT_PASSWORD);

    // make sure method-selection is counted as completed (route requires it)
    const s = this.authFlowService.getCurrentState();
    if (!s.completedSteps.includes(AuthStep.METHOD_SELECTION)) {
      this.authFlowService.updateState({
        completedSteps: [...s.completedSteps, AuthStep.METHOD_SELECTION],
      });
    }

    // optional hygiene
    this.authFlowService.setData('password', '');
    this.authFlowService.dispatch({ type: 'MOBILE_STEP' });

    // advance + navigate
    this.authFlowService.setCurrentStep(AuthStep.MOBILE_ENTRY);
    this.router.navigate(['/login/mobile-entry']);
  }

  getPasswordError(): string {
    const control = this.passwordForm?.get('password');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return this.transloco.translate('global.enter_password.placeholder');
    }

    if (control.hasError('minLength')) {
      return this.transloco.translate('global.error_password.txt');
    }

    if (control.hasError('invalidCredentials')) {
      return this.transloco.translate('login.incorrect_password_or_id.txt');
    }

    return '';
  }
}
