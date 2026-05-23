import { IAttachment } from '@shared/interfaces/attachment';
import { CreatedBy } from '../common';
import {
  AccessLevel,
  Gender,
  ResourceStatus,
  SupportTicketStatus,
  UserType,
} from '@shared/enums';
import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';
/**
 * Custom field attached to a support type
 */
export interface SupportTypeCustomField {
  id: number;
  labelDisplayName: string;
  descriptionDisplayName: string;
  arLabel: string;
  enLabel: string;
  arDescription: string | null;
  enDescription: string | null;
  isRequired: boolean;
}

/**
 * Support type (category) - unified interface for both list and detail views
 * Some fields are optional as they're only available in certain API responses:
 * - List API: includes categoryCount, createdBy
 * - Detail API: includes icon, customFields, allowPrivateRequest, descriptions
 */
export interface SupportType {
  id: number;
  arName: string;
  enName: string;
  displayName: string;
  accessLevel: AccessLevel;
  isForArticle: boolean;
  isForTicket: boolean;
  createdAt: string;
  // Fields from list API
  categoryCount?: number;
  createdBy?: CreatedBy | null;
  // Fields from detail API
  arDescription?: string | null;
  enDescription?: string | null;
  icon?: string;
  allowPrivateRequest?: boolean;
  customFields?: SupportTypeCustomField[];
}

export interface SubCategoryDetail extends SupportType {
  supportTypeId: number;
}

export class SupportTicketType {
  id: number;
  displayName: string;
}

export class SupportCategory {
  id: number;
  displayName: string;
}

export interface SupportTicketListItem {
  id: number;
  schoolId: number;
  title: string;
  description: string;
  status: SupportTicketStatus;
  supportType: {
    id: number;
    displayName: string;
  };
  supportCategory: {
    id: number;
    displayName: string;
  };
  createdAt: string;
  updatedAt: string | null;
  ticketEscalation: TicketEscalation;
  firstEscalationLevelNumber: number;
  currentEscalationLevelNumber: number;
  lastEscalationLevelNumber: number;
  createdBy: CreatedBy | null;
}

export interface TicketEscalation {
  id: number;
  supportTypeId: number;
  schoolId: number;
  levelNumber: number;
  days: number;
  createdAt: string;
  updatedAt: string | null;

  ticketEscalationPersonnels: Array<{
    id: number;
    status: ResourceStatus;
    personnel: {
      id: number;
      displayName: string;
    };
    personnelId: number;
    ticketEscalationId: number;
  }>;
}

export interface SupportTicketDetail {
  id: number;
  title: string;
  description: string;
  status: SupportTicketStatus;
  schoolId: number;
  supportTypeId: number;
  supportCategoryId: number;
  isResolved: boolean;
  ticketEscalationId: number;
  createdByType: UserType;
  createdBy: number | null;
  firstEscalationLevelNumber: number;
  currentEscalationLevelNumber: number;
  lastEscalationLevelNumber: number;
  schoolStructure: SupportTicketSchoolStructure;
  attachments: Array<IAttachment> | null;
  createdAt: string;
  supportTypes: {
    id: number;
    displayName: string;
  }[];
  supportCategories: {
    id: number;
    displayName: string;
  }[];
  ticketActivity: Array<{
    id: number;
    title: string;
    status: SupportTicketStatus;
    userId: number | null;
    metadata: {
      currentLevelNumber?: number | null;
      previousLevelNumber?: number | null;
      personnels?: Array<{
        id: number;
        displayName?: string | null;
        arName?: string | null;
        enName?: string | null;
        role?: string | null;
      }>;
      user?: {
        id?: number;
        displayName?: string | null;
        arName?: string | null;
        enName?: string | null;
        role?: string | null;
      } | null;
    };
    createdAt: string;
    updatedAt: null;
    description: string;
    attachments?: Array<IAttachment> | null;
  }>;
  userDisplayName: string;
  users: SupportTicketUser[];
  user: SupportTicketUser;
  roles: SupportTicketRole[];
  rolesDisplayName: string;
  ticketEscalations: Array<{
    id: number;
    days: number;
    levelNumber: number;
    ticketEscalationPersonnels: Array<{
      id: number;
      userId: number;
      displayName: string;
    }>;
  }>;
}

export interface SupportTicketSchoolStructure {
  school: DisplayIdentifiable;
  campus: DisplayIdentifiable;
  company: DisplayIdentifiable;
}

export interface SupportTicketUser {
  id: number;
  displayName: string;
  userTypeId: number;
  gender: Gender;
  nationalId: string;
  displayPhoneNumber: string;
}

export interface SupportTicketRole {
  id: number;
  displayName: string;
}

// #region Support Type Request Payloads

/**
 * Payload for a new custom field to be created with the support type
 * Used internally in the application
 */
export interface NewCustomFieldPayload {
  arLabel: string;
  enLabel: string;
  arDescription?: string | null;
  enDescription?: string | null;
  required: boolean;
}

/**
 * Payload for creating/updating a support type (category)
 * Used internally in the application
 */
export interface CreateSupportTypePayload {
  icon: string;
  arName: string;
  enName: string;
  arDescription?: string | null;
  enDescription?: string | null;
  accessLevel: AccessLevel;
  allowPrivateRequest: boolean;
  isForArticle: boolean;
  isForTicket: boolean;
  /** IDs of existing custom fields to link */
  customFieldIds?: number[];
  /** New custom fields to create and link */
  newCustomFields?: NewCustomFieldPayload[];
}

/**
 * Parameters for fetching categories list
 */
export type FetchCategoriesParams = {
  addCategoryCounts?: boolean;
  order?: 'asc' | 'desc';
};

// #endregion
