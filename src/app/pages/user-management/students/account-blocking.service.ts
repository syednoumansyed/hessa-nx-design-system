import { inject, Injectable, Injector } from '@angular/core';
import { ObjId } from '@shared/interfaces/common.interface';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { TuiDialogService } from '@taiga-ui/core';
import { FeedbackService } from '@shared/services/feedback.service';
import { AccountBlockingDialogComponent } from '../components/pause-account-dialog/account-blocking-dialog.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Injectable({
  providedIn: 'root',
})
export class AccountBlockingService {
  private feedbackService = inject(FeedbackService);
  private hesTranslateService = inject(HesTranslateService);
  private readonly dialogs = inject(TuiDialogService);
  private readonly injector = inject(Injector);

  openPauseOrDeactivateDialog(
    id: ObjId,
    stdName: string,
    isPause = false,
    isBulk = false,
  ) {
    return this.dialogs.open<any>(
      new PolymorpheusComponent(AccountBlockingDialogComponent, this.injector),
      {
        dismissible: false,
        closeable: false,
        data: {
          studentId: id,
          studentName: stdName,
          isPause: isPause,
          isBulk: isBulk,
          onAccountStateSuccess: isBulk
            ? undefined
            : () => this.onAccountStateSuccess(isPause),
        },
      },
    );
  }

  onAccountStateSuccess(isPause: boolean) {
    if (isPause) {
      this.onPauseStudentSuccess();
    } else {
      this.onDeactivateStudentSuccess();
    }
  }

  onPauseStudentSuccess() {
    this.feedbackService.openFeedbackModal({
      type: 'success',
      modalTitle: this.hesTranslateService.t(
        'deactivation_paused_user.account_paused_successfully.txt',
      ),
      primaryBtnStr: this.hesTranslateService.t('global.back_to_home.btn'),
    });
  }

  onDeactivateStudentSuccess() {
    this.feedbackService.openFeedbackModal({
      type: 'success',
      modalTitle: this.hesTranslateService.t(
        'global.successfully_deactivated.txt',
      ),
      primaryBtnStr: this.hesTranslateService.t('global.back_to_home.btn'),
    });
  }
}
