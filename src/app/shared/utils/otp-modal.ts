import { ModalController } from '@ionic/angular/standalone';
import { OtpDialogComponent } from '@shared/components/otp-dialog/otp-dialog.component';
import { Observable } from 'rxjs';
import { TimerService } from '@shared/services/timer-service';

export async function openLoginModal({
  modalCtrl,
  phoneNumber,
  verifyOtp,
  resendOtp,
  timerService,
}: {
  modalCtrl: ModalController;
  phoneNumber: string;
  timerService: TimerService;
  verifyOtp: (otp: string) => Observable<boolean>;
  resendOtp: () => void;
}) {
  const modal = await modalCtrl?.create({
    component: OtpDialogComponent,
    componentProps: {
      phoneNumber,
      verifyOtp,
      resendOtp,
      timerService,
    },
  });
  modal.present();
}
