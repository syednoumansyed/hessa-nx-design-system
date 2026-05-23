import { AcademicYearDTO } from '@pages/academic-year/data-access/academic-year.dto';
import { IPaginatedResponse } from './api.interface';
import { ObjId } from '@shared/interfaces/common.interface';

export interface IGenericIdName {
  id: number | string;
  name?: string;
  fullName?: string;
}

export interface ICourseData {
  id: number;
  status: string;
  tenantId: number;
  createdAt: string;
  updatedAt: string;
  personnelId: number;
  coPersonnelId: number;
  creditHour: number;
  class: IGenericIdName;
  subject: IGenericIdName;
  personnel: IGenericIdName;
  academicYear: AcademicYearDTO;
  school: IGenericIdName;
  campus: IGenericIdName;
  company: IGenericIdName;
  level: IGenericIdName;
  lectures: ILecture[];
  hasContents: boolean;
}

export interface ILecture {
  dayOfWeek: number;
  endTime: string;
  id: ObjId;
  periodNumber: number;
  startTime: string;
}

export type ICourseResponse = IPaginatedResponse<ICourseData[]>;
