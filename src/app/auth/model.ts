import { UserType, Gender } from '@shared/enums';
import { IResponse } from '@shared/interfaces';

export interface UserInfo {
  id: number;
  userTypeId: number;
  displayName: string;
  arFullName?: string | null;
  enFullName?: string | null;
  countryCode: string;
  phoneNumber: string;
  nationalId: string;
  gender: string;
  password: null | string;
  isPasswordSetup: boolean;
  type: UserType;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: null | string;
  updatedBy: null | string;
  tenantId: number;
  roles: Array<{ id: number; name: string }>;
  settings: UserSettings;
}

export interface UserSettings {
  selectedAcademicYearId: number | null;
  selectedLanguage: string | null;
  selectedTargetId: number | null;
  selectedTargetType: string | null;
}

export interface UserProfile {
  userId: number;
  displayName: string;
  arFullName?: string | null;
  enFullName?: string | null;
  gender: Gender;
  type: UserType;
  status: string;
  userTypeId: number;
}

export interface UserProfilePayload {
  userId: number;
  arFullName?: string | null;
  enFullName?: string | null;
  gender: Gender;
  type: UserType;
  userTypeId: number;
}

export interface ILoginVerifyResponse {
  success: boolean;
  messageRef: string;
  data: {
    userInfo: UserInfo;
    profilesDetected?: boolean;
    users: Array<UserProfile>;
    token: {
      accessToken: string;
      refreshToken: string;
      chatAuthToken: string;
    };
  };
}
export interface ILoginResponse {
  success: boolean;
  userId: number;
}

export interface IGenericResponse {
  success: boolean;
  message: string;
}

export type LOGIN_CHANNEL = 'sms' | 'whatsapp';

export type LOGIN_TYPE = 'mobile' | 'nationalId';

export interface ILoginPayload {
  type: LOGIN_TYPE;
  channel: LOGIN_CHANNEL;
  phoneNumber?: string;
  nationalId?: string;
  password?: string;
}

export interface ILoginVerifyPayload {
  channel: LOGIN_CHANNEL;
  phoneNumber: string;
  code: string;
  selectedProfile: UserProfilePayload | null;
}

export interface ISwitchPayload {
  userId?: number;
  id: number;
  userType: UserType;
}

export type USER_STATUS = 'ACTIVE' | 'INACTIVE' | 'PAUSED';

export interface PlatformOwnerCheckResponse {
  isPlatformOwner: boolean;
}

export type PlatformOwnerCheckResponseDTO =
  IResponse<PlatformOwnerCheckResponse>;
