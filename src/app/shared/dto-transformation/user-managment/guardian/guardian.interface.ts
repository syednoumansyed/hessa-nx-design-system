import {
  ConnectedProfile,
  CreatedBy,
  NameLocalizedIdentifiable,
  UserEvent,
} from '@shared/dto-transformation/common/common.interface';
import { FullNameLocalizedEntity } from '@shared/dto-transformation/shared/localized-entity.interface';
import {
  Gender,
  GuardianRelationship,
  ResourceStatus,
  StudentRelationship,
  UserProfileColors,
  UserType,
} from '@shared/enums';
import { Student } from '../student';

export interface Guardian extends FullNameLocalizedEntity {
  id: number;
  profileColor: UserProfileColors;
  displayPreferredName: string;
  preferredName: string | null;
  countryCode: string;
  phoneNumber: string;
  displayPhoneNumber: string;
  nationalId: string;
  gender: Gender;
  type: UserType;
  status: ResourceStatus;
  createdAt: Date;
  createdBy: CreatedBy;
  tenantId: number;
  userId: number;
  connectedPersonnel?: ConnectedProfile | null;
  connectedStudents?: ConnectedProfile | null;
  students: GuardianStudent[];
  academicYears: AcademicYear[];
  userEvent?: UserEvent[] | null;
  level: NameLocalizedIdentifiable | null;
  classe: NameLocalizedIdentifiable | null;
  campus: GuardianCampus | null;
  company: NameLocalizedIdentifiable | null;
  companies: NameLocalizedIdentifiable[];
  campuses: GuardianCampus[];
  school: NameLocalizedIdentifiable | null;
  schools: NameLocalizedIdentifiable[];
  email: string;
}

export interface GuardianStudent extends Student {
  studentRelationship: StudentRelationship;
  guardianRelationship: GuardianRelationship;
}
export interface GuardianCampus {
  id: number;
  displayName: string;
  latitude: number;
  longitude: number;
}
interface GuardianStudentClass {
  academicYearId: number;
  classId: number;
  id: number;
  status: 'INACTIVE' | 'ACTIVE';
  studentId: number;
}

interface AcademicYear {
  id: number;
  name: string;
}
