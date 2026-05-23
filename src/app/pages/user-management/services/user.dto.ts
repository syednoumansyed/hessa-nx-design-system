import { IResponse } from '@shared/interfaces';

export interface UserDTO {
  id: number;
  fullName: string;
  countryCode: string;
  phoneNumber: string;
  nationalId: string;
  password: string;
  gender: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  tenantId: number;
}

export type UserResponseDTO = IResponse<UserDTO>;
export type UserNationIdInUseResponseDTO = IResponse<{ nationalId: string }>;
