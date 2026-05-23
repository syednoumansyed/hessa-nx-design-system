import { Student } from '@shared/dto-transformation';
import {
  Gender,
  GuardianRelationship,
  ResourceStatus,
  SortOrder,
  StudentRelationship,
  UserStatus,
  UserType,
} from '../enums';

export interface IStudentGuardian {
  id: number;
  guardianRelationship: GuardianRelationship;
  studentRelationship: StudentRelationship;
  guardianId: number;
  studentId: number;
  tenantId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: null;
  updatedBy: null;
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  nationalId: string;
  gender: Gender;
  type: UserType;
  status: ResourceStatus;
  userId: number;
}

export interface IStudentQueryParams {
  nationalId?: string;
  phoneNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  pioneerId?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  registrationDate?: string;
  nationalityId?: string;
  levelId?: string;
  schoolId?: string;
  campusId?: string;
  companyId?: string;
  gender?: Gender;
  order?: SortOrder;
  pageNumber?: string | number;
  itemsPerPage?: string | number;
  sortByColumn?: string;
  searchText?: string;
  classId?: number;
  academicYearId?: number;
  className?: number;
  studentClassStatus?: string;
  userStatus?: UserStatus;
  userStatuses?: string;
}

export interface IStudentListItem {
  id: number;
  nationalId: string;
  phoneNumber: string;
  displayName: string;
  dateOfBirth: string;
  pioneerId: string;
  passportNumber: string;
  passportExpiryDate: string | null;
  registrationDate: string;
  // academicStatusId: string;
  nationalityId: string;
  levelId?: number;
  levelName?: string;
  classId?: number;
  className?: string;
  schoolId?: number;
  schoolName?: string;
  campusId?: number;
  campusName?: string;
  companyId?: number;
  companyName?: string;
  gender: Gender;
  status: UserStatus;
  actions: string;
  guardian: string;
  guardians?: any;
  userId: number;
  academicYearId?: number;
  aId?: number; // manually mapped from academicYearId to aId
  academicYearName?: string;
  nationalityName: string;
  studentClass?: Student['class'];
  studentClassStatus: 'ACTIVE' | 'INACTIVE' | null;
  statusData?: StatusData;
  userStatuses: string | null;
  lastActive?: string | null;
  updatedAt?: string | null;
}

export interface IPausedPayload {
  status: string;
  startTime: number;
  endTime: number;
  reason: string;
}

interface StatusData {
  id: number;
  status: UserStatus;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: string;
  createdBy: CreatedBy;
}

interface CreatedBy {
  id: number;
  fullName: string;
}
