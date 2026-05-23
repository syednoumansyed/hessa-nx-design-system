import { FullNameLocalizedIdentifiable } from '@shared/dto-transformation';
import { SupportTicketStatus } from '@shared/enums';
import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';

export interface SupportHubTicketEscalationPersonnel {
  id: number;
  status?: string | null;
  personnel: FullNameLocalizedIdentifiable;
  personnelId: number;
  ticketEscalationId: number | null;
}

export interface SupportHubTicketEscalation {
  id: number;
  supportTypeId?: number | null;
  schoolId?: number | null;
  levelNumber: number;
  days?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  ticketEscalationPersonnels: SupportHubTicketEscalationPersonnel[];
}

export interface SupportHubTicket {
  id: number;
  title: string;
  description: string;
  hideInitiatorName: boolean;
  schoolId: number;
  status: SupportTicketStatus;
  supportType: {
    id: number;
    displayName: string;
    icon?: string | null;
  };
  supportCategory: {
    id: number;
    displayName: string;
    icon?: string | null;
  };
  createdAt: string;
  updatedAt: string | null;
  createdBy: DisplayIdentifiable;
  updatedBy: DisplayIdentifiable | null;
  firstEscalationLevelNumber: number;
  currentEscalationLevelNumber: number;
  lastEscalationLevelNumber: number;
  ticketEscalation: SupportHubTicketEscalation | null;
  ticketEscalations: SupportHubTicketEscalation[];
  students: DisplayIdentifiable[];
  isInitiatorTicket: boolean;
  isResolved?: boolean;
}

export type SupportHubTicketOrder = 'asc' | 'desc';

export interface SupportHubTicketsQueryParams {
  order?: SupportHubTicketOrder;
  pageNumber?: number;
  itemsPerPage?: number;
  initiatedBy?: number;
  assigneeStatus?: 'ALL' | 'ME';
  // Flattened filter properties
  searchText?: string;
  status?: string;
  assignedTo?: number[];
  companyIds?: number[];
  schoolIds?: number[];
  campusIds?: number[];
}
