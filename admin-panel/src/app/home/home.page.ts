import { Component, inject, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { FeedbackService } from '@shared/services/feedback.service';
import { faWarning } from '@fortawesome/pro-regular-svg-icons';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonButton,
    HesButtonModule,
    HessaInputComponent,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
  standalone: true,
})
export class HomePage {
  private feedbackService = inject(FeedbackService);
  private toaster = inject(HesToasterService);
  phoneNumberControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  phoneNumberErr = signal<string | null>('');

  constructor() {}
  onClick() {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: 'Testing modal css',

        modalMessage: 'Look like it working for tailwind config.json',

        primaryBtnStr: 'Yes',
        secondaryBtnStr: 'Cancel',
        icon: faWarning,
      },
      () => {
        console.log('Feedback submitted');
        this.toaster.success('hello ', 'Feedback submitted successfully');
      },
      () => {
        console.log('Feedback cancelled');
      },
      true,
    );
  }
}
