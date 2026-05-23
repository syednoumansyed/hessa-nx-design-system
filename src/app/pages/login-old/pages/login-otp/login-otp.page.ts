import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { ModalController } from '@ionic/angular/standalone';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { AuthService } from '@auth/auth.service';
import {
  ILoginPayload,
  LOGIN_CHANNEL,
  UserProfile,
  ILoginVerifyResponse,
} from '@auth/model';
import { isMobile } from '@shared/utils/platform';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { openLoginModal } from '@shared/utils/otp-modal';
import { openProfilesDetedtedModal } from '@shared/utils/profiles-detected-modal';
import { getPhoneNumberErrorMessage } from '@validators/phoneNumber';
import { Observable, catchError, map, of } from 'rxjs';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TimerService } from '@shared/services/timer-service';
@Component({
  selector: 'app-login-old-otp',
  templateUrl: './login-otp.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HesButtonModule,
    HessaInputComponent,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
  providers: [TimerService],
})
export class LoginOtpPage implements OnInit {
  faWhatsapp = faWhatsapp;
  isMobile = isMobile();
  isSendingOTP = signal(false);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private router = inject(Router);
  fb = inject(NonNullableFormBuilder);
  private readonly toaster = inject(HesToasterService);
  private translocoService = inject(TranslocoService);
  private timerService = inject(TimerService);

  // temp tokens for multiple profiles case
  AuthHeaders = signal<{ [key: string]: string } | null>(null);

  // login-old states
  otpChannel = signal<LOGIN_CHANNEL>('sms');

  // login-old otp form controls
  phoneNumberControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  phoneNumberErr = signal<string | null>('');

  isPhoneNumberEmpty = signal(true);
  selectedProfile = signal<UserProfile | null>(null);
  otpCode = signal<string>('');

  ngOnInit(): void {
    this.phoneNumberControl.valueChanges.subscribe((value) => {
      this.timerService.resetTimer();
      this.isPhoneNumberEmpty.set(value === '');
    });
    this.phoneNumberControl.statusChanges.subscribe((status) => {
      this.getContactNumberErrorMessage();
    });
  }

  ionViewWillEnter() {
    this.AuthHeaders.set(null);
  }

  login(openOtpModalOnSuccess = true) {
    let payload: ILoginPayload;
    // clear temp auth headers at the begining of flow, in case the user did not choose a profile and started flow again
    this.AuthHeaders.set(null);

    // Check if the timer is already running (meaning an OTP is already being processed)
    if (this.timerService.isTimerOn()) {
      if (openOtpModalOnSuccess) {
        this.openOtpModal();
      }
      return; // Exit the function to prevent calling the login-old API again
    }

    if (this.phoneNumberControl.value) {
      payload = {
        type: 'mobile',
        channel: this.otpChannel(),
        phoneNumber: this.phoneNumberControl.value,
      };
      this.isSendingOTP.set(true);

      // Call the login-old API
      this.authService.login(payload).subscribe({
        next: (data) => {
          if (data.success) {
            this.phoneNumberControl.setErrors(null);
            this.phoneNumberErr.set(null);
            this.isSendingOTP.set(false);

            // Start the timer after successful login-old
            this.timerService.startTimer();

            if (openOtpModalOnSuccess) {
              this.openOtpModal();
            }
          }
        },
        error: (err) => {
          this.isSendingOTP.set(false);
          this.phoneNumberControl.setErrors({ invalid: true });
          this.toaster.showBackendError(err);
        },
      });
    }
  }

  verifyOtp(otp: string): Observable<boolean> {
    this.otpCode.set(otp);
    return this.authService
      .verifyOtp(
        {
          channel: this.otpChannel(),
          phoneNumber: this.phoneNumberControl.value ?? '',
          code: otp,
          selectedProfile: this.selectedProfile(),
        },
        this.AuthHeaders()!,
      )
      .pipe(
        map((res) => {
          this.selectedProfile.set(null);
          if (res.data.profilesDetected) {
            this.AuthHeaders.set({
              authorization: `Bearer ${res.data.token.accessToken}`,
              refreshToken: res.data.token.refreshToken,
            });
            return this.handleMultipleProfilesDetection(res);
          }
          this.timerService.resetTimer();
          if (res.success) {
            this.modalCtrl.dismiss();
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

  handleMultipleProfilesDetection(res: ILoginVerifyResponse) {
    this.modalCtrl.dismiss();
    openProfilesDetedtedModal({
      modalCtrl: this.modalCtrl,
      phoneNumber: this.phoneNumberControl.value!,
      profilesList: res.data.users,
      code: this.otpCode(),
      sendSelectedProfile: (otp: string, selectedProfile: UserProfile) => {
        this.isSendingOTP.set(true);
        this.selectedProfile.set(selectedProfile);
        return this.verifyOtp(otp).subscribe({
          next: (data) => {
            if (!data) {
              this.selectedProfile.set(null);
              this.modalCtrl.dismiss();
              this.isSendingOTP.set(false);
            }
          },
        });
      },
    });
    return false;
  }

  getContactNumberErrorMessage() {
    this.phoneNumberErr.set(
      getPhoneNumberErrorMessage(
        this.phoneNumberControl,
        this.translocoService,
      ),
    );
  }

  goToStudentLogin() {
    this.router.navigate(['/login/students']);
  }

  private openOtpModal(): void {
    openLoginModal({
      modalCtrl: this.modalCtrl,
      phoneNumber: this.phoneNumberControl.value,
      timerService: this.timerService,
      verifyOtp: (otp: string) => {
        return this.verifyOtp(otp);
      },
      resendOtp: () => {
        this.login(false);
      },
    });
  }
}
