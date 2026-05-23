import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { FeedbackService } from './feedback.service';
import { DsFeedback } from '@ds/feedback/feedback.type';

@Injectable({
  providedIn: 'root',
})
export class GenericErrorFeedbackService {
  private readonly translocoService = inject(TranslocoService);
  private readonly feedbackService = inject(FeedbackService);

  async show(onConfirm = () => {}, feedback?: Partial<DsFeedback>) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translocoService.translate('global.wrong_msg.title'),
        ...(feedback?.modalMessage && {
          modalMessage: this.translocoService.translate(feedback?.modalMessage),
        }),
        primaryBtnStr: this.translocoService.translate('global.try_again.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
        ...feedback,
      },
      onConfirm,
    );
  }
}
