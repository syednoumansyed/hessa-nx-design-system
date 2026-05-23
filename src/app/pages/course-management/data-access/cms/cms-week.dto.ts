import { IResponse } from '@shared/interfaces';

export interface WeekDTO {
  id: number;
  academicYearId: number;
  semesterId: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  tenantId: number;
  topicId: number;
  available: boolean;
  isCurrentWeek: boolean;
}

export type CMSWeeksListResponseDTO = IResponse<WeekDTO[]>;
