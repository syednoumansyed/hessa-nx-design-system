import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IonButton } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { AttendanceEndTimeService } from '@pages/settings/attendance-end-time.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { ExtendedEndTime } from '@pages/settings/data-access/attendance-end-time.interface';

@Component({
  selector: 'app-extend-time-list-item',
  templateUrl: './extend-time-list-item.component.html',
  standalone: true,
  imports: [
    IonButton,
    HesButtonModule,
    TranslocoDirective,
    HesDatePipe,
    HesTimePipe,
  ],
})
export class ExtendTimeListItemComponent {
  // #region Inputs and Outputs
  @Input() item: ExtendedEndTime;
  @Output() itemDeleted = new EventEmitter<void>();
  // #endregion

  // #region Injectables
  private readonly attendanceEndTimeService = inject(AttendanceEndTimeService);
  private readonly toaster = inject(HesToasterService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly hesTranslateService = inject(HesTranslateService);
  // #endregion

  // #region Public properties
  readonly loading = signal<boolean>(false);
  // #endregion

  // #region Public Methods
  removeException(): void {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.hesTranslateService.t(
          'attendance.remove_exception_msg.title',
        ),
        primaryBtnStr: this.hesTranslateService.t('global.remove.btn'),
        secondaryBtnStr: this.hesTranslateService.t('global.cancel.btn'),
      },
      () => {
        this.onRemoveException();
      },
    );
  }
  // #endregion

  // #region Private Methods
  private onRemoveException(): void {
    this.loading.set(true);
    this.attendanceEndTimeService
      .deleteExtendedEndTime(this.item.id)
      .subscribe({
        next: () => {
          this.toaster.success(
            this.hesTranslateService.t(
              'attendance.exception_successfully_removed.txt',
            ),
          );
          this.itemDeleted.emit();
        },
        error: (err) => {
          this.toaster.showBackendError(err);
        },
        complete: () => {
          this.loading.set(false);
        },
      });
  }
  // #endregion
}
