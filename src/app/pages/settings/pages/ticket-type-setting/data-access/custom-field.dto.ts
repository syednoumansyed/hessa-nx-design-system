import { IPaginatedResponse } from '@shared/interfaces';

export interface CustomFieldSupportTypeDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface CustomFieldDTO {
  id: number;
  arLabel: string;
  enLabel: string;
  arDescription: string | null;
  enDescription: string | null;
  required: boolean;
  tenantId: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
  supportTypes: CustomFieldSupportTypeDTO[];
}

export type CustomFieldListResponseDTO = IPaginatedResponse<CustomFieldDTO[]>;

export interface CreateCustomFieldDTO {
  arLabel: string;
  enLabel: string;
  arDescription?: string;
  enDescription?: string;
  required: boolean;
}
