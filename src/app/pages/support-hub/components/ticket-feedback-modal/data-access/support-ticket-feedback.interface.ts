export interface SubmitTicketFeedbackPayload {
  ticketId: number;
  rating: number;
  comment?: string;
}

export interface SupportTicketFeedback {
  id: number;
  ticketId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}
