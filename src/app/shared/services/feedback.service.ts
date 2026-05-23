import { inject, Injectable } from '@angular/core';
import { DsFeedback, DsFeedbackComponent } from '@ds/feedback';
import { DsModalService } from '@ds/modal';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private modalService = inject(DsModalService);

  /**
   * Opens a feedback modal with the specified props and optional callbacks.
   * Uses DsModalService internally for consistent modal behavior.
   *
   * @param props - The props to pass to the feedback component.
   * @param onConfirm - Optional callback function to be called when the modal is confirmed.
   * @param onCancel - Optional callback function to be called when the modal is cancelled.
   * @param backdropDismiss - Optional boolean to enable/disable backdrop dismiss.
   * @returns Promise<boolean> - true if confirmed, false otherwise
   */
  async openFeedbackModal(
    props: DsFeedback,
    onConfirm?: () => void,
    onCancel?: () => void,
    backdropDismiss = true,
  ): Promise<boolean> {
    const primaryButtonVariant = DsFeedbackComponent.getPrimaryButtonVariant(
      props.type,
    );

    const modalRef = await this.modalService.open({
      component: DsFeedbackComponent,
      componentProps: {
        title: props.modalTitle,
        message: props.modalMessage,
        type: props.type,
        icon: props.icon,
      },
      footerConfig: {
        primaryButton: props.primaryBtnStr
          ? { text: props.primaryBtnStr, variant: primaryButtonVariant }
          : undefined,
        secondaryButton: props.secondaryBtnStr
          ? { text: props.secondaryBtnStr }
          : undefined,
        stackButtons: props.stackButtons,
      },
      size: 'sm',
      backdropDismiss,
    });

    const result = await modalRef.onDismiss();

    if (result.role === 'confirm') {
      onConfirm?.();
      return true;
    }
    if (result.role === 'cancel') {
      onCancel?.();
    }
    return false;
  }
}
