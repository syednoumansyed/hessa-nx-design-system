import {
  Gender,
  ResourceStatus,
  SortOrder,
  StudentRelationship,
} from '../enums';
import { IIdentifiable } from './identifiable.interface';
export interface LinkedStudentInfo {
  name: string;
  schoolName: string;
}

export interface IGuardianListItem {
  id: number;
  displayName: string;
  phoneNumber: string;
  displayPhoneNumber: string;
  nationalId: string;
  gender: Gender;
  student: string;
  linkedStudents: LinkedStudentInfo[];
  actions: string;
  status: ResourceStatus;
  userId: number;
  campusId: string;
  schoolId: string;
  companyId: string;
  academicYearId: string;
  lastActive: Date | string | null;
}

export interface IGuardianQueryParams {
  nationalId?: string;
  fullName?: string;
  phoneNumber?: string;
  gender?: Gender;
  order?: SortOrder;
  pageNumber?: string | number;
  itemsPerPage?: string | number;
  sortByColumn?: string;
  searchText?: string;
  campusId?: string;
  schoolId?: string;
  companyId?: string;
  academicYearId?: string;
}

export interface SchoolStructure {
  class: IIdentifiable;
  level: IIdentifiable;
  campus: IIdentifiable;
  school: IIdentifiable;
  company: IIdentifiable;
  academicYear: IIdentifiable;
  schoolLevel: {
    id: number;
  };
}
