import {
  DsAttendanceStats,
  DsAttendanceEvent,
  DsCalendarStats,
} from '@ds/calendar/attendance-calendar.component';
import { IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';

export type StudentAttendanceDetailParams = {
  fromDate?: Date;
  toDate?: Date;
  classId?: ObjId;
  levelId?: ObjId;
  schoolId?: ObjId;
  academicYearId?: ObjId;
  semesterId?: ObjId;
};

export interface AttendanceHolidayRawDto {
  enName?: string | null;
  arName?: string | null;
  globalHoliday?: {
    enName?: string | null;
    arName?: string | null;
  } | null;
}

export interface AttendanceEventRawDto {
  id: number;
  date: string | Date;
  attendanceStatus?: string | null;
  confirmationStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  reason: string | null;
  type: string;
  day: number;
  isHoliday: boolean;
  isWeekend: boolean;
  absenceType?: string | null;
  holiday?: AttendanceHolidayRawDto;
}

export interface AttendanceDetailRawDto {
  dates: AttendanceEventRawDto[];
  attendanceStats: DsAttendanceStats;
  calenderStats: DsCalendarStats;
  student?: {
    fullName: string;
  };
}

export interface AttendanceDetailDto {
  dates: DsAttendanceEvent[];
  attendanceStats: DsAttendanceStats;
  calenderStats: DsCalendarStats;
  student?: {
    fullName: string;
  };
}

export type StudentAttendanceDetailsResponseDto =
  IResponse<AttendanceDetailRawDto>;
