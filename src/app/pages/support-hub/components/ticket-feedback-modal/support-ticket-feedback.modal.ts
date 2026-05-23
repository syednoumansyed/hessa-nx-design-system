import { inject } from '@angular/core';
import { DsModalService } from '@ds/modal';
import { TicketFeedbackType } from '@shared/enums';
import { SupportTicketFeedbackComponent } from './support-ticket-feedback.component';

export function createSupportTicketFeedbackModal() {
  const modalService = inject(DsModalService);

  return async function ({
    ticketId,
    feedbackType = TicketFeedbackType.RATING,
    isInitiatorTicket = false,
  }: {
    ticketId: number;
    feedbackType?: TicketFeedbackType;
    isInitiatorTicket?: boolean;
  }) {
    const modalRef = await modalService.open({
      component: SupportTicketFeedbackComponent,
      componentProps: {
        ticketId,
        feedbackType,
        isInitiatorTicket,
      },
      size: 'sm',
    });

    return modalRef.onDismiss();
  };
}
