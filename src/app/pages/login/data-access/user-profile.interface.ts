import { Gender, UserType } from '@shared/enums';
import { UserSettings } from '@auth/model';

export interface UserProfile {
  userId: number;
  displayName: string;
  gender: Gender;
  type: UserType;
  userTypeId: number;
  tenantId: string;
  status: string;
}

export interface LoginVerifyResponse {
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
