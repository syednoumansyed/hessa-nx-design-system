import { IPaginatedResponse, IResponse } from '@shared/interfaces';

export interface SemesterDTO {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  academicYear?: AcademicYearDTO;
  academicYearId: number;
}

export interface AcademicYearDTO {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  semesters: Array<SemesterDTO>;
}

export interface CreateAcademicYearPayloadDTO {
  startDate: number;
  endDate: number;
}

export interface SemesterPayloadDTO {
  startDate: number;
  endDate: number;
  academicYearId?: number;
}
export type AcademicYearResponseDTO = IResponse<AcademicYearDTO>;
export type AcademicYearsResponseDTO = IPaginatedResponse<AcademicYearDTO[]>;

export type SemesterResponseDTO = IResponse<SemesterDTO>;
