import {
  ConnectedProfileDTO,
  CreatedByDTO,
  NationalityDTO,
  UpdatedByDTO,
} from '@shared/dto-transformation/common/common.dto';
import {
  Gender,
  GuardianRelationship,
  UserProfileColors,
  UserStatus,
} from '@shared/enums';

export interface StudentDTO {
  id: number;
  arFullName: string;
  enFullName: string;
  imageUrl?: string;
  profileColor?: UserProfileColors;
  countryCode?: string;
  phoneNumber?: string;
  nationalId: string;
  preferredName: string | null;
  gender: Gender;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy: CreatedByDTO;
  updatedBy?: UpdatedByDTO;
  tenantId: number;
  nationalityId: number;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiryDate: string;
  registrationDate: string;
  pioneerId: string;
  schoolLevelId: number;
  userId: number;
  roleId: number;
  nationality: NationalityDTO;
  schoolStructure: StudentSchoolStructureDTO[];
  studentClasses: StudentClassDTO[];
  classes: StudentClassDTO[];
  levels: StudentLevelDTO[];
  schools: StudentSchoolDTO[];
  campuses: StudentCampusDTO[];
  companies: StudentCompanyDTO[];
  academicYears: AcademicYearDTO[];
  guardians: StudentGuardianDTO[];
  userStatuses?: string;
  schoolLevels: StudentSchoolLevelDTO[];
  userEvent: UserEventDTO[] | null;
  connectedGuardian: ConnectedProfileDTO;
  connectedPersonnel: ConnectedProfileDTO;
  statusData?: StatusDataDTO;
  isPasswordSetup?: boolean;
}

export interface StudentSchoolDTO {
  id: number;
  arName: string;
  enName: string;
  campusId: number;
}

export interface StudentCompanyDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface StudentCampusDTO {
  id: number;
  arName: string;
  enName: string;
  companyId: number;
}

export interface StudentLevelDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface StudentGuardianDTO {
  id: number;
  arFullName: string;
  enFullName: string;
  nationalId: string;
  countryCode: string;
  phoneNumber: string;
  guardianRelationship: GuardianRelationship;
  profileColor?: UserProfileColors;
  imageUrl?: string;
}

export interface StudentClassDTO {
  id: number;
  arName: string;
  enName: string;
  roomNumber?: string;
}

interface StudentPersonnelDTO {
  id: number;
  arFullName: string;
  enFullName: string;
  imageUrl?: string;
}

export interface AcademicYearDTO {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}
interface StudentSchoolLevelDTO {
  id: number;
  levelId: number;
  schoolId: number;
}

interface StudentSchoolStructureDTO {
  class: StudentClassDTO;
  level: StudentLevelDTO;
  campus: StudentCampusDTO;
  school: StudentSchoolDTO;
  company: StudentCompanyDTO;
  schoolLevel: StudentSchoolLevelDTO;
  academicYear: AcademicYearDTO;
}

interface UserEventDTO {
  id: number;
  userId: number;
  eventType: string;
  createdAt: string;
  tenantId: number;
}

interface StatusDataDTO {
  id: number;
  status: UserStatus;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: string;
  createdBy: CreatedByDTO;
}
