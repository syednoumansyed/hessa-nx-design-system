import { EducationalPathEnum, GenderEnum } from '@shared/enums';
import { CreatedBy, UpdatedBy } from '../common/common.interface';
import { LocalizedEntity } from '../shared/localized-entity.interface';
import { IAttachment } from '@shared/interfaces/attachment';

export interface Company extends LocalizedEntity {
  id: number;
  hasAccess: boolean;
  campuses: Campus[];
  subCompanies: Company[];
  parentId: number | null;
  createdAt: string;
  createdBy: CreatedBy;
  attachments: IAttachment[];
  displayLogo: string | null;
}

export interface Campus extends LocalizedEntity {
  id: number;
  companyId: number;
  company: Company | null;
  schools: School[];
  hasAccess: boolean;
  district: string;
  city: string;
  phoneNumber: string;
  countryCode: string;
  country: string;
  website: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  createdBy: CreatedBy;
}

export interface School extends LocalizedEntity {
  id: number;
  displayName: string;
  campusId: number;
  hasAccess: boolean;
  schoolLevels: Level[];
  campus: Campus | null;
  createdAt: string;
  createdBy: CreatedBy;
  gender: GenderEnum;
  educationalPath: EducationalPathEnum;
  stage: Stage | null;
  attachments: IAttachment[];
  displayLogo: string | null;
  examController: number | null;
  principal: number | null;
}

export interface Level extends LocalizedEntity {
  id: number;
  hasAccess: boolean | null;
  schoolId: number | null;
  classes: Class[];
  schoolLevelId: number | null;
  createdAt: string;
  createdBy: CreatedBy | null;
}

export interface Class extends LocalizedEntity {
  id: number;
  hasAccess: boolean;
  schoolLevelId: number;
  roomNumber: string | null;
  createdAt: string;
  createdBy: CreatedBy | null;
  value: string;
}

export interface CreateCompanyPayload {
  enName: string;
  arName: string;
  parentId?: number;
  key: string;
}

export interface Stage extends LocalizedEntity {
  id: number;
}
