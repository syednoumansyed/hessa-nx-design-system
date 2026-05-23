// otp-entry.component.ts
import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  computed,
  inject,
  viewChildren,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { catchError, map, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AuthFlowService,
  AuthStep,
  FlowType,
} from '../../services/auth-flow.service';
import { MascotSituation, MascotContext } from '../../services/mascot.service';
import { TimerService } from '@shared/services/timer-service';
import { DsInputComponent } from '@ds/input/input.component';
import { ILoginPayload } from '@auth/model';
import { AuthService } from '@auth/auth.service';
import { LoginDataService } from '@pages/login/services/login-data.service';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { UserType } from '@shared/enums';
import { LoginVerifyResponse } from '@pages/login/data-access/user-profile.interface';

@Component({
  selector: 'app-otp-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DsInputComponent,
    TranslocoDirective,
    TranslocoPipe,
  ],
  templateUrl: './otp-entry.component.html',
})
export class OtpEntryComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authFlowService = inject(AuthFlowService);
  private readonly timerService = inject(TimerService);
  private readonly loginService = inject(LoginDataService);
  private readonly authService = inject(AuthService);
  private readonly transloco = inject(TranslocoService);
  private readonly toaster = inject(HesToasterService);
  private isSubmitting = signal(false);

  private destroy$ = new Subject<void>();

  // Form controls for OTP digits
  otpForm = new FormGroup({
    digit1: new FormControl(''),
    digit2: new FormControl(''),
    digit3: new FormControl(''),
    digit4: new FormControl(''),
  });

  // Get reference to all ds-input components
  otpInputs = viewChildren(DsInputComponent);
  otpValue = signal('');
  hasError = signal(false);
  errorMessage = signal('');
  isVerifying = signal(false);
  otpSendCount = signal(0);
  canResend = computed(
    () => !this.timerService.isTimerOn() && this.otpSendCount() < 3,
  );
  isResending = signal(false);

  remainingTime = this.timerService.timer;
  private resendTimer: any;

  // Computed to check if all OTP digits are filled
  isOtpComplete = computed(() => this.isFourDigits(this.otpValue()));
  private isFourDigits(s: string) {
    return /^\d{4}$/.test(s);
  }

  ngOnInit(): void {
    this.setupMascot();
    this.authService.clearData();
    this.authFlowService.setCurrentStep(AuthStep.OTP_ENTRY);
    this.authFlowService.dispatch({
      type: 'CUSTOM',
      situation: MascotSituation.INSTRUCTION,
      context: MascotContext.OTP_ENTRY,
      message: this.transloco.translate('login.enter_otp_sent.title', {
        mobile_number: this.authFlowService.getCurrentState().mobileNumber,
      }),
    });

    // Listen for continue button clicks
    this.authFlowService.continue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleContinue();
      });

    // fresh start
    this.otpForm.reset();
    this.otpValue.set('');
    this.authFlowService.setData('otp', null);
    this.authFlowService.setCanContinue(false);

    setTimeout(() => {
      const cmp = this.otpInputs()?.[0];
      const el = cmp?.inputElement?.()?.nativeElement;
      el?.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  private readonly names = ['digit1', 'digit2', 'digit3', 'digit4'] as const;
  // Track previous values to infer backspace intent cleanly (unused, removed)
  // private lastVals = ['', '', '', ''];

  onDigitInput(raw: string, idx: number) {
    const clean = (raw ?? '').replace(/\D/g, '');
    const names = this.names;
    const ctrl = this.otpForm.get(names[idx]) as FormControl;

    const cmp = this.otpInputs()?.[idx];
    const el = cmp?.inputElement?.()?.nativeElement;

    if (!clean) {
      const was = (ctrl.value ?? '').toString();
      ctrl.setValue('', { emitEvent: false });

      if (!was && idx > 0) {
        const prev = this.otpForm.get(names[idx - 1]) as FormControl;
        prev.setValue('', { emitEvent: false });
        this.focusInput(idx - 1);
      }
      this.updateStateAndMaybeVerify();
      return;
    }

    const first = clean.charAt(0);
    if (ctrl.value !== first) {
      ctrl.setValue(first, { emitEvent: false });
    }
    if (el && el.value !== first) el.value = first;

    const extras = clean.slice(1);
    let j = idx + 1;
    for (const ch of extras) {
      if (j > 3) break;
      this.otpForm.get(names[j++])?.setValue(ch, { emitEvent: false });
    }

    const codeCompletedAfterDistribution = this.isFourDigits(this.getOtp());

    if (extras.length) {
      // iOS autofill or fast multi-char paste into first box.
      // If we completed the code, keep focus on last box WITHOUT selecting its content.
      if (codeCompletedAfterDistribution) {
        this.focusInput(3, false); // focus last digit without select to avoid highlight
      } else {
        // partial distribution; move focus to next empty
        this.focusNextEmptyFrom(idx + 1);
      }
    } else {
      // normal single char entry; move focus to next empty if any
      if (idx < 3) this.focusNextEmptyFrom(idx + 1);
    }

    this.updateStateAndMaybeVerify();
  }

  private focusNextEmptyFrom(startIndex: number) {
    for (let i = startIndex; i < 4; i++) {
      const v = (this.otpForm.get(this.names[i])?.value ?? '').toString();
      if (!v) {
        this.focusInput(i);
        return;
      }
    }
    // nothing empty; keep current focus or move to last
    this.focusInput(Math.min(3, startIndex));
  }

  private focusInput(index: number, select: boolean = true) {
    setTimeout(() => {
      const cmp = this.otpInputs()?.[index];
      const el = cmp?.inputElement?.()?.nativeElement;
      el?.focus();
      if (select) {
        // Only select if we explicitly want to (avoid selection after full autofill)
        el?.select?.();
      }
    }, 0);
  }

  private getOtp(): string {
    return this.names
      .map((n) => (this.otpForm.get(n)?.value ?? '').toString())
      .join('');
  }

  private updateStateAndMaybeVerify() {
    this.clearError();
    const otp = this.getOtp();
    this.otpValue.set(otp);
    this.authFlowService.setData('otp', this.isFourDigits(otp) ? otp : null);
    this.authFlowService.setCanContinue(
      this.isFourDigits(otp) && !this.isVerifying(),
    );
  }

  private setupMascot(): void {
    this.authFlowService.dispatch({
      type: 'OTP_INIT',
      phone: `+966${this.authFlowService.getCurrentState().mobileNumber}`,
    });
  }

  private handleContinue(): void {
    const complete = this.isFourDigits(this.getOtpFromForm());
    if (complete && !this.isVerifying()) {
      this.verifyOtp();
    }
    // If the code is incomplete we simply wait for further user input.
  }

  private clearError(): void {
    this.hasError.set(false);
    this.errorMessage.set('');
  }

  private verifyOtp(): void {
    if (!this.isOtpComplete() || this.isVerifying()) return;

    this.isVerifying.set(true);
    this.authFlowService.setCanContinue(false);
    const otp = Object.values(this.otpForm.value).join('');
    // Store OTP in flow state
    this.authFlowService.setData('otp', otp);
    this.authService
      .verifyOtp(
        {
          channel: this.loginService.otpChannel(),
          phoneNumber: this.loginService.mobileNumber() ?? '',
          code: otp,
          selectedProfile: null,
        },
        this.loginService.tempAuthHeaders()!,
      )
      .pipe(
        map((res) => {
          // Persist the timer and navigation state only after a successful response.
          this.timerService.resetTimer();
          if (res.success) {
            this.isVerifying.set(false);
            this.loginService.loginRes.set(res);
            // if multiple profiles detected, we need to check if we need to show the profile selection screen
            if (res.data.profilesDetected) {
              const allUsers = res.data.users;
              const currentUserType =
                this.authFlowService.getCurrentState().userType;
              const currentFlowType =
                this.authFlowService.getCurrentState().flowType;
              let filtered = [];

              // Account setup (onboarding) should only show student profiles
              if (currentFlowType === FlowType.ONBOARDING) {
                filtered = allUsers.filter((u) => u.type === UserType.STUDENT);
              } else if (currentUserType === UserType.GUARDIAN) {
                // Guardian can see Guardian and Student
                filtered = allUsers.filter(
                  (u) =>
                    u.type === UserType.GUARDIAN || u.type === UserType.STUDENT,
                );
              } else {
                // Others can only see their own type
                filtered = allUsers.filter((u) => u.type === currentUserType);
              }

              this.loginService.otp.set(otp);
              this.loginService.users.set(res.data.users);
              this.loginService.tempAuthHeaders.set({
                authorization: `Bearer ${res.data.token.accessToken}`,
                refreshToken: res.data.token.refreshToken,
              });
              if (filtered.length === 1) {
                this.authFlowService.setSelectedAccount(filtered[0]);
                this.verifyOtpWithProfile();
                return;
              }
              // go to next step to select profile
              this.authFlowService.setCurrentStep(AuthStep.ACCOUNT_SELECTION);
              this.router.navigate(['/login/account-selection']);
              return;
            } else {
              const user = res.data.userInfo;
              this.authFlowService.setSelectedAccount(user);
              this.getAccountDetails(res);
              return;
            }
          } else {
            this.handleFailedVerification();
            return;
          }
        }),
        catchError((err) => {
          // this.toaster.showBackendError(err);
          const status = err.status;
          if (status === 400) {
            const userStatus = err.error.data.status;
            if (userStatus !== 'ACTIVE') {
              this.router.navigate([
                '/login/no-access',
                userStatus.toLowerCase(),
              ]);
              return of(err);
            }
          }
          this.handleFailedVerification();
          return of(err);
        }),
      )
      .subscribe();
  }

  verifyOtpWithProfile() {
    this.authService
      .verifyOtp(
        {
          channel: this.loginService.otpChannel(),
          phoneNumber: this.loginService.mobileNumber() ?? '',
          code: this.loginService.otp() ?? '',
          selectedProfile:
            this.authFlowService.selectedAccountAsPayload() ?? null,
        },
        this.loginService.tempAuthHeaders()!,
      )
      .subscribe({
        next: (verifyRes) => {
          // Persist the verification response to keep the rest of the flow in sync.
          if (verifyRes.success) {
            this.loginService.loginRes.set(verifyRes);
            this.getAccountDetails(verifyRes);
          } else {
            this.toaster.error(
              this.transloco.translate('global.wrong_msg.title'),
            );
          }
        },
        error: (err) => {
          this.toaster.showBackendError(err);
        },
      });
  }

  getAccountDetails(res: LoginVerifyResponse) {
    this.loginService
      .loadAccountDetails()
      ?.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.authFlowService.dispatch({ type: 'OTP_SUCCESS' });
          // proceed to name verification if needed
          if (this.loginService.isNameSetupRequired()) {
            this.authFlowService.setCurrentStep(AuthStep.NAME_VERIFICATION);
            this.router.navigate(['/login/name-verification']);
          } else {
            if (this.loginService.isPasswordSetupRequired()) {
              this.authFlowService.setCurrentStep(AuthStep.PASSWORD_SETUP);
              this.router.navigate(['/login/password-setup']);
            } else {
              // otherwise we are done, set session and redirect
              this.authService.setSession(res);
              this.authService.redirect();
            }
          }
        },
        error: (err) => {
          this.toaster.showBackendError(err);
          this.isVerifying.set(false);
        },
      });
  }

  isMultipleProfiles() {
    return false; // retained for potential template usage; otherwise could remove
  }

  handleMultipleProfile() {}

  private handleFailedVerification(): void {
    this.hasError.set(true);
    this.errorMessage.set(
      this.transloco.translate('login.enter_correct_otp.title'),
    );
    this.authFlowService.dispatch({ type: 'OTP_ERROR', reason: 'wrong' });
    this.isVerifying.set(false);
    this.authFlowService.setCanContinue(false);

    // Add error state to form - ds-input will automatically style based on form errors
    Object.keys(this.otpForm.controls).forEach((key) => {
      this.otpForm.get(key)?.setErrors({ invalid: true });
      this.otpForm.get(key)?.markAsTouched();
    });
  }

  private getOtpFromForm(): string {
    return this.names
      .map((n) => (this.otpForm.get(n)?.value ?? '').toString())
      .join('');
  }

  resendOtp(): void {
    if (!this.canResend() || this.isResending()) return;

    this.isResending.set(true);
    // Reset form
    this.otpForm.reset();
    this.clearError();
    // Resend OTP here
    this.sendOTP();
  }

  @HostListener('document:paste', ['$event'])
  onDocPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (!digits) return;
    e.preventDefault();
    const children = this.otpInputs();
    const domInputs =
      (children
        ?.map((c) => c.inputElement?.()?.nativeElement)
        .filter(Boolean) as HTMLInputElement[]) || [];
    const active = document.activeElement as Element | null;
    let start = Math.max(
      0,
      domInputs.findIndex((el) => el === active),
    );
    if (start === -1) start = 0;
    const names = this.names;
    for (let i = 0; i < digits.length && start + i < 4; i++) {
      this.otpForm
        .get(names[start + i])
        ?.setValue(digits[i], { emitEvent: false });
    }
    this.updateStateAndMaybeVerify();
    // After full paste, if code complete, focus last without selection; else next empty
    if (this.isFourDigits(this.getOtp())) {
      this.focusInput(3, false);
    } else {
      this.focusNextEmptyFrom(start);
    }
  }

  private sendOTP() {
    let payload: ILoginPayload;
    // clear temp auth headers at the begining of flow, in case the user did not choose a profile and started flow again
    this.loginService.tempAuthHeaders.set(null);
    this.loginService.loginRes.set(null);

    // Check if the timer is already running (meaning an OTP is already being processed)
    if (this.timerService.isTimerOn()) {
      return; // Exit the function to prevent calling the login API again
    }
    payload = {
      type: 'mobile',
      channel: this.loginService.otpChannel(),
      phoneNumber: this.loginService.mobileNumber(),
    };

    this.isSubmitting.set(true);
    this.otpSendCount.set(this.otpSendCount() + 1);
    this.authService.login(payload).subscribe({
      next: (data) => {
        this.isResending.set(false);
        this.isVerifying.set(false);
        this.isSubmitting.set(false);
        if (data.success) {
          // this.phoneNumberErr.set(null);
          // Start the timer after successful login
          this.timerService.startTimer();
          this.toaster.success(
            this.transloco.translate('login.otp_resent.txt'),
          );
        }
      },
      error: (err) => {
        this.isResending.set(false);
        this.isVerifying.set(false);
        this.isSubmitting.set(false);
        this.toaster.showBackendError(err);
      },
    });
  }
}
