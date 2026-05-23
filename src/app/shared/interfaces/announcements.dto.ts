import {
  AnnouncementStatus,
  AnnouncementType,
  TargetTypes,
} from '@shared/enums';
import { IAttachment } from './attachment';

export interface AnnouncementDTO {
  id: number;
  title: string;
  content: string;
  status: AnnouncementStatus;
  type: AnnouncementType;
  viewsCount: string;
  sendCount: string;
  createdBy: {
    id: number;
    arFullName: string;
    enFullName: string;
  };
  attachments: Array<IAttachment>;
  targets: Array<{
    arName: string;
    enName: string;
    type: TargetTypes;
    entityId: number;
  }>;
  targetRoles: Array<{
    id: number;
    arName: string;
    enName: string;
  }>;
  createdAt: string;
}
