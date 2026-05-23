import { ICampus } from './campus.interface';
import { ICreatedBy, IUpdatedBy } from './created-by.interface';

export interface ICountry {
  name_ar: string;
  name_en: string;
}

export interface ICity {
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
}

export interface IDistrict {
  district_id: number;
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
}

export interface ISubCompany {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy: ICreatedBy;
  updatedBy: number | null | IUpdatedBy;
  campuses: ICampus[];
  parentId: number;
  hasAccess: boolean;
}
export interface ICompany extends ISubCompany {
  subCompanies: ISubCompany[];
}
