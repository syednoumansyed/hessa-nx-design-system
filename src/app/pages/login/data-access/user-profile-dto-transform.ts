import {
  LoginVerifyDTO,
  UserInfoDTO,
  UserProfileDTO,
} from '@pages/login/data-access/user-profile-dto';
import {
  LoginVerifyResponse,
  UserProfile,
} from '@pages/login/data-access/user-profile.interface';
import { getLocalizedFullName } from '@utils/localization.util';
import { UserInfo } from '@auth/model';

export const USER_PROFILE_MAP_FROM_DTO = {
  userProfile(dto: UserProfileDTO): UserProfile {
    return {
      userId: dto.userId,
      displayName: getLocalizedFullName(dto),
      gender: dto.gender,
      type: dto.type,
      tenantId: dto.tenantId,
      userTypeId: dto.userTypeId,
      status: dto.status,
    };
  },
};

export const LOGIN_VERIFY_RESPONSE_MAP_FROM_DTO = {
  loginResponse(dto: LoginVerifyDTO): LoginVerifyResponse {
    return {
      success: dto.success,
      messageRef: dto.messageRef,
      data: {
        profilesDetected: dto.data.profilesDetected,
        token: {
          accessToken: dto.data.token.accessToken,
          refreshToken: dto.data.token.refreshToken,
          chatAuthToken: dto.data.token.chatAuthToken,
        },
        users: dto.data.users
          ? dto.data?.users.map((user) =>
              USER_PROFILE_MAP_FROM_DTO.userProfile(user),
            )
          : [],
        userInfo: USER_INFO_MAP_FROM_DTO.userInfo(dto.data.userInfo),
      },
    };
  },
};

export const USER_INFO_MAP_FROM_DTO = {
  userInfo(dto: UserInfoDTO): UserInfo {
    return {
      id: dto.id,
      userTypeId: dto.userTypeId,
      displayName: getLocalizedFullName({
        enFullName: dto.enFullName,
        arFullName: dto.arFullName,
      }),
      arFullName: dto.arFullName,
      enFullName: dto.enFullName,
      countryCode: dto.countryCode,
      phoneNumber: dto.phoneNumber,
      nationalId: dto.nationalId,
      gender: dto.gender,
      password: dto.password,
      isPasswordSetup: dto.isPasswordSetup,
      type: dto.type,
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,
      tenantId: dto.tenantId,
      roles: dto.roles,
      settings: dto.settings,
    };
  },
};
