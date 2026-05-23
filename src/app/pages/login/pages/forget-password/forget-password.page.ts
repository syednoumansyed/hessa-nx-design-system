import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import {
  confirmPasswordValidator,
  getConfirmPasswordErrorMessage,
  getPasswordErrorMessage,
  passwordValidator,
} from '@validators/password';
import { openLoginModal } from '@shared/utils/otp-modal';
import {
  getNationalIdErrorMessage,
  nationalIdMax18Validator,
} from '@validators/nationalID';
import { getPhoneNumberErrorMessage } from '@validators/phoneNumber';
import { Observable, Subscription, merge, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ForgetPasswordService } from './forget-password.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { AuthService } from '@auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TimerService } from '@shared/services/timer-service';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.page.html',
  standalone: true,
  imports: [
    HesButtonModule,
    TranslocoDirective,
    HessaInputComponent,
    ReactiveFormsModule,
  ],
  providers: [TimerService],
})
export class ForgetPasswordPage implements OnInit, OnDestroy {
  private sub$ = new Subscription();
  private readonly toaster = inject(HesToasterService);
  private readonly timerService = inject(TimerService);
  private forgetPasswordService = inject(ForgetPasswordService);
  private authService = inject(AuthService);
  private translocoService = inject(TranslocoService);
  modalCtrl = inject(ModalController);
  private fb = inject(NonNullableFormBuilder);
  private readonly toastr = inject(ToastrService);

  nationalIdFormControl = new FormControl('', {
    nonNullable: true,
    validators: [nationalIdMax18Validator],
  });
  contactNumberFormControl = new FormControl('', { nonNullable: true });

  nationalIdFormControlErr = signal<string | null>(null);
  contactNumberFormControlErr = signal<string | null>(null);
  passwordErr = signal<string | null>(null);
  confirmPasswordErr = signal<string | null>(null);
  public submitButtonText = signal<string>('login.continue.btn');

  isSubmitDisabled = signal<boolean>(true);
  isOtpVerified = signal<boolean>(false);

  form = this.fb.group({
    password: ['', [Validators.required, passwordValidator]],
    confirmPassword: [
      '',
      [
        Validators.required,
        confirmPasswordValidator({
          passwordControl: () => this.form?.get('password'),
        }),
      ],
    ],
  });

  currentStep = signal<'nationalId' | 'contactNumber' | 'changePassword'>(
    'nationalId',
  );

  /**
   * Initializes the component after Angular initializes data-bound input properties.
   * Subscribes to language translations and form control changes.
   * Logs values and retrieves error messages.
   */
  ngOnInit(): void {
    this.addFormSubscription();
  }

  private toggleSubmitButton() {
    this.currentStep() === 'changePassword'
      ? this.submitButtonText.set('global.reset_password.btn')
      : this.submitButtonText.set('login.continue.btn');
  }

  private addFormSubscription() {
    this.sub$.add(
      this.nationalIdFormControl.statusChanges.subscribe((status) => {
        this.getNationalIdErrorMessage();
        this.isSubmitDisabled.set(status === 'INVALID');
      }),
    );

    this.sub$.add(
      this.contactNumberFormControl.statusChanges.subscribe((status) => {
        this.getContactNumberErrorMessage();
        this.isSubmitDisabled.set(status === 'INVALID');
      }),
    );

    this.sub$.add(
      this.form.statusChanges.subscribe((status) => {
        this.getPasswordErrorMessage();
        this.getConfirmErrorMessage();
        this.isSubmitDisabled.set(status === 'INVALID');
      }),
    );
    this.sub$.add(
      merge(
        this.nationalIdFormControl.valueChanges,
        this.contactNumberFormControl.valueChanges,
      ).subscribe(() => {
        this.timerService.resetTimer();
      }),
    );
  }

  moveToNextStep() {
    if (this.currentStep() === 'nationalId') {
      this.currentStep.set('contactNumber');
      this.isSubmitDisabled.set(true);
    } else if (
      this.currentStep() === 'contactNumber' &&
      !this.isOtpVerified()
    ) {
      this.verifyUser(true);
    } else if (this.currentStep() === 'contactNumber' && this.isOtpVerified()) {
      this.currentStep.set('changePassword');
      this.isSubmitDisabled.set(true);
    } else if (this.currentStep() === 'changePassword') {
      this.changePassword();
    }
    this.toggleSubmitButton();
  }

  changePassword() {
    this.forgetPasswordService
      .setupPassword({
        nationalId: this.nationalIdFormControl.value,
        password: this.form.controls.password.value,
        studentId: this.authService.user()?.userTypeId!,
      })
      .subscribe({
        next: (data) => {
          if (data.success) {
            this.toastr
              .success(
                this.translocoService.translate(
                  'login.changed_password_successfully.txt',
                ),
                '',
                { timeOut: 2000 },
              )
              .onHidden.subscribe(() => {
                this.authService.logout();
              });
          }
        },
        error: (err: HttpErrorResponse) => {
          this.toaster.showBackendError(err);
          this.passwordErr.set(err?.error?.message ?? null);
        },
      });
  }

  verifyUser(openOtpModal = false) {
    // Check if the timer is already running to avoid re-sending the OTP
    if (this.timerService.isTimerOn()) {
      this.openOtpModal();
      return;
    }

    this.forgetPasswordService
      .initForgetPassword({
        nationalId: this.nationalIdFormControl.value,
        phoneNumber: this.contactNumberFormControl.value,
        channel: 'sms',
      })
      .subscribe({
        next: (data) => {
          if (data.success && openOtpModal) {
            this.timerService.startTimer(); // Start the timer for OTP
            this.openOtpModal();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.toaster.showBackendError(err);
          this.timerService.resetTimer();
        },
      });
  }

  verifyOtp(otp: string): Observable<boolean> {
    return this.forgetPasswordService
      .verifyOtp({
        phoneNumber: this.contactNumberFormControl.value,
        nationalId: this.nationalIdFormControl.value,
        code: otp,
        channel: 'sms',
      })
      .pipe(
        map((res) => {
          if (res.success && res.data.userInfo) {
            this.isOtpVerified.set(true);
            const lang = this.translocoService.getActiveLang();
            this.authService.setSession(res);
            this.translocoService.setActiveLang(lang);
            this.moveToNextStep();
            this.timerService.resetTimer();
            return true;
          }
          return false;
        }),
        catchError((err) => {
          this.toaster.showBackendError(err);
          return of(err);
        }),
      );
  }

  getNationalIdErrorMessage() {
    this.nationalIdFormControlErr.set(
      getNationalIdErrorMessage(
        this.nationalIdFormControl,
        this.translocoService,
      ),
    );
  }

  getContactNumberErrorMessage() {
    this.contactNumberFormControlErr.set(
      getPhoneNumberErrorMessage(
        this.contactNumberFormControl,
        this.translocoService,
      ),
    );
  }

  getPasswordErrorMessage() {
    this.passwordErr.set(
      getPasswordErrorMessage(
        this.form.get('password') as FormControl,
        this.translocoService,
      ),
    );
  }

  getConfirmErrorMessage() {
    this.confirmPasswordErr.set(
      getConfirmPasswordErrorMessage(
        this.form.get('confirmPassword') as FormControl,
        this.translocoService,
      ),
    );
  }

  // Private method to open the OTP modal
  private openOtpModal() {
    openLoginModal({
      modalCtrl: this.modalCtrl,
      phoneNumber: this.contactNumberFormControl.value,
      timerService: this.timerService,
      verifyOtp: (otp: string) => {
        return this.verifyOtp(otp);
      },
      resendOtp: () => {
        this.verifyUser();
      },
    });
  }

  ngOnDestroy() {
    this.sub$.unsubscribe();
  }
}
