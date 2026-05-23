import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  AuthFlowService,
  AuthStep,
  FlowType,
} from '../../services/auth-flow.service';
import { MascotService } from '../../services/mascot.service';
import { UserType } from '@shared/enums';
import { DsInputComponent } from '@ds/input/input.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faCheckCircle,
  faCircle,
  faExclamationCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginDataService } from '@pages/login/services/login-data.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DsButtonComponent } from '@ds/button/button.component';
import { AuthService } from '@auth/auth.service';

@Component({
  selector: 'app-password-setup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsInputComponent,
    DsIconComponent,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './password-setup.component.html',
})
export class PasswordSetupComponent implements OnInit, OnDestroy {
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faCheck = faCheckCircle;
  faCircle = faCircle;
  protected readonly faWarning = faExclamationCircle;
  private destroy$ = new Subject<void>();

  private loginData = inject(LoginDataService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private authFlowService = inject(AuthFlowService);
  private mascotService = inject(MascotService);
  private toaster = inject(HesToasterService);
  private fb = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  passwordForm: FormGroup;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isCreating = signal(false);

  passwordEyeIcon = computed(() =>
    this.showPassword() ? this.faEyeSlash : this.faEye,
  );
  confirmPasswordEyeIcon = computed(() =>
    this.showConfirmPassword() ? this.faEyeSlash : this.faEye,
  );

  constructor() {
    this.passwordForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Remove the passwordMismatch error if passwords match
      if (confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }

    return null;
  }

  ngOnInit(): void {
    this.setupMascot();
    //check if national Id is not set then fetch national id and set it in login data
    this.authFlowService.setSelectedAccount(
      this.loginData.loginRes()?.data?.userInfo,
    );
    this.loginData
      .loadAccountDetails()
      ?.pipe(takeUntil(this.destroy$))
      .subscribe();
    this.authFlowService.setSkipButtonVisibility(
      this.authFlowService.getCurrentState().flowType == FlowType.OTP_LOGIN,
    );
    this.authFlowService.setCurrentStep(AuthStep.PASSWORD_SETUP);
    setTimeout(() => {
      this.updatePasswordInputTypes();
    });
    this.authFlowService.continue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.createPassword();
      });

    this.authFlowService.skipStep$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.skipStep();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupMascot(): void {
    const userType =
      this.authFlowService.getCurrentState().userType || UserType.STUDENT;
    const selectedAccount =
      this.authFlowService.getCurrentState().selectedAccount;
    const userId = selectedAccount?.id || '';
    this.mascotService.updateMascotByScenario('setup_password', userType, {
      userId,
      national_id:
        this.authFlowService.getCurrentState().nationalId ||
        this.loginData.nationalId() ||
        '',
    });
  }

  private updatePasswordInputTypes(): void {
    const passwordInput = document.querySelector(
      'input[placeholder="123456789"]',
    ) as HTMLInputElement;
    const confirmInput = document.querySelector(
      'input[placeholder="123456789"]',
    ) as HTMLInputElement;

    if (passwordInput) {
      passwordInput.type = this.showPassword() ? 'text' : 'password';
    }
    if (confirmInput) {
      confirmInput.type = this.showConfirmPassword() ? 'text' : 'password';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
    this.updatePasswordInputTypes();
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
    this.updatePasswordInputTypes();
  }

  getPasswordError(): string {
    const passwordControl = this.passwordForm.get('password');
    if (!passwordControl || !passwordControl.touched) return '';

    if (passwordControl.hasError('required')) {
      return this.transloco.translate('global.enter_password.placeholder');
    }
    if (passwordControl.hasError('minlength')) {
      return this.transloco.translate('global.error_password.txt');
    }
    return '';
  }

  getConfirmPasswordError(): string {
    const confirmControl = this.passwordForm.get('confirmPassword');
    if (!confirmControl || !confirmControl.touched) return '';

    if (confirmControl.hasError('required')) {
      return this.transloco.translate('global.passwords_not_match.txt');
    }
    if (confirmControl.hasError('passwordMismatch')) {
      return this.transloco.translate('global.password_not_match.txt');
    }
    return '';
  }

  get password() {
    return this.passwordForm.get('password')?.value || '';
  }

  get confirmPassword() {
    return this.passwordForm.get('confirmPassword')?.value || '';
  }

  skipStep() {
    if (this.loginData.isNameSetupRequired()) {
      this.authFlowService.setCurrentStep(AuthStep.NAME_VERIFICATION);
      this.router.navigate(['/login/name-verification']);
    } else {
      this.auth.setSession(this.loginData.loginRes()!);
      this.auth.redirect();
    }
  }

  createPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    let payload: { nationalId: string; password: string; studentId: number } = {
      password: this.password,
      nationalId: this.loginData.nationalId(),
      studentId: this.loginData.user()?.userTypeId!,
    };
    this.loginData.setupPassword(payload).subscribe({
      next: (data) => {
        this.isCreating.set(false);
        if (data.success) {
          this.router.navigate(['/login/success']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isCreating.set(false);
        this.toaster.showBackendError(err);
      },
    });
  }
}
