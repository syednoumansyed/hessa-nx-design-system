import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { isMobile } from '@shared/utils/platform';
import { NgxOtpInputConfig, NgxOtpInputModule } from 'ngx-otp-input';
import { ModalController } from '@ionic/angular/standalone';
import { HesAlertComponent } from '@ui-kit/hes-alert/hes-alert.component';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import {
  Observable,
  catchError,
  distinctUntilChanged,
  map,
  of,
  tap,
} from 'rxjs';
import { openLoginModal } from '@shared/utils/otp-modal';
import { UserManagementService } from '@pages/user-management/user-management.service';
import { ActivatedRoute } from '@angular/router';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { ToastrService } from 'ngx-toastr';
import { UserType } from '@shared/enums';
import { getPhoneNumberErrorMessage } from '@validators/phoneNumber';
import { TimerService } from '@shared/services/timer-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-change-number',
  templateUrl: './user-change-number.component.html',
  standalone: true,
  imports: [
    HesButtonModule,
    TranslocoDirective,
    HesAlertComponent,
    ReactiveFormsModule,
    HessaInputComponent,
    NgxOtpInputModule,
    TranslocoDirective,
  ],
  providers: [TimerService],
})
export class UserChangeNumberComponent implements OnInit, OnDestroy {
  isMobile = signal(isMobile());

  private modalCtrl = inject(ModalController);
  private translocoService = inject(TranslocoService);
  private user = inject(UserManagementService);
  private route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);
  private readonly timerService = inject(TimerService);
  private destroyRef = inject(DestroyRef);
  phoneNumberErr = signal<string | null>('');

  timer = computed(() => {
    return this.timerService.timer();
  });

  intervalId = signal<any>(undefined);
  isTimerOn = computed(() => this.timerService.isTimerOn());
  otpInputConfig = signal<NgxOtpInputConfig>({
    otpLength: 4,
    autofocus: true,
    isPasswordInput: true,
    classList: {
      container: 'flex gap-4 items-center',
      inputBox: '!m-0',
      input:
        '!px-4 !py-3 !border-transparent !bg-[#F5F8FF] focus:!border-primary-400 focus:!w-16 focus:!h-16 !w-12 !h-12 transition-[height,width]',
      inputFilled: '!border-primary-400',
    },
  });
  otp = signal('');
  otpSent = signal(false);
  message = signal('');

  phoneNumberControl = new FormControl('', [
    Validators.minLength(9),
    Validators.required,
  ]);

  userId: string | null;
  @Input() userType: UserType;
  @Input() phoneNumber: string;
  @Input() onDismiss: () => void;
  @Input() onUpdateSuccess: () => void;

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.timerService.resetTimer();
    this.phoneNumberControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.timerService.resetTimer();
      });
    this.phoneNumberControl.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        this.getContactNumberErrorMessage();
      });

    this.phoneNumberControl.statusChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value === 'INVALID') {
          this.otp.set('');
          this.otpSent.set(false);
          if (this.intervalId) {
            clearInterval(this.intervalId());
          }
        } else if (value === 'VALID') {
          if (!this.isMobile()) {
            this.sendOtp();
          }
        }
      });
  }

  sendOtp(openOtpModal = true) {
    const phoneNumber = this.phoneNumberControl.value!;

    if (this.timerService.isTimerOn()) {
      // Timer is already running, so just open the OTP modal
      if (openOtpModal && this.isMobile()) {
        this.openOtpModal();
      }
      this.otpSent.set(true);
      this.sentOtpMessage();
    } else {
      // Timer is not running, so send OTP and start the timer
      this.user
        .sendChangeNumberReq(this.userType, this.userId!, phoneNumber)
        .subscribe({
          next: () => {
            this.otpSent.set(true);
            this.sentOtpMessage();
            if (this.isMobile()) {
              if (openOtpModal) {
                this.openOtpModal();
              }
            }
            this.timerService.startTimer();
          },
          error: ({ error }) => {
            this.toastr.error('', error?.message);
            this.cancel();
          },
        });
    }
  }

  private openOtpModal() {
    openLoginModal({
      modalCtrl: this.modalCtrl,
      phoneNumber: this.phoneNumberControl.value!,
      verifyOtp: (otp: string) => this.onVerifyOTp(otp),
      resendOtp: () => this.resendOtp(),
      timerService: this.timerService,
    });
  }

  onVerifyOTp(otp: string): Observable<boolean> {
    this.otp.set(otp);
    return this.updateNumber();
  }

  resendOtp() {
    this.sendOtp(false);
  }

  cancel() {
    this.otp.set('');
    this.otpSent.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId());
    }
    this.onDismiss();
  }

  updateOtp(otp: string) {
    this.otp.set(otp);
  }

  updateNumber() {
    return this.user
      .verifyOtp(
        this.userType,
        this.userId!,
        this.otp(),
        this.phoneNumberControl.value!,
      )
      .pipe(
        tap(() => {
          this.toastr.success(
            '',
            this.translocoService.translate(
              'user_management.successfully_updated_number.txt',
            ),
          );
          this.timerService.resetTimer();
        }),
        map((_data) => {
          this.cancel();
          this.onUpdateSuccess?.();
          return true;
        }),
        catchError((err) => {
          if (!this.isMobile()) {
            this.toastr.error('', err?.error?.message);
          }
          return of(err);
        }),
      );
  }

  getContactNumberErrorMessage() {
    this.phoneNumberErr.set(
      getPhoneNumberErrorMessage(
        this.phoneNumberControl,
        this.translocoService,
      ),
    );
  }

  sentOtpMessage() {
    const sentOtpMessage = this.translocoService.translate(
      'global.sent_otp_msg.txt',
    );
    const enterToContinueMessage = this.translocoService.translate(
      'global.enter_to_continue.txt',
    );
    this.message.set(
      `${sentOtpMessage} +966 ${this.phoneNumberControl.value}, ${enterToContinueMessage}`,
    );
  }
  ngOnDestroy() {
    // Clear the interval when the component is destroyed.
    if (this.intervalId) {
      clearInterval(this.intervalId());
    }
  }
}
