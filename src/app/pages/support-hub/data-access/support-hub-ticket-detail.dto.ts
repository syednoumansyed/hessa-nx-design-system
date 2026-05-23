import { IAttachment } from '@shared/interfaces/attachment';
import {
  Gender,
  ResourceStatus,
  SupportTicketStatus,
  UserProfileColors,
  UserType,
} from '@shared/enums';
import { UpdatedByDTO } from '@shared/dto-transformation/common';
import {
  CampusDTO,
  CompanyDTO,
  SchoolDTO,
} from '@shared/dto-transformation/organization/organization.dto';

export interface SupportHubTicketDetailDTO {
  id: number;
  title: string;
  description: string;
  status: SupportTicketStatus;
  supportTypeId: number;
  supportCategoryId: number;
  isResolved: boolean;
  tenantId: number;
  schoolId: number;
  ticketEscalationId: number;
  firstEscalationLevelNumber: number;
  currentEscalationLevelNumber: number;
  lastEscalationLevelNumber: number;
  createdAt: string;
  updatedAt: string | null;
  createdByType: UserType;
  createdBy: number;
  schoolStructure: SupportHubTicketSchoolStructureDTO;
  updatedBy: UpdatedByDTO;
  attachments: Array<IAttachment> | null;
  supportTypes: {
    id: number;
    arName: string;
    enName: string;
    icon: string;
  }[];
  supportCategories: {
    id: number;
    arName: string;
    enName: string;
    icon: string;
  }[];
  ticketActivity?: Array<{
    id: number;
    title: string;
    status: SupportTicketStatus;
    userId: number | null;
    metadata: {
      currentLevelNumber?: number | null;
      previousLevelNumber?: number | null;
      personnels?: Array<{
        id: number;
        arName?: string | null;
        enName?: string | null;
        arFullName?: string | null;
        enFullName?: string | null;
        role?: string | null;
      }>;
      user?: {
        id?: number;
        arName?: string | null;
        enName?: string | null;
        arFullName?: string | null;
        enFullName?: string | null;
        role?: string | null;
        roles?: SupportHubTicketRoleDTO[] | null;
      } | null;
      addedPersonnels?: Array<{
        id: number;
        arName?: string | null;
        enName?: string | null;
        arFullName?: string | null;
        enFullName?: string | null;
        role?: string | null;
        roles?: SupportHubTicketRoleDTO[] | null;
      }>;
      removedPersonnels?: Array<{
        id: number;
        arName?: string | null;
        enName?: string | null;
        arFullName?: string | null;
        enFullName?: string | null;
        role?: string | null;
        roles?: SupportHubTicketRoleDTO[] | null;
      }>;
    };
    tenantId: number;
    ticketId: number;
    createdAt: string;
    createdBy: number | null;
    updatedAt: string | null;
    updatedBy: number | null;
    description: string;
    attachments?: Array<IAttachment> | null;
    ticketEscalationId: number;
  }>;
  user: SupportHubTicketUserDTO[];
  roles: SupportHubTicketRoleDTO[];
  ticketEscalations: Array<{
    id: number;
    days: number;
    levelNumber: number;
    ticketEscalationPersonnels: Array<{
      id: number;
      user: {
        id: number;
        arFullName: string;
        enFullName: string;
        profileColor: UserProfileColors;
      };
      userId?: number;
      personnelId: number;
      roles: Array<{
        id: number;
        arName: string;
        enName: string;
      }>;
    }>;
  }>;
  students?: Array<{
    id: number;
    arFullName: string;
    enFullName: string;
  }> | null;
  metadata?: {
    customFields?: Array<{
      id: number;
      arLabel: string;
      enLabel: string;
      arDescription?: string | null;
      enDescription?: string | null;
      required?: boolean;
      value: string;
    }>;
  } | null;
}

interface SupportHubTicketSchoolStructureDTO {
  school: SchoolDTO;
  campus: CampusDTO;
  company: CompanyDTO;
  class?: SupportHubTicketRoleDTO | null;
  level?: SupportHubTicketRoleDTO | null;
}

export interface SupportHubTicketUserDTO {
  id: number;
  gender: Gender;
  status: ResourceStatus;
  arFullName: string;
  enFullName: string;
  tenantId: number;
  nationalId: string;
  countryCode: string;
  phoneNumber: string;
  type: UserType;
  userTypeId?: number;
  role?: {
    id: number;
    arName: string;
    enName: string;
  };
  roles?: SupportHubTicketRoleDTO[] | null;
}

export interface SupportHubTicketRoleDTO {
  id?: number;
  arName: string;
  enName: string;
}
