import { IAttachment } from '@shared/interfaces/attachment';
import {
  Gender,
  SupportTicketStatus,
  UserProfileColors,
  UserType,
} from '@shared/enums';
import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';

export interface SupportHubTicketDetail {
  id: number;
  title: string;
  description: string;
  status: SupportTicketStatus;
  schoolId: number;
  supportTypeId: number;
  supportCategoryId: number;
  isResolved: boolean;
  /** Client-computed flag indicating the initiator confirmed resolution. */
  resolvedByInitiator: boolean;
  /** Client-computed flag indicating support personnel marked as resolved without initiator confirmation. */
  resolvedByAssignee: boolean;
  ticketEscalationId: number;
  createdByType: UserType;
  createdBy: number | null;
  firstEscalationLevelNumber: number;
  currentEscalationLevelNumber: number;
  lastEscalationLevelNumber: number;
  schoolStructure: SupportHubTicketSchoolStructure;
  attachments: Array<IAttachment> | null;
  createdAt: string;
  supportTypes: {
    id: number;
    displayName: string;
    icon: string;
  }[];
  supportCategories: {
    id: number;
    displayName: string;
    icon: string;
  }[];
  ticketActivity: SupportHubTicketActivity[];
  userDisplayName: string;
  initiator: SupportHubTicketUser;
  rolesDisplayName: string;
  ticketEscalations: Array<{
    id: number;
    days: number;
    levelNumber: number;
    ticketEscalationPersonnels: Array<{
      id: number;
      userId: number;
      personnelId: number;
      displayName: string;
      profileColor: UserProfileColors;
      roles: Array<{
        id: number;
        displayName: string;
      }>;
    }>;
  }>;
  students: DisplayIdentifiable[];
  customFields: SupportHubTicketCustomField[];
}

export interface SupportHubTicketCustomField {
  id: number;
  label: string;
  value: string;
}

export interface SupportHubTicketSchoolStructure {
  school: DisplayIdentifiable;
  campus: DisplayIdentifiable;
  company: DisplayIdentifiable;
  level?: DisplayIdentifiable | null;
  class?: DisplayIdentifiable | null;
}

export interface SupportHubTicketUser {
  id: number;
  displayName: string;
  userTypeId?: number;
  type: UserType;
  gender: Gender;
  nationalId: string;
  displayPhoneNumber: string;
  role?: {
    displayName: string;
  };
}

export interface SupportHubTicketRole {
  id: number;
  displayName: string;
}

export interface SupportHubTicketActivity {
  id: number;
  status: SupportTicketStatus;
  performedBy: {
    id: number;
    displayName: string;
  } | null;
  performedById: number | null;
  isPerformedByInitiator: boolean;
  description: string;
  createdAt: string;
  attachments: Array<IAttachment>;
  escalationChange: {
    fromLevel: number;
    toLevel: number;
  } | null;
  notifiedPersonnel: Array<{
    id: number;
    displayName: string;
  }>;
  addedPersonnels: Array<{
    id: number;
    displayName: string;
    role?: string | null;
  }>;
  removedPersonnels: Array<{
    id: number;
    displayName: string;
    role?: string | null;
  }>;
  user: {
    id: number;
    displayName: string;
    role: string;
  };
}
