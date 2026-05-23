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
} from '@pages/login/services/auth-flow.service';
import {
  MascotService,
  MascotSituation,
  MascotContext,
} from '@pages/login/services/mascot.service';
import { UserType } from '@shared/enums';
import { DsInputComponent } from '@ds/input/input.component';
import { ILoginPayload, LOGIN_CHANNEL } from '@auth/model';
import { AuthService } from '@auth/auth.service';
import { TimerService } from '@shared/services/timer-service';
import { LoginDataService } from '@pages/login/services/login-data.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-mobile-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsInputComponent,
    TranslocoDirective,
  ],
  templateUrl: './mobile-entry.component.html',
})
export class MobileEntryComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authFlowService = inject(AuthFlowService);
  private readonly loginDataService = inject(LoginDataService);
  private readonly mascotService = inject(MascotService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private timerService = inject(TimerService);
  private toaster = inject(HesToasterService);
  otpChannel = signal<LOGIN_CHANNEL>('sms');
  AuthHeaders = signal<{ [key: string]: string } | null>(null);

  private destroy$ = new Subject<void>();
  mobileForm: FormGroup;
  isSubmitting = signal(false);

  // Saudi mobile number validator
  private saudiMobileValidator(control: any) {
    const value = control.value?.replace(/\D/g, '');
    if (!value) return null;

    if (value.length !== 9) {
      return { invalidLength: true };
    }

    if (!value.startsWith('5')) {
      return { invalidPrefix: true };
    }

    return null;
  }

  // Computed properties for validation messages
  validationMessage = computed(() => {
    const control = this.mobileForm?.get('mobile');
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Mobile number is required';
    }

    if (control.hasError('invalidLength')) {
      return 'Mobile number must be 9 digits';
    }

    if (control.hasError('invalidPrefix')) {
      return 'Mobile number must start with 5';
    }

    return '';
  });

  hasError = computed(() => {
    const control = this.mobileForm?.get('mobile');
    return !!(control && control.invalid && control.touched);
  });

  isValid = signal(false);

  ngOnInit(): void {
    this.initForm();
    this.setupMascot();
    this.authFlowService.setCurrentStep(AuthStep.MOBILE_ENTRY);

    // Listen for continue button clicks
    this.authFlowService.continue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleContinue();
      });

    // Update canContinue based on form validity
    this.mobileForm.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isValid.set(this.mobileForm.valid);
        this.authFlowService.setCanContinue(this.isValid());
      });

    // Check for previously entered mobile number
    const currentState = this.authFlowService.getCurrentState();
    if (currentState.mobileNumber) {
      this.mobileForm.patchValue({ mobile: currentState.mobileNumber });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.mobileForm = this.fb.group({
      mobile: ['', [Validators.required, this.saudiMobileValidator]],
    });
    this.authFlowService.setCanContinue(false);
  }

  private setupMascot(): void {
    this.authFlowService.dispatch({ type: 'MOBILE_STEP' });
  }

  private handleContinue(): void {
    if (this.mobileForm.valid && !this.isSubmitting()) {
      console.log('Handle Continue', this.mobileForm.value);
      this.submitMobileNumber();
    }
  }

  private submitMobileNumber(): void {
    const mobileValue = this.mobileForm.get('mobile')?.value;
    if (!mobileValue) return;

    this.isSubmitting.set(true);
    console.log('Submitting mobile number:', mobileValue);

    // Store in auth flow
    this.authFlowService.setMobileNumber(mobileValue);
    this.loginDataService.mobileNumber.set(mobileValue);

    this.login();
  }

  // Handle input formatting (remove non-digits, limit to 9)
  onMobileInput(value: string): void {
    let cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length > 9) {
      cleanValue = cleanValue.substring(0, 9);
    }
    this.mobileForm.patchValue({ mobile: cleanValue }, { emitEvent: false });
  }

  private login() {
    let payload: ILoginPayload;
    // clear temp auth headers at the begining of flow, in case the user did not choose a profile and started flow again
    this.AuthHeaders.set(null);
    // Check if the timer is already running (meaning an OTP is already being processed)
    if (this.timerService.isTimerOn()) {
      this.timerService.resetTimer();
    }

    if (this.mobileForm.value) {
      payload = {
        type: 'mobile',
        channel: this.otpChannel(),
        phoneNumber: this.mobileForm.value.mobile,
      };
      this.isSubmitting.set(true);

      // Call the login API
      this.authService.login(payload).subscribe({
        next: (data) => {
          if (data.success) {
            this.mobileForm.setErrors(null);
            // this.phoneNumberErr.set(null);
            this.isSubmitting.set(false);

            // Start the timer after successful login
            this.timerService.startTimer();
            this.router.navigate(['/login/otp-entry']);
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.mobileForm.setErrors({ invalid: true });
          this.toaster.showBackendError(err);
        },
      });
    }
  }
}
