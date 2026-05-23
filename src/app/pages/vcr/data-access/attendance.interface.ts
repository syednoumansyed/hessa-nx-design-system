import { AttendanceStatus, StudentAttendanceStatus } from '@shared/enums';
import { VCRLectureDTO } from './manage-recording.dto';

export interface StudentVCRAttendance {
  id: number;
  displayName: string;
  class: StudentClass;
  virtualClassroom: any | null;
  attendance: StudentLectureAttendance | null;
  subject: {
    id: number;
    displayName: string;
  } | null;
  lecture: {
    id: number;
    startTime: string;
    endTime: string;
  } | null;
  virtualClassroomLecture: {
    id: number;
    lectureId: number;
    date: string;
  } | null;
}

export interface StudentClass {
  id: number;
  displayName: string;
}

export interface StudentLectureAttendance {
  attendanceStatus: StudentAttendanceStatus;
  clickTime: string | null;
  isLinkClicked: boolean;
}

export interface VCRAttendance {
  date: string;
  id: number;
  // TODO: we need to refactor it if need to not use VCRLectureDTO
  lecture: VCRLectureDTO['lecture'];
  lectureId: number;
  displayMarkBy: string;
  status: AttendanceStatus;
  virtualClassroomId: number;
}
