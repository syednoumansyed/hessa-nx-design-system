import { IResponse } from '@shared/interfaces';

export interface SupportCustomFieldDTO {
  readonly id: number;
  readonly arLabel: string;
  readonly enLabel: string;
  readonly arDescription: string | null;
  readonly enDescription: string | null;
  readonly required: boolean;
  readonly tenantId: number;
  readonly createdAt: string;
  readonly updatedAt: string | null;
  readonly createdBy: number;
  readonly updatedBy: number | null;
}

export type SupportCustomFieldListResponseDTO = IResponse<
  SupportCustomFieldDTO[]
>;
