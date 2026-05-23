import { EducationalPathEnum, GenderEnum } from '@shared/enums';
import { CreatedByDTO, UpdatedByDTO } from '../common/common.dto';

export interface ClassDTO {
  id: number;
  arName: string;
  enName: string;
  roomNumber: string | null;
  schoolLevelId: number;
  hasAccess: boolean;
  createdAt: string;
  createdBy: CreatedByDTO;
}
export interface LevelDTO {
  id: number;
  arName: string;
  enName: string;
  createdAt: string;
  createdBy?: CreatedByDTO;
}

export interface SchoolLevelDTO {
  id: number;
  schoolId: number;
  tenantId: number;
  hasAccess: boolean;
  classes: ClassDTO[];
  arName?: string;
  enName?: string;
  level?: LevelDTO;
  levelId: number;
  createdBy?: CreatedByDTO;
  createdAt: string;
}
export interface StageDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface SchoolDTO {
  id: number;
  enName: string;
  arName: string;
  gender: GenderEnum;
  educationalPath: EducationalPathEnum;
  campusId: number;
  tenantId: number;
  stageId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: CreatedByDTO;
  updatedBy: number | null | UpdatedByDTO;
  levels: LevelDTO[];
  schoolLevels: SchoolLevelDTO[];
  stage?: StageDTO;
  hasAccess: boolean;
  url: string;
  campus: CampusDTO;
  extension: string;
  key: string;
  examController: number | null;
  principal: number | null;
}

export interface CampusDTO {
  schoolsCount: number;
  id: number;
  enName: string;
  arName: string;
  companyId: number;
  tenantId: number;
  countryCode: string;
  phoneNumber: string;
  country: string;
  city: string;
  district: string;
  website: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: CreatedByDTO;
  updatedBy: number | null | UpdatedByDTO;
  schools: SchoolDTO[];
  company: CompanyDTO;
  hasAccess: boolean;
  latitude: number;
  longitude: number;
}

export interface CompanyDTO {
  id: number;
  arName: string;
  enName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: CreatedByDTO;
  updatedBy: number | null | UpdatedByDTO;
  campuses: CampusDTO[];
  hasAccess: boolean;
  subCompanies?: CompanyDTO[];
  parentId: number | null;
  extension: string;
  key: string;
  url: string;
}
