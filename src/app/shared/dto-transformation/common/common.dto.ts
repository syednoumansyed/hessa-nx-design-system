import { UserProfileColors, UserType } from '@shared/enums';

export interface CreatedByDTO {
  id: number;
  arFullName: string | null;
  enFullName: string | null;
}

export interface UpdatedByDTO {
  id: number;
  arFullName: string | null;
  enFullName: string | null;
}

export interface NationalityDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface UserEventDTO {
  id: number;
  userId: number;
  eventType: string;
  createdAt: string;
  tenantId: number;
}

export interface NameLocalizedIdentifiableDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface FullNameLocalizedIdentifiableDTO {
  id: number;
  arFullName: string;
  enFullName: string;
}

export interface ConnectedProfileDTO {
  id: number;
  arFullName: string;
  enFullName: string;
  countryCode: string;
  phoneNumber: string;
  nationalId: string;
  type: UserType;
  profileColor?: UserProfileColors;
}

export interface GlobalClassDTO {
  id: number;
  arName: string;
  enName: string;
}
