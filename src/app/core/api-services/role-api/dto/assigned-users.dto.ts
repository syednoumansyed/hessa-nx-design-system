import { CreatedByDTO } from '@shared/dto-transformation';
import { UserType } from '@shared/enums';
import { IPaginatedResponse } from '@shared/interfaces';
export interface AssignedUsersDTO {
  id: number;
  arFullName: string;
  enFullName: string;
  nationalId: number;
  phoneNumber: string;
  createdBy: CreatedByDTO;
  type: UserType;
  createdAt: string;
}

export type AssignedUserResponseDTO = IPaginatedResponse<AssignedUsersDTO[]>;
