import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  AccessLevel,
  Gender,
  ResourceStatus,
  SupportTicketStatus,
  UserType,
} from '@shared/enums';
import { CreatedByDTO, UpdatedByDTO } from '../common';
import { Campus, Company, School } from '../organization';
import { IAttachment } from '@shared/interfaces/attachment';
import {
  CampusDTO,
  CompanyDTO,
  SchoolDTO,
} from '../organization/organization.dto';

/**
 * DTO for custom field attached to a support type
 */
export interface SupportTypeCustomFieldDTO {
  id: number;
  arLabel: string;
  enLabel: string;
  arDescription: string | null;
  enDescription: string | null;
  required: boolean;
  tenantId: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
}

/**
 * Unified DTO for support type (category) - used for both list and detail API responses
 * List API: GET /support-types - includes categoryCount, createdBy
 * Detail API: GET /support-types/:id - includes icon, customFields, allowPrivateRequest, descriptions
 */
export interface SupportTypeDTO {
  id: number;
  arName: string;
  enName: string;
  accessLevel: AccessLevel;
  isForArticle: boolean;
  isForTicket: boolean;
  createdAt: string;
  // Fields from list API
  categoryCount?: number;
  createdBy?: CreatedByDTO;
  // Fields from detail API
  arDescription?: string | null;
  enDescription?: string | null;
  icon?: string;
  tenantId?: number;
  allowPrivateRequest?: boolean;
  updatedAt?: string | null;
  updatedBy?: number | null;
  customFields?: SupportTypeCustomFieldDTO[];
}

export class SupportTicketTypeDTO {
  createdAt: string;
  createdBy: number;
  id: number;
  arName: string;
  enName: string;
  tenantId: number;
  updatedAt: string;
  updatedBy: number;
}

export class SupportCategoryDTO {
  id: number;
  arName: string;
  enName: string;
  tenantId: number;
  supportTypeId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
}

export interface SubCategoryDetailDTO extends SupportTypeDTO {
  supportTypeId: number;
}

export interface SupportTicketListItemDTO {
  id: number;
  schoolId: number;
  title: string;
  description: string;
  status: SupportTicketStatus;
  supportType: {
    id: number;
    supportTypeArName: string;
    supportTypeEnName: string;
  };
  supportCategory: {
    id: number;
    categoryArName: string;
    categoryEnName: string;
  };
  createdAt: string;
  updatedAt: string | null;
  ticketEscalation: TicketEscalationDTO;
  firstEscalationLevelNumber: number;
  currentEscalationLevelNumber: number;
  lastEscalationLevelNumber: number;
  createdBy: CreatedByDTO | null;
}

export type CategoryDetailDTOResponse = IResponse<SupportTypeDTO>;
export type CategoriesDetailDTOResponse = IPaginatedResponse<SupportTypeDTO[]>;

export type SupportTypeDTOResponse = IResponse<SupportTypeDTO>;

export type SubCategoryDetailDTOResponse = IPaginatedResponse<
  SubCategoryDetailDTO[]
>;

export interface CategoryParams {
  addCategoryCounts?: boolean;
}

export interface SubCategoryRequest {
  supportTypeId: ObjId;
  arName: string;
  enName: string;
  accessLevel: AccessLevel;
  icon: string;
}

export type SubCategoryListParams = {
  supportTypeId?: ObjId;
  pageNumber?: number;
  itemPerPage?: number;
  paginated?: boolean;
  searchText?: string;
  order?: 'asc' | 'desc';
};

export interface TicketEscalationDTO {
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
      arFullName: string;
      enFullName: string;
    };
    personnelId: number;
    ticketEscalationId: number;
  }>;
}

export interface SupportTicketDetailDTO {
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
  schoolStructure: SupportTicketSchoolStructureDTO;
  updatedBy: UpdatedByDTO;
  attachments: Array<IAttachment> | null;
  supportTypes: {
    id: number;
    arName: string;
    enName: string;
  }[];
  supportCategories: {
    id: number;
    arName: string;
    enName: string;
  }[];
  ticketActivity?: Array<{
    id: number;
    title: string;
    status: SupportTicketStatus;
    userId: number | null;
    metadata: {
      currentLevelNumber: number;
      previousLevelNumber: number;
      personnels: [
        {
          id: number;
          arFullName: string;
          enFullName: string;
        },
      ];
      user: {
        id: number;
        arFullName: string;
        enFullName: string;
      };
    };
    tenantId: number;
    ticketId: number;
    createdAt: string;
    createdBy: null;
    updatedAt: null;
    updatedBy: null;
    description: string;
    attachments?: Array<IAttachment> | null;
    ticketEscalationId: number;
  }>;
  user: SupportTicketUserDTO[];
  roles: TicketRoleDTO[];
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
      };
    }>;
  }>;
}

interface SupportTicketSchoolStructureDTO {
  school: SchoolDTO;
  campus: CampusDTO;
  company: CompanyDTO;
}

export interface SupportTicketUserDTO {
  id: number;
  gender: Gender;
  status: ResourceStatus;
  arFullName: string;
  enFullName: string;
  tenantId: number;
  nationalId: string;
  countryCode: string;
  phoneNumber: string;
  userTypeId: number;
}

interface TicketRoleDTO {
  id: number;
  arName: string;
  enName: string;
}

// #region Support Type Request DTOs

/**
 * DTO for a new custom field sent to the API
 */
export interface NewCustomFieldRequestDTO {
  arLabel: string;
  enLabel: string;
  arDescription?: string | null;
  enDescription?: string | null;
  required: boolean;
}

/**
 * DTO sent to the API for creating/updating a support type
 */
export interface CreateSupportTypeRequestDTO {
  icon: string;
  arName: string;
  enName: string;
  arDescription: string | null;
  enDescription: string | null;
  accessLevel: AccessLevel;
  allowPrivateRequest: boolean;
  isForArticle: boolean;
  isForTicket: boolean;
  customFieldIds?: number[];
  newCustomFields?: NewCustomFieldRequestDTO[];
}

// #endregion
