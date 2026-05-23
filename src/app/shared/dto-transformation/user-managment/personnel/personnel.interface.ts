import {
  ConnectedProfile,
  CreatedBy,
  FullNameLocalizedIdentifiable,
  NameLocalizedIdentifiable,
  Nationality,
  UserEvent,
} from '@shared/dto-transformation/common/common.interface';
import { Gender, UserProfileColors, UserType } from '@shared/enums';

export interface Personnel extends FullNameLocalizedIdentifiable {
  id: number;
  displayPreferredName: string;
  preferredName: string | null;
  profileColor: UserProfileColors;
  nationalId: string;
  arFullName: string;
  enFullName: string;
  countryCode: string;
  phoneNumber: string;
  displayPhoneNumber: string;
  employeeIdentifier: string;
  nationalityId: number;
  gender: Gender;
  email: string;
  status: string;
  roles: Role[];
  dateOfBirth: string | null;
  passportNumber: string | null;
  passportExpiryDate: string | null;
  startDate: string | null;
  type: UserType;
  nationality: Nationality | null;
  schools: PersonnelSchool[];
  connectedGuardian: ConnectedProfile | null;
  connectedStudent: ConnectedProfile | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: CreatedBy | null;
  userEvent: UserEvent[] | null;
  lastUserEvent: UserEvent | null;
  companies: PersonnelCompany[];
  campuses: PersonnelCampus[];
  levels: NameLocalizedIdentifiable[];
  displayRoleNames: () => string;
}

interface Role {
  id: number;
  displayName: string;
}

interface PersonnelSchool {
  id: number;
  displayName: string;
  campusId: number;
}

interface PersonnelCompany {
  id: number;
  displayName: string;
  parentId: number | null;
}

interface PersonnelCampus {
  id: number;
  displayName: string;
  companyId: number;
}

export interface SubjectAssociation {
  subjectId: number;
  displayName: string;
  iconUrl?: string;
  hasCourse?: boolean;
}

export interface AssociatePersonnelData {
  schools: Array<{ id: number; displayName: string; campusId: number }>;
  campuses: Array<{ id: number; displayName: string; companyId: number }>;
  companies: Array<{
    id: number;
    displayName: string;
    parentId: string | null;
  }>;
}
