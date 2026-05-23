import { IPaginatedResponse, IResponse } from '@shared/interfaces';

export interface AcademicYearDTO {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  semesters: Array<SemesterDTO>;
  holidays?: Array<HolidayDTO>;
}

export interface SemesterDTO {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  semesterNumber?: number;
  academicYear?: AcademicYearDTO;
  academicYearId: number;
  isCurrentSemester?: boolean;
  weeks?: Array<SemesterWeeksDTO>;
}

export interface HolidayDTO {
  id: string;
  weekId: number;
  startDate: string;
  endDate: string | null;
  globalHolidayId: number | null;
  academicYearId: number;
  weekDays?: Array<number>;
  enName?: string;
  arName?: string;
  globalHoliday?: {
    id: number;
    arName: string;
    enName: string;
  } | null;
}

export interface SemesterWeeksDTO {
  id: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  holidays: Array<HolidayDTO>;
  isCurrentWeek: boolean;
  weekDays: Array<number>;
  weekOff: boolean;
}
export interface CreateAcademicYearPayloadDTO {
  startDate: number;
  endDate: number;
}

export interface SemesterPayloadDTO {
  startDate: number;
  endDate: number;
  academicYearId: number;
}

export interface GlobalHolidayDTO {
  id: number;
  arName: string;
  enName: string;
  tenantId: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
}

export interface HolidayPayloadDTO {
  academicYearId?: number;
  startDate?: number;
  endDate?: number;
  globalHolidayId?: number;
  arName?: string;
  enName?: string;
}

export type AcademicYearResponseDTO = IResponse<AcademicYearDTO>;
export type AcademicYearsResponseDTO = IPaginatedResponse<AcademicYearDTO[]>;
export type SemesterResponseDTO = IResponse<SemesterDTO>;
export type GlobalHolidaysResponseDTO = IResponse<GlobalHolidayDTO[]>;
export type HolidayResponseDTO = IResponse<HolidayDTO>;
