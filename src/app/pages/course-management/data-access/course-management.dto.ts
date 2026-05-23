import { IResponse } from '@shared/interfaces';

export interface AddLecturePayloadDTO {
  courseId: number;
  classId: number;
  dayOfWeek: number;
  periodId: number;
}

export interface LectureDTO {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseClassId: string;
  name?: string;
  periodId: number;
  periodNumber: number;
}

export type LectureResponseDTO = IResponse<LectureDTO>;

export interface CourseManagementDTO {
  id: number;
  subject: {
    id: number;
    arName: string;
    enName: string;
  };
  personnel: {
    id: number;
    arFullName: string;
    enFullName: string;
  };
  lectures: Array<{
    dayOfWeek: number;
    endTime: string;
    id: number;
    periodId: number;
    periodNumber: number;
    startTime: string;
  }>;
  academicYear: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  company: {
    id: number;
    arName: string;
    enName: string;
  };
  campus: {
    id: number;
    arName: string;
    enName: string;
  };
  school: {
    id: number;
    arName: string;
    enName: string;
  };
  level: {
    id: number;
    arName: string;
    enName: string;
  };
  class: {
    id: number;
    arName: string;
    enName: string;
  };
  status: string;
  creditHour: number;
  hasContents: boolean;
}

export interface CourseSubjectDTO {
  id: number;
  arName: string;
  enName: string;
}
