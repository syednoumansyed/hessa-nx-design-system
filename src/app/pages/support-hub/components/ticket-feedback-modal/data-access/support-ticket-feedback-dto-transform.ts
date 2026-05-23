import { SupportTicketFeedbackDTO } from './support-ticket-feedback.dto';
import { SupportTicketFeedback } from './support-ticket-feedback.interface';

function mapSingleFeedback(
  dto: SupportTicketFeedbackDTO,
): SupportTicketFeedback {
  return {
    id: dto.id,
    ticketId: dto.ticketId,
    rating: dto.rating,
    comment: dto.comment ?? null,
    createdAt: dto.createdAt,
  } satisfies SupportTicketFeedback;
}

export const SUPPORT_TICKET_FEEDBACK_MAP_FROM_DTO = {
  first(
    dtos: ReadonlyArray<SupportTicketFeedbackDTO> | null | undefined,
  ): SupportTicketFeedback | null {
    if (!dtos?.length) {
      return null;
    }

    const [first] = dtos;
    return mapSingleFeedback(first);
  },
};
