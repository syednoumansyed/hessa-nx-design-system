import { EducationalPathEnum, GenderEnum } from '@shared/enums';
import { ILevel } from './level.interface';
import { ICreatedBy, IUpdatedBy } from './created-by.interface';
import { IStage } from './campus.interface';

export interface ISchoolPayload {
  arName: string;
  enName: string;
  campusId: number;
  gender: GenderEnum;
  educationalPath: EducationalPathEnum;
  stageId: number;
  principal?: number;
  examController?: number;
  key: string;
}

export interface ISchool {
  id: number;
  name: string;
  gender: GenderEnum;
  educationalPath: EducationalPathEnum;
  campusId: number;
  tenantId: number;
  stageId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: ICreatedBy;
  updatedBy: number | null | IUpdatedBy;
  levels: ILevel[];
  schoolLevels: ILevel[];
  stage: IStage;
  hasAccess: boolean;
  url?: string;
  campus: {
    id: number;
    name: string;
    companyId: number;
    tenantId: number;
    countryCode: string;
    phoneNumber: string;
    country: string;
    city: string;
    district: string;
    website: null;
    description: null;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    updatedBy: string | null;
    company: {
      id: number;
      name: string;
      tenantId: number;
      createdAt: string;
      updatedAt: string;
      createdBy: string | null;
      updatedBy: string | null;
      parentId: number | null;
      parent: any | null;
      subCompanies: any[];
    };
  };
}
