import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { Gender, UserType, UserProfileColors } from '@shared/enums';
import { SchoolSctructureEntity } from './post.interface';
import { NameLocalizedIdentifiableDTO } from '@shared/dto-transformation';
import { ReactionType } from '@ds/react/types/react.types';

export interface SchoolSctructureEntityDTO {
  entityId: number;
  type: 'school' | 'campus' | 'company' | 'sub-company' | 'level' | 'class';
  arName: string;
  enName: string;
  parentId?: string | null;
}
export interface PostPayload {
  title?: string;
  content: string;
  targets: Array<SchoolSctructureEntity>;
  attachments?: string[];
  roleIds: number[];
  academicYearId: number;
  type: 'notification' | 'sms' | 'post';
  specificPersonsList?: string[];
}

interface User {
  id: number;
  name: string;
}

interface AttachmentDTO {
  key: string;
  url: string;
  extension: string;
}

interface TargetRoleDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface PostDataDTO {
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
    arFullName: string;
    enFullName: string;
    profileColor?: string;
  };
  updatedBy: { id: number; arFullName: string; enFullName: string } | null;
  attachments: AttachmentDTO[];
  targets: SchoolSctructureEntityDTO[];
  targetRoles: TargetRoleDTO[];
}

export type PostResponseDTO = IResponse<PostDataDTO>;

export type UploadImageResponse = IResponse<{ key: string }>;

export type UserFeedPayload = {
  academicYearId: number;
  pageNumber: number;
  itemsPerPage: number;
  studentId?: string;
};

interface SchoolStructure {
  id: number;
  arName: string;
  enName: string;
  campuses: NameLocalizedIdentifiableDTO[];
  gender: string;
  companies: NameLocalizedIdentifiableDTO[];
  schools: NameLocalizedIdentifiableDTO[];
  stageId: number;
  campusId: number;
  tenantId: number;
  createdAt: string;
  createdBy: number;
  updatedAt: string | null;
  updatedBy: number | null;
  educationalPath: string;
}

export interface IAnnouncementPostAuthor {
  nationalId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  gender: Gender;
  profileColor?: UserProfileColors;
  userId: number;
  personnelId: number;
  role: string;
  schoolStructure: {
    school: ISchoolEntity[];
    company: ISchoolEntity[];
    campus: ISchoolEntity[];
  };
}

export interface ISchoolEntity {
  id: number;
  name: string;
}

export interface PostAuthorDetailsDTO {
  nationalId: string;
  arFullName: string;
  enFullName: string;
  email: string;
  phoneNumber: string;
  gender: Gender;
  profileColor?: string;
  userId: number;
  personnelId: number;
  roles: { id: number; arName: string; enName: string }[];
  countryCode: string;
  schoolStructure: SchoolStructure;
}

export interface ReactionUserRoleDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface ReactionUserDTO {
  id: number;
  arFullName: string | null;
  enFullName: string | null;
  profileColor: string;
  preferredName: string | null;
  imageUrl: string | null;
  userType: UserType;
  roles: ReactionUserRoleDTO[];
}

export interface ViewPosDatatDTO extends PostDataDTO {
  viewed: boolean;
  // createdFor can contain a marker string like 'YOU' OR a localized full name object
  // Example payload: [ 'YOU', { arFullName: 'Student A Ar', enFullName: 'Student A' } ]
  createdFor: CreatedForItemDTO[];
  reactions: Array<{
    type: ReactionType;
    isReacted: boolean;
    count: number;
    users?: ReactionUserDTO[];
  }>;
}

// Represents one entry in the createdFor array
export interface CreatedForFullNameDTO {
  arFullName: string;
  enFullName: string;
}

export type CreatedForItemDTO = string | CreatedForFullNameDTO;

export type ViewPostsResponseDTO = IPaginatedResponse<ViewPosDatatDTO[]>;

export interface PostAnnouncementUnreadCountsDTO {
  unreadCounts: number;
}

export type PostAnnouncementUnreadCountsResponseDTO =
  IResponse<PostAnnouncementUnreadCountsDTO>;

interface CountByRole {
  roleId: number;
  count: number;
}

export type CountByRoleResponseDTO = IResponse<CountByRole[]>;

interface GetSMSCost {
  needRecharge: boolean;
  cost: number;
}

export type GetSMSCostDTO = IResponse<GetSMSCost>;

export interface AnnouncementUserQueryParams {
  pageNumber?: string | number;
  itemsPerPage?: string | number;
  searchText?: string;
  targets?: SchoolSctructureEntity[];
  roleId?: number;
  academicYearId?: number;
  arRoleName?: string;
}

export interface AnnouncementUserDTO {
  id: number;
  arFullName: string;
  enFullName: string;
  countryCode: string;
  phoneNumber: string;
  userId: number;
  roleId: number;
}

export type AnnouncementUserResponseDTO = IPaginatedResponse<
  AnnouncementUserDTO[]
>;

export interface AnnouncementRolesDTO {
  id: number;
  arName: string | null;
  enName: string | null;
  selected: boolean;
}
export type AnnouncementRolesResponseDTO = IResponse<AnnouncementRolesDTO[]>;
