import { FullNameLocalizedIdentifiableDTO } from '@shared/dto-transformation';
import { SupportTicketStatus } from '@shared/enums';
import { IPaginatedResponse } from '@shared/interfaces';

export interface SupportHubTicketEscalationPersonnelDTO {
  id: number;
  status?: string | null;
  personnel?: FullNameLocalizedIdentifiableDTO;
  user?: FullNameLocalizedIdentifiableDTO;
  displayName?: string;
  userId?: number;
  personnelId?: number;
  ticketEscalationId?: number | null;
}

export interface SupportHubTicketEscalationDTO {
  id: number;
  supportTypeId: number;
  schoolId: number;
  levelNumber: number;
  days: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
  ticketEscalationPersonnels: SupportHubTicketEscalationPersonnelDTO[];
}

export interface SupportHubTicketDTO {
  id: number;
  title: string;
  description: string;
  hideInitiatorName: boolean;
  schoolId: number;
  status: SupportTicketStatus;
  isResolved?: boolean;
  supportType: {
    id: number;
    supportTypeArName: string;
    supportTypeEnName: string;
    icon?: string | null;
  };
  supportCategory: {
    id: number;
    categoryArName: string;
    categoryEnName: string;
    icon?: string | null;
  };
  createdAt: string;
  updatedAt: string | null;
  createdBy: FullNameLocalizedIdentifiableDTO;
  updatedBy: FullNameLocalizedIdentifiableDTO | null;
  firstEscalationLevelNumber: number;
  currentEscalationLevelNumber: number;
  lastEscalationLevelNumber: number;
  ticketEscalation: SupportHubTicketEscalationDTO | null;
  ticketEscalations?: SupportHubTicketEscalationDTO[] | null;
  students: FullNameLocalizedIdentifiableDTO[] | null;
}

export type SupportHubTicketsResponseDTO = IPaginatedResponse<
  SupportHubTicketDTO[]
>;
