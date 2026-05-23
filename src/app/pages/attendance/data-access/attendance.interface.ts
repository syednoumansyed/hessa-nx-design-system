import { Gender } from '@shared/enums';
import {
  AttendanceStatus,
  AttendanceType,
  ClassAttendanceStatus,
  ConfirmationStatus,
  StatusHistoryItemDTO,
} from './attendance.dto';

export interface IClassAttendance {
  class: string;
  classId: number;
  level: string;
  levelId: number;
  date: string;
  markedBy: string;
  status: ClassAttendanceStatus;
}

export interface IStudentAttendance {
  id: number;
  name: string;
  nationalId: string;
  imageUrl?: string;
  checkIn?: string;
  checkOut?: string;
  date?: string;
  attendance?: AttendanceStatus | null;
  attendanceType?: AttendanceType;
  reason?: string;
}

export interface IClassAttendanceAbsence {
  fullName: string;
  class: string;
  level: string;
  attendance: string;
  guardian?: string;
  phone?: string;
  status: ConfirmationStatus;
  type: string;
  id: number;
  // Fields for status transition display
  latestConfirmationStatus?: string;
  firstConfirmedStatus?: string;
  statusHistory?: StatusHistoryItemDTO[];
}
export interface IStudentAttendanceListingItem {
  date: string;
  checkIn?: string;
  checkOut?: string;
  attendance?: AttendanceStatus;
  attendanceType?: AttendanceType;
  reason?: string;
}

// below are the interface where we have DTO
export interface AttendanceListItem {
  classId: number;
  displayClassName: string;
  classRoomNumber: string;
  displayLevelName: string;
  levelId: number;
  status: ClassAttendanceStatus;
  date: string;
  displayMarkedBy: string;
}

export interface StudentAttendance {
  studentId: number;
  displayName: string;
  nationalId: string;
  imageUrl?: string;
  attendance: StudentAttendanceDetail | null;
}

export interface StudentAttendanceDetail {
  id: number;
  levelId: number;
  classId: number;
  studentId: number;
  checkIn?: string;
  checkOut?: string;
  reason?: string;
  attendanceStatus: AttendanceStatus;
  type: AttendanceType;
  confirmationStatus: ConfirmationStatus;
  academicYearId: number;
  schoolId: number;
  date: string;
}

export interface AbsenceAttendanceListItem {
  studentId: number;
  displayName: string;
  nationalId: string;
  attendance: AbsentAttendanceDetail;
  guardians: Array<{
    displayName: string;
    displayPhoneNumber: string;
  }>;
  class: {
    id: number;
    displayName: string;
  };
  // Status history from history table
  statusHistory?: StatusHistoryItemDTO[];
}

export interface AttendanceStatusHistory {
  id: number;
  attendanceId: number;
  status: AttendanceStatus;
  reason?: string | null;
  confirmationStatus: ConfirmationStatus;
  isSmsSent: boolean;
  smsContent?: string | null;
  markedByName?: string | null;
  confirmedByName?: string | null;
  createdAt: string;
  smsSentAt?: string | null;
  smsDeliveredAt?: string | null;
}

export interface AbsentAttendanceDetail {
  id: number;
  levelId: number;
  classId: number;
  studentId: number;
  reason: any;
  attendanceStatus: string;
  type: string;
  confirmationStatus: string;
  academicYearId: number;
  schoolId: number;
  date: string;
}

export interface StudentAttendanceDetailsWidthSummary {
  student: {
    userId: number;
    studentId: number;
    displayName: string;
    nationalId: string;
    displayPhoneNumber: string;
    gender: Gender;
    classDisplayName: string;
    classId: number;
    levelId: number;
    levelDisplayName: string;
    imageUrl?: string;
  };
  attendanceStats: {
    TOTAL: number;
    PRESENT: number;
    ABSENT: number;
    LATE_ARRIVAL: number;
    EXCUSED: number;
    ON_LEAVE: number;
  };
  attendances: Array<StudentAttendanceListItem>;
}

export interface StudentAttendanceListItem {
  id: number;
  levelId: number;
  classId: number;
  studentId: number;
  checkIn: string;
  checkOut: string;
  reason: string;
  attendanceStatus: AttendanceStatus;
  markedBy: 44;
  type: AttendanceType;
  confirmationStatus: ConfirmationStatus;
  academicYearId: number;
  schoolId: number;
  date: string;
  tenantId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
}
