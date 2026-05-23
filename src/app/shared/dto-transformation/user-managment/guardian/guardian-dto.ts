import {
  ConnectedProfileDTO,
  CreatedByDTO,
  FullNameLocalizedIdentifiableDTO,
  NameLocalizedIdentifiableDTO,
  UpdatedByDTO,
  UserEventDTO,
} from '@shared/dto-transformation/common/common.dto';
import {
  Gender,
  GuardianRelationship,
  ResourceStatus,
  StudentRelationship,
  UserProfileColors,
  UserType,
} from '@shared/enums';
import { StudentDTO } from '../student';

export interface GuardianDTO {
  id: number;
  profileColor: UserProfileColors;
  arFullName: string;
  enFullName: string;
  countryCode: string;
  phoneNumber: string;
  nationalId: string;
  preferredName: string | null;
  gender: Gender;
  type: UserType;
  status: ResourceStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: CreatedByDTO;
  updatedBy: number | null | UpdatedByDTO;
  tenantId: number;
  userId: number;
  connectedPersonnel?: ConnectedProfileDTO;
  connectedStudents?: ConnectedProfileDTO;
  students: Array<GuardianStudentDTO>;
  academicYears: AcademicYearDTO[];
  userEvent?: UserEventDTO[] | null;
  levels: NameLocalizedIdentifiableDTO[] | null;
  classes: NameLocalizedIdentifiableDTO[] | null;
  studentClasses: GuardianStudentClassDTO[] | null;
  campuses: GuardianCampusDTO[] | null;
  companies: NameLocalizedIdentifiableDTO[] | null;
  schools: NameLocalizedIdentifiableDTO[] | null;
  email: string;
}

export interface GuardianStudentDTO extends StudentDTO {
  studentRelationship: StudentRelationship;
  guardianRelationship: GuardianRelationship;
}
export interface GuardianCampusDTO {
  id: number;
  arName: string;
  enName: string;
  description: string;
  city: string;
  district: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  website: string | null;
  companyId: number;
}
interface AcademicYearDTO {
  id: number;
  name: string;
}

interface GuardianStudentClassDTO {
  academicYearId: number;
  classId: number;
  id: number;
  status: 'INACTIVE' | 'ACTIVE';
  studentId: number;
}
