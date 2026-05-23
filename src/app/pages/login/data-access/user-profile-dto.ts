import { Gender, UserType } from '@shared/enums';
import { UserInfo, UserProfile, UserSettings } from '@auth/model';

export interface UserProfileDTO {
  userId: number;
  fullName: string;
  arFullName: string | null;
  enFullName: string | null;
  gender: Gender;
  type: UserType;
  tenantId: string;
  userTypeId: number;
  status: string;
}

export interface LoginVerifyDTO {
  success: boolean;
  messageRef: string;
  data: {
    userInfo: UserInfoDTO;
    profilesDetected?: boolean;
    users: Array<UserProfileDTO>;
    token: {
      accessToken: string;
      refreshToken: string;
      chatAuthToken: string;
    };
  };
}

export interface UserInfoDTO {
  id: number;
  userTypeId: number;
  arFullName: string | null;
  enFullName: string | null;
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
