import { SupportTicketStatus } from '@shared/enums';

export type SupportTicketSource = 'initiated' | 'assigned';

export interface SupportHubTicketViewModel {
  id: number;
  code: string;
  title: string;
  description: string;
  status: SupportTicketStatus;
  supportCategoryLabel: string;
  supportTypeLabel: string;
  createdAt: string;
  updatedAt: string | null;
  latestActivityAt: string;
  source: SupportTicketSource;
}
