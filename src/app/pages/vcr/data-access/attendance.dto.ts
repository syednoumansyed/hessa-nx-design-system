import { VCRLectureDTO } from '@pages/vcr/data-access/manage-recording.dto';
import { StudentAttendanceStatus } from '@shared/enums';

export interface VCRAttendanceDTO {
  createdAt: string;
  createdBy: number;
  date: string;
  id: number;
  lecture: VCRLectureDTO['lecture'];
  lectureId: number;
  markedBy:
    | {
        id: number;
        arFullName: string;
        enFullName: string;
      }[]
    | null;
  status: AttendanceStatus;
  tenantId: number;
  updatedAt: string | null;
  updatedBy: number | null;
  virtualClassroomId: number;
}

export enum AttendanceStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
}

export interface StudentVCRAttendanceTableItem {
  id: number;
  name: string;
  className: string;
  subject: string;
  clickDate?: string;
  clickTime?: string;
  clickStatus: boolean;
  attendance: StudentAttendanceStatus | null;
  startDate: string;
  startTime: string;
}

export interface StudentVCRAttendanceDTO {
  id: number;
  arFullName: string;
  enFullName: string;
  class: StudentClassDTO;
  virtualClassroom: any | null;
  attendance: StudentLectureAttendanceDTO | null;
  subject?: {
    id: number;
    arName: string;
    enName: string;
  };
  lecture?: {
    id: number;
    startTime: string;
    endTime: string;
  };
  virtualClassroomLecture?: {
    id: number;
    lectureId: number;
    date: string;
  };
}

export interface StudentLectureAttendanceDTO {
  attendanceStatus: StudentAttendanceStatus;
  clickTime: string | null;
  isLinkClicked: boolean;
}

export interface StudentClassDTO {
  id: number;
  arName: string;
  enName: string;
}

export interface AttendancePayload {
  attendanceData: StudentAttendancePayloadDto[];
}

export interface StudentAttendancePayloadDto {
  studentId: number;
  status: StudentAttendanceStatus;
}

export interface ManageAttendanceTableItem {
  id: number;
  status: AttendanceStatus;
  lecture: VCRLectureDTO['lecture'] & { date: string };
  markedBy: string | null;
}
