import { Gender } from '@shared/enums';

export interface AttendanceListItemDTO {
  classId: number;
  arClassName: string;
  enClassName: string;
  classRoomNumber: string;
  enLevelName: string;
  arLevelName: string;
  levelId: number;
  status: ClassAttendanceStatus;
  date: string;
  markedByAr: string;
  markedByEn: string;
}

export interface StatusHistoryItemDTO {
  id: number;
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

export interface AbsenceAttendanceListItemDTO {
  studentId: number;
  arFullName: string;
  enFullName: string;
  nationalId: string;
  attendance: AbsentAttendanceDetailDTO;
  guardians: GuardianDTO[];
  class: {
    id: number;
    arName: string;
    enName: string;
  };
  // Status history from history table
  statusHistory?: StatusHistoryItemDTO[];
}

export interface AttendanceStatusHistoryDTO {
  id: number;
  attendanceId: number;
  status: AttendanceStatus;
  reason?: string | null;
  confirmationStatus: ConfirmationStatus;
  isSmsSent: boolean;
  smsContent?: string | null;
  markedByEnName?: string | null;
  markedByArName?: string | null;
  confirmedByEnName?: string | null;
  confirmedByArName?: string | null;
  createdAt: string;
  smsSentAt?: string | null;
  smsDeliveredAt?: string | null;
}

export interface AbsentAttendanceDetailDTO {
  id: number;
  levelId: number;
  classId: number;
  studentId: number;
  reason: any;
  attendanceStatus: string;
  markedBy: number;
  type: string;
  confirmationStatus: string;
  academicYearId: number;
  schoolId: number;
  date: string;
  tenantId: number;
}

export interface GuardianDTO {
  gender?: string;
  status?: string;
  userId?: number;
  arFullName: string;
  enFullName: string;
  guardianId: number;
  nationalId?: string;
  countryCode?: string;
  phoneNumber?: string;
  studentRelationship: string;
  guardianRelationship: string;
}

export interface classAttendanceListQueryParams {
  schoolId: number;
  classId?: number;
  levelId?: number;
  pageNumber?: number;
  itemsPerPage?: number;
  status?: ClassAttendanceStatus;
  date: string;
}

export interface confirmAttendanceListQueryParams {
  schoolId: number;
  classId?: number;
  levelId?: number;
  date: string;
  academicYearId?: number;
}

export interface StudentAttendanceDTO {
  studentId: number;
  arFullName: string;
  enFullName: string;
  nationalId: string;
  imageUrl?: string;
  isAvatar?: boolean;
  attendance?: StudentAttendanceDetailDTO;
}

export interface StudentAttendanceDetailDTO {
  id: number;
  levelId: number;
  classId: number;
  studentId: number;
  checkIn?: string;
  checkOut?: string;
  reason?: string;
  attendanceStatus: AttendanceStatus;
  markedBy: number;
  type: AttendanceType;
  confirmationStatus: ConfirmationStatus;
  academicYearId: number;
  schoolId: number;
  date: string;
  tenantId: number;
  createdAt: string;
  updatedAt?: string;
  createdBy: number;
  updatedBy?: string;
}

export interface StudentAttendanceListQueryParams {
  schoolId: number;
  classId: number;
  levelId: number;
  academicYearId: number;
  date: string;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE_ARRIVAL = 'LATE_ARRIVAL',
  EXCUSED = 'EXCUSED',
  ON_LEAVE = 'ON_LEAVE',
}

export enum AttendanceType {
  MANUAL = 'MANUAL',
  BIOMETRIC = 'BIOMETRIC',
}

export enum ClassAttendanceStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export enum ConfirmationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
}

export interface MarkAttendancePayload {
  schoolId: number;
  levelId: number;
  classId: number;
  academicYearId: number;
  date: string;
  attendanceData: Array<{
    studentId: number;
    status: AttendanceStatus;
  }>;
}

export interface StudentAttendanceDetailsWidthSummaryDTO {
  student: {
    userId: number;
    studentId: number;
    arFullName: string;
    enFullName: string;
    nationalId: string;
    countryCode: string;
    phoneNumber: string;
    gender: Gender;
    classArName: string;
    classEnName: string;
    classId: number;
    levelId: number;
    levelArName: string;
    levelEnName: string;
    imageUrl?: string;
    isAvatar?: boolean;
  };
  attendanceStats: {
    TOTAL: number;
    PRESENT: number;
    ABSENT: number;
    LATE_ARRIVAL: number;
    EXCUSED: number;
    ON_LEAVE: number;
  };
  attendances: Array<StudentAttendanceListItemDTO>;
}

export interface StudentAttendanceListItemDTO {
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

export interface StudentAttendanceDetailsQueryParams {
  schoolId: number;
  classId: number;
  levelId: number;
  academicYearId: number;
  fromDate: string;
  toDate: string;
}

export interface ExistingStudentsAttendance {
  studentId: number;
  classId: number;
  studentName: string;
}
