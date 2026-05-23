import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  signal,
  inject,
  DestroyRef,
  computed,
} from '@angular/core';
import { ModalController, IonSpinner } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { faEnvelope } from '@fortawesome/pro-regular-svg-icons';
import { CommonModule } from '@angular/common';
import {
  Observable,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  switchMap,
  tap,
} from 'rxjs';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isMobile } from '@shared/utils/platform';
import { TimerService } from '@shared/services/timer-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-otp-dialog',
  templateUrl: './otp-dialog.component.html',
  standalone: true,
  imports: [
    HesButtonModule,
    TranslocoDirective,
    CommonModule,
    HessaInputComponent,
    ReactiveFormsModule,
    IonSpinner,
  ],
  providers: [TimerService],
})
export class OtpDialogComponent implements OnInit, OnDestroy {
  faEnvelope = faEnvelope;

  private intervalId: null | ReturnType<typeof setInterval> = null;

  @Input() phoneNumber: string;

  @Input() verifyOtp: (otp: string) => Observable<boolean | HttpErrorResponse>;
  @Input() resendOtp: () => void;
  @Input() timerService: TimerService;

  private modalCtrl = inject(ModalController);
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private readonly abortController = new AbortController();

  OTPForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
  });

  timer = computed(() => {
    return this.timerService.timer();
  });

  isTimerOn = computed(() => {
    return this.timerService.isTimerOn();
  });

  isMobile = isMobile();
  readonly isShowLoader = signal(false);
  ngOnInit() {
    if (this.isMobile) {
      this.setupOtpListener();
    }
    this.OTPForm.controls.otp.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((v) => v?.length === 4),
        distinctUntilChanged(),
        debounceTime(500),
        switchMap((value) => {
          this.isShowLoader.set(true);
          return this.onVerifyOTp(value).pipe(
            finalize(() => this.isShowLoader.set(false)),
          );
        }),
      )
      .subscribe();
  }

  setupOtpListener() {
    if ('OTPCredential' in window) {
      // Handle WebOTP API interaction
      (navigator.credentials as any)
        .get({
          otp: { transport: ['sms'] },
          signal: this.abortController.signal,
        })
        .then((otpCredential: any) => {
          if (otpCredential && otpCredential.code) {
            this.OTPForm.controls.otp.setValue(otpCredential.code);
          }
        })
        .catch((err: any) => {
          console.log('Error fetching OTP:', err);
        });
    }
  }

  ngOnDestroy() {
    // Clear the interval when the component is destroyed.
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.abortController.abort();
  }

  onVerifyOTp(otp: string): Observable<boolean | HttpErrorResponse> {
    return this.verifyOtp(otp).pipe(
      tap((data) => {
        if (data === true) {
          this.modalCtrl.dismiss(null, 'success');
          return;
        }
        if (data instanceof HttpErrorResponse) {
          this.handleHttpError(data);
        }
      }),
    );
  }

  onResendOtp() {
    this.resendOtp();
    this.timerService.startTimer();
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  private handleHttpError(data: HttpErrorResponse): void {
    if (closeOtpModalonThisErrors.includes(data.error.messageRef)) {
      this.modalCtrl.dismiss(null, 'success');
      return;
    }
    this.OTPForm.controls.otp.setErrors({ inValidOTP: true });
  }
}

const closeOtpModalonThisErrors = [
  'api.error.auth.account.paused.text',
  'api.error.auth.account.deactivated.text',
];
