import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { FeedbackService } from '@shared/services/feedback.service';

export interface CanFormComponentDeactivate {
  isUnsavedChanges: () => boolean;
}

export const canFormDeactivateGuard: CanDeactivateFn<
  CanFormComponentDeactivate
> = async (component: CanFormComponentDeactivate) => {
  const feedbackService = inject(FeedbackService);
  const transloco = inject(TranslocoService);
  if (component.isUnsavedChanges()) {
    const isLeave = await feedbackService.openFeedbackModal({
      type: 'error',
      modalTitle: transloco.translate('global.unsaved_changes.txt'),
      primaryBtnStr: transloco.translate('global.unsaved_changes.leave_btn'),
      secondaryBtnStr: transloco.translate('global.unsaved_changes.stay_btn'),
    });
    return isLeave;
  }

  return true;
};
