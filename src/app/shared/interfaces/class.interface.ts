import { Gender, ResourceStatus } from '@shared/enums';
import { ICreatedBy, IUpdatedBy } from './created-by.interface';

export interface ClassDTO {
  id: number;
  name: string;
  roomNumber: string;
  schoolLevelId: number;
  hasAccess: boolean;
  updateAt: string;
  updateBy: string;
}

export interface IClassPayload {
  schoolId: number;
  levelId: number;
  arName: string;
  enName: string;
  roomNumber?: string;
}

export interface IClassAssignStudentToClassPayload {
  classId: number;
  studentId: number[];
}

export interface IClassStudentListQueryParams {
  id?: number;
  fullName?: string;
  countryCode?: string;
  phoneNumber?: string;
  nationalId?: string;
  gender?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  tenantId?: number;
  nationalityId?: number;
  dateOfBirth?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  registrationDate?: string;
  schoolLevelId?: number;
  pioneerId?: string;
  userId?: number;
  roleId?: number;
  pageNumber?: string | number;
  itemsPerPage?: string | number;
  sortByColumn?: string;
  searchText?: string;
}

export interface IClassStudentsResponse {
  class: {
    id: number;
    name: string;
    roomNumber: string;
    schoolLevelId: number;
    tenantId: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
  };
  students: Array<IClassStudentList>;
}

export interface IClassStudentList {
  id: number;
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  nationalId: string;
  gender: Gender;
  status: ResourceStatus;
  studentClass?: {
    id: number;
    classId: number;
    studentId: number;
    status: ResourceStatus;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  tenantId: number;
  nationalityId: number;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiryDate: string;
  registrationDate: string;
  schoolLevelId: number;
  pioneerId: string;
  userId: number;
  roleId: number;
  actions: string;
}
