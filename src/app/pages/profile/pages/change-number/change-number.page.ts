import {
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';

import { DsInputComponent } from '@ds/input/input.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { AnimatedIconComponent } from '@ds-layout/components/animated-icon/animated-icon.component';
import { MobileEntryShellComponent } from '@shared/components/mobile-entry-shell/mobile-entry-shell.component';
import { AuthService } from '@auth/auth.service';
import { UserManagementService } from '@pages/user-management/user-management.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TimerService } from '@shared/services/timer-service';
import { UserType } from '@shared/enums';
import { catchError, map, of, tap } from 'rxjs';

@Component({
  selector: 'app-change-number',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    DsInputComponent,
    DsButtonComponent,
    AnimatedIconComponent,
    MobileEntryShellComponent,
  ],
  providers: [TimerService],
  templateUrl: './change-number.page.html',
  styleUrls: ['./change-number.page.scss'],
})
export class ChangeNumberPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly userManagement = inject(UserManagementService);
  private readonly toaster = inject(HesToasterService);
  private readonly transloco = inject(TranslocoService);
  readonly timerService = inject(TimerService);

  readonly currentStep = signal<'mobile' | 'otp' | 'success'>('mobile');
  readonly isLoading = signal(false);
  readonly isVerifying = signal(false);
  readonly hasOtpError = signal(false);

  readonly userType = signal<UserType>(UserType.STUDENT);
  readonly userId = signal<string>('');
  private currentPhoneNumber = '';

  phoneNumberControl = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(9),
      this.sameNumberValidator(),
    ],
  });

  otpForm = new FormGroup({
    digit1: new FormControl(''),
    digit2: new FormControl(''),
    digit3: new FormControl(''),
    digit4: new FormControl(''),
  });

  otpInputs = viewChildren(DsInputComponent);

  readonly otpValue = signal('');
  readonly canResend = computed(() => !this.timerService.isTimerOn());
  readonly remainingTime = this.timerService.timer;
  readonly isOtpComplete = computed(() => /^\d{4}$/.test(this.otpValue()));

  get animatedIconSize(): string {
    return window.innerWidth <= 768 ? '250px' : '350px';
  }

  readonly mascotImage = computed(() => {
    const type = this.userType();
    const step = this.currentStep();

    if (step === 'otp') {
      if (type === UserType.STUDENT)
        return 'assets/mascot/student/instruction-otp_entry.svg';
      if (type === UserType.GUARDIAN)
        return 'assets/mascot/guardian/instruction-otp_entry.svg';
      return 'assets/mascot/personnel/instruction-otp_entry.svg';
    }

    // mobile step — default face per role
    if (type === UserType.GUARDIAN) return 'assets/mascot/guardian/default.svg';
    return 'assets/mascot/default/default.svg';
  });

  readonly otpSpeechBubble = computed(() =>
    this.transloco.translate('login.enter_otp_sent.title', {
      mobile_number: `+966 ${this.phoneNumberControl.value}`,
    }),
  );

  private sameNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const entered = (control.value ?? '').toString().trim();
      return entered && entered === this.currentPhoneNumber
        ? { sameNumber: true }
        : null;
    };
  }

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;

    // Strip country code prefix (+966 or 966) to get the local part
    this.currentPhoneNumber = user.phoneNumber.replace(/^\+?966/, '');

    const routeStudentId =
      this.route.snapshot.paramMap.get('studentId') ??
      this.route.snapshot.parent?.paramMap.get('studentId');

    if (routeStudentId) {
      this.userType.set(UserType.STUDENT);
      this.userId.set(routeStudentId);
    } else {
      this.userType.set(user.type);
      this.userId.set(String(user.userTypeId));
    }

    this.timerService.resetTimer();
  }

  // ── Mobile step ─────────────────────────────────────────────────────────────

  onContinue(): void {
    if (this.phoneNumberControl.invalid) {
      this.phoneNumberControl.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    const phoneNumber = this.phoneNumberControl.value;

    if (this.timerService.isTimerOn()) {
      this.isLoading.set(false);
      this.currentStep.set('otp');
      return;
    }

    this.userManagement
      .sendChangeNumberReq(this.userType(), this.userId(), phoneNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.timerService.startTimer();
          this.otpForm.reset();
          this.otpValue.set('');
          this.hasOtpError.set(false);
          this.currentStep.set('otp');
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toaster.showBackendError(err);
        },
      });
  }

  // ── OTP step ─────────────────────────────────────────────────────────────────

  private readonly digitNames = [
    'digit1',
    'digit2',
    'digit3',
    'digit4',
  ] as const;

  onDigitInput(raw: string, idx: number): void {
    const clean = (raw ?? '').replace(/\D/g, '');
    const name = this.digitNames[idx];
    const ctrl = this.otpForm.get(name) as FormControl;

    if (!clean) {
      ctrl.setValue('', { emitEvent: false });
      if (!ctrl.value && idx > 0) {
        this.otpForm
          .get(this.digitNames[idx - 1])
          ?.setValue('', { emitEvent: false });
        this.focusOtpInput(idx - 1);
      }
      this.syncOtpValue();
      return;
    }

    ctrl.setValue(clean.charAt(0), { emitEvent: false });

    // distribute extra chars (paste / autofill)
    let j = idx + 1;
    for (const ch of clean.slice(1)) {
      if (j > 3) break;
      this.otpForm
        .get(this.digitNames[j++])
        ?.setValue(ch, { emitEvent: false });
    }

    if (j <= 4 && j > idx + 1) {
      this.focusOtpInput(Math.min(3, j));
    } else if (idx < 3) {
      this.focusOtpInput(idx + 1);
    }

    this.syncOtpValue();
  }

  onSubmitOtp(): void {
    if (!this.isOtpComplete() || this.isVerifying()) return;

    this.isVerifying.set(true);
    this.hasOtpError.set(false);

    this.userManagement
      .verifyOtp(
        this.userType(),
        this.userId(),
        this.otpValue(),
        this.phoneNumberControl.value,
      )
      .pipe(
        tap(() => this.timerService.resetTimer()),
        map(() => {
          this.currentStep.set('success');
        }),
        catchError((err) => {
          this.hasOtpError.set(true);
          Object.values(this.otpForm.controls).forEach((c) => {
            c.setErrors({ invalid: true });
            c.markAsTouched();
          });
          this.toaster.showBackendError(err);
          return of(null);
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.isVerifying.set(false));
  }

  onResendOtp(): void {
    if (!this.canResend()) return;

    const phoneNumber = this.phoneNumberControl.value;
    this.userManagement
      .sendChangeNumberReq(this.userType(), this.userId(), phoneNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.timerService.startTimer();
          this.otpForm.reset();
          this.otpValue.set('');
          this.hasOtpError.set(false);
        },
        error: (err) => this.toaster.showBackendError(err),
      });
  }

  goBackFromOtp(): void {
    this.currentStep.set('mobile');
    this.otpForm.reset();
    this.otpValue.set('');
    this.hasOtpError.set(false);
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  getPhoneNumberError(): string {
    const ctrl = this.phoneNumberControl;
    if (!ctrl.touched) return '';
    if (ctrl.hasError('required'))
      return this.transloco.translate('global.phone_number.label');
    if (ctrl.hasError('minlength'))
      return this.transloco.translate('global.error_phone_number.txt');
    if (ctrl.hasError('sameNumber'))
      return (
        this.transloco.translate(
          'profile.change_number.same_number_error.txt',
        ) || 'profile.change_number.same_number_error.txt'
      );
    return '';
  }

  goBack(): void {
    const routeStudentId =
      this.route.snapshot.paramMap.get('studentId') ??
      this.route.snapshot.parent?.paramMap.get('studentId');

    if (routeStudentId) {
      void this.router.navigate(['/profile', 'student', routeStudentId]);
    } else {
      void this.router.navigate(['/profile']);
    }
  }

  done(): void {
    this.goBack();
  }

  private syncOtpValue(): void {
    const val = this.digitNames
      .map((n) => (this.otpForm.get(n)?.value ?? '').toString())
      .join('');
    this.otpValue.set(val);
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterKey(event: KeyboardEvent): void {
    const step = this.currentStep();
    if (
      step === 'mobile' &&
      !this.phoneNumberControl.invalid &&
      !this.isLoading()
    ) {
      event.preventDefault();
      this.onContinue();
    } else if (step === 'otp' && this.isOtpComplete() && !this.isVerifying()) {
      event.preventDefault();
      this.onSubmitOtp();
    }
  }

  private focusOtpInput(index: number): void {
    setTimeout(() => {
      const el = this.otpInputs()?.[index]?.inputElement?.()?.nativeElement;
      el?.focus();
      el?.select?.();
    }, 0);
  }
}
