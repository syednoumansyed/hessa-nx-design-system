import {
  ConnectedProfileDTO,
  CreatedByDTO,
  NameLocalizedIdentifiableDTO,
  NationalityDTO,
  UserEventDTO,
} from '@shared/dto-transformation/common/common.dto';
import { Gender, UserProfileColors, UserType } from '@shared/enums';

export interface PersonnelDTO {
  id: number;
  profileColor: UserProfileColors;
  nationalId: string;
  arFullName: string;
  enFullName: string;
  preferredName: string | null;
  countryCode: string;
  phoneNumber: string;
  employeeIdentifier: string;
  nationalityId: number;
  gender: Gender;
  email: string;
  status: string;
  roles: RoleDTO[];
  dateOfBirth: string | null;
  passportNumber: string | null;
  passportExpiryDate: string | null;
  startDate: string | null;
  type: UserType;
  nationality?: NationalityDTO;
  schools: PersonnelSchoolDTO[];
  connectedGuardian: ConnectedProfileDTO;
  connectedStudent: ConnectedProfileDTO;
  userId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: CreatedByDTO;
  userEvent: UserEventDTO[] | null;
  companies: PersonnelCompanyDTO[] | null;
  campuses: PersonnelCampusDTO[] | null;
  levels: NameLocalizedIdentifiableDTO[] | null;
}

interface RoleDTO {
  id: number;
  personnelId: number;
  roleId: number;
  arName: string;
  enName: string;
  tenantId?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PersonnelSchoolDTO {
  id: number;
  arName: string;
  enName: string;
  campusId: number;
}

interface PersonnelCompanyDTO {
  id: number;
  arName: string;
  enName: string;
  parentId: number | null;
}

interface PersonnelCampusDTO {
  id: number;
  arName: string;
  enName: string;
  companyId: number;
}

export interface SubjectAssociationDTO {
  id: number;
  subjectId: number;
  personnelId: number;
  arName: string;
  enName: string;
  url?: string;
  hasCourse?: boolean;
}

export interface AssociatePersonnelDataDTO {
  schools: Array<{
    id: number;
    arName: string;
    enName: string;
    campusId: number;
  }>;
  campuses: Array<{
    id: number;
    arName: string;
    enName: string;
    companyId: number;
  }>;
  companies: Array<{
    id: number;
    arName: string;
    enName: string;
    parentId: string | null;
  }>;
}
