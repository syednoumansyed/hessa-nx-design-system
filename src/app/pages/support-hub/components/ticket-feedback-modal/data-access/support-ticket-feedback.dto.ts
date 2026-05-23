export interface SupportTicketFeedbackUserDTO {
  readonly id: number;
  readonly arFullName: string | null;
  readonly enFullName: string | null;
}

export interface SupportTicketFeedbackDTO {
  readonly id: number;
  readonly ticketId: number;
  readonly rating: number;
  readonly comment: string | null;
  readonly tenantId: number;
  readonly createdAt: string;
  readonly updatedAt: string | null;
  readonly createdBy: SupportTicketFeedbackUserDTO | null;
  readonly updatedBy: SupportTicketFeedbackUserDTO | null;
}
