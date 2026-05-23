import {
  ConnectedProfile,
  CreatedBy,
  Nationality,
  UserEvent,
} from '@shared/dto-transformation/common/common.interface';
import {
  FullNameLocalizedEntity,
  LocalizedEntity,
} from '@shared/dto-transformation/shared/localized-entity.interface';
import {
  Gender,
  GuardianRelationship,
  UserProfileColors,
  UserStatus,
  UserType,
} from '@shared/enums';

export interface Student extends FullNameLocalizedEntity {
  id: number;
  profileColor?: UserProfileColors;
  displayPreferredName: string;
  preferredName: string | null;
  nationalId: string;
  phoneNumber: string | null;
  displayPhoneNumber: string | null;
  imageUrl: string | null;
  dateOfBirth: string;
  pioneerId: string;
  passportNumber: string;
  passportExpiryDate: string | null;
  countryCode: string | null;
  registrationDate: string;
  nationalityName: string | null;
  nationalityId: number | null;
  company: StudentCompany | null;
  campus: StudentCampus | null;
  school: StudentSchool | null;
  level: StudentLevel | null;
  class: StudentClass | null;
  academicYear: AcademicYear | null;
  type: UserType;
  studentClassStatus: 'ACTIVE' | 'INACTIVE' | null;
  status: UserStatus;
  createdBy: CreatedBy | null;
  createdAt: string;
  getAllCompaniesName: () => string;
  getAllCampusesName: () => string;
  getAllSchoolsName: () => string;
  getAllLevelsName: () => string;
  getAllClassesName: () => string;
  guardians: StudentGuardian[];
  gender: Gender;
  userId: number;
  lastActive: string | null;
  updatedAt: string | null;
  lastUserEvent: UserEvent | null;
  connectedGuardian: ConnectedProfile | null;
  connectedPersonnel: ConnectedProfile | null;
  statusData: StatusData | null;
  userStatuses: string | null;
  isPasswordSetup: boolean;
}

interface StudentCompany {
  id: number;
  displayName: string;
}

interface StudentCampus {
  id: number;
  displayName: string;
}

interface StudentSchool {
  id: number;
  displayName: string;
}
interface StudentLevel {
  id: number;
  displayName: string;
}

interface StudentClass {
  id: number;
  displayName: string;
}

interface AcademicYear {
  id: number;
  displayName: string;
}

export interface StudentGuardian {
  id: number;
  displayName: string;
  displayPhoneNumber: string;
  nationalId: string;
  guardianRelationship: GuardianRelationship;
  profileColor?: UserProfileColors;
  imageUrl?: string;
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
