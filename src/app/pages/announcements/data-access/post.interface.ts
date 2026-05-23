import { ReactionType, ReactionUser } from '@ds/react/types/react.types';
import { Gender, UserProfileColors } from '@shared/enums';
import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';

export interface Post {
  id: number;
  title: string;
  content: string;
  status: string;
  type: string;
  academicYearId: number;
  createdAt: string;
  updatedAt: string | null;
  viewsCount: string;
  sendCount: string;
  createdBy: {
    id: number;
    displayName: string;
    profileColor?: UserProfileColors;
  };
  updatedBy: { id: number; displayName: string } | null;
  attachments: Attachment[];
  targets: SchoolSctructureEntity[];
  targetRoles: TargetRole[];
}

export interface PostAuthorDetail {
  nationalId: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  gender: Gender;
  profileColor?: UserProfileColors;
  userId: number;
  personnelId: number;
  roles: DisplayIdentifiable[];
  countryCode: string;
  schoolStructure: {
    companies: DisplayIdentifiable[];
    campuses: DisplayIdentifiable[];
    schools: DisplayIdentifiable[];
  };
}

interface Attachment {
  key: string;
  url: string;
  extension: string;
}

export interface SchoolSctructureEntity {
  entityId: number;
  type: 'school' | 'campus' | 'company' | 'sub-company' | 'level' | 'class';
  displayName?: string;
  parentId?: string | null;
}

interface TargetRole {
  id: number;
  displayName: string;
}

export interface ViewPost extends Post {
  viewed: boolean;
  createdFor: string[];
  reactions: Array<{
    type: ReactionType;
    isReacted: boolean;
    count: number;
    users?: ReactionUser[];
  }>;
}

export type UserFeedResponse = IPaginatedResponse<ViewPost[]>;
export interface AnnouncementUser {
  id: number;
  displayName: string;
  displayedValue: string;
  value: number;
  countryCode: string;
  phoneNumber: string;
  userId: number;
  roleId: number;
}

export type AnnouncementUserResponse = IPaginatedResponse<AnnouncementUser[]>;

export interface AnnouncementRole {
  id: number;
  displayName: string;
  selected: boolean;
}
export type AnnouncementRoleResponse = IResponse<AnnouncementRole[]>;
