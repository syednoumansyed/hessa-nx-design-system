import {
  Gender,
  ResourceStatus,
  SupportTicketStatus,
  UserType,
} from '@shared/enums';
import { IUpdatedBy } from './created-by.interface';
import { IAttachment } from './attachment';
import { ISchool } from '@shared/interfaces/school.interface';
import { ICampus } from '@shared/interfaces/campus.interface';
import { ICompany } from '@shared/interfaces/company.interface';

export interface ISupportTicketQueryParams {
  schoolId: number;
  order?: string;
  pageNumber?: string | number;
  itemsPerPage?: string | number;
}

export interface IAssignedSupportTicketListItem {
  id: number;
  title: string;
  status: SupportTicketStatus;
  supportType: string;
  supportCategory: string;
  firstEscalationLevelNumber: number;
  currentEscalationLevelNumber: number;
  lastEscalationLevelNumber: number;
  createdAt: string;
  createdByName: string;
  assignedTo: string;
}

export interface ITicketDetailActivity {
  fullName: string;
  isCurrUSer?: boolean;
  initiator?: boolean;
  activityDate: string;
  activityType?: SupportTicketStatus;
  description?: string;
  attachments?: Array<IAttachment> | null;
  newLevelNumber?: number;
}

export interface SupportTicketPayload {
  title?: string;
  description: string;
  supportTypeId: number;
  supportCategoryId: number;
  attachments?: string[];
  schoolId: number;
  studentIds?: number[];
  hideInitiatorName?: boolean;
  customFields?: Array<{ id: number; value: string }>;
}

export interface IReassignTicketPayload {
  supportTypeId: number;
  supportCategoryId: number;
  personnelIds: number[];
}
