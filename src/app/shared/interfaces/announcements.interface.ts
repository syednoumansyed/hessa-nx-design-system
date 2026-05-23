import {
  AnnouncementStatus,
  AnnouncementType,
  TargetTypes,
} from '@shared/enums';
import { IAttachment } from './attachment';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  status: AnnouncementStatus;
  type: AnnouncementType;
  viewsCount: string;
  sendCount: string;
  createdBy: {
    id: number;
    displayName: string;
  };
  attachments: Array<IAttachment>;
  targets: Array<{
    displayName: string;
    type: TargetTypes;
    entityId: number;
  }>;
  targetRoles: Array<{
    id: number;
    displayName: string;
  }>;
  createdAt: string;
}

export interface IAnnouncementQueryParams {
  pageNumber?: string | number;
  itemsPerPage?: string | number;
  schoolId?: string | number;
  academicYearId?: string | number;
  date?: string;
}

export interface IAnnouncementListItem {
  id: number;
  title: string;
  content: string;
  status: AnnouncementStatus;
  type: AnnouncementType;
  viewsCount: string;
  sendCount: string;
  createdBy: string;
  attachments: Array<IAttachment>;
  targetSchools: string;
  targetRoles: string;
  createdAt: string;
  actions: [];
}
