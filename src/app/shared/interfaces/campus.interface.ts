import { ICompany } from './company.interface';
import { ICreatedBy, IUpdatedBy } from './created-by.interface';
import { ISchool } from './school.interface';

export interface ICampusPayload {
  companyId: number;
  arName: string;
  enName: string;
  countryCode: string;
  phoneNumber: string;
  country: string;
  city: string;
  district: string;
  website: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface ICampus {
  schoolsCount: number;
  id: number;
  name: string;
  companyId: number;
  tenantId: number;
  phoneNumber: string;
  countryCode: string;
  country: string;
  city: string;
  district: string;
  website: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: ICreatedBy;
  updatedBy: number | null | IUpdatedBy;
  schools: ISchool[];
  company: ICompany;
  hasAccess: boolean;
  latitude: number;
  longitude: number;
}

export interface IStage {
  id: number;
  name: string;
  tenantId: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number | null;
  updatedBy?: number | null;
}
