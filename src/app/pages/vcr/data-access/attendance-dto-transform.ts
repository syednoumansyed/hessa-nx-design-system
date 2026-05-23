import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { ensureArray } from '@shared/utils/array.util';
import {
  StudentVCRAttendanceDTO,
  StudentClassDTO,
  StudentLectureAttendanceDTO,
  VCRAttendanceDTO,
} from './attendance.dto';
import {
  StudentVCRAttendance,
  StudentClass,
  StudentLectureAttendance,
  VCRAttendance,
} from './attendance.interface';
export const VCR_ATTENDANCE_MAP_FROM_DTO = new (class {
  studentClass(dto: StudentClassDTO): StudentClass {
    return {
      id: dto.id,
      displayName: getLocalizedName(dto),
    };
  }

  studentLectureAttendance(
    dto: StudentLectureAttendanceDTO,
  ): StudentLectureAttendance {
    return {
      attendanceStatus: dto.attendanceStatus,
      clickTime: dto.clickTime,
      isLinkClicked: dto.isLinkClicked,
    };
  }

  studentVCRAttendance(dto: StudentVCRAttendanceDTO): StudentVCRAttendance {
    return {
      id: dto.id,
      displayName: getLocalizedFullName(dto),
      class: this.studentClass(dto.class),
      virtualClassroom: dto.virtualClassroom,
      attendance: dto.attendance
        ? this.studentLectureAttendance(dto.attendance)
        : null,
      subject: dto.subject
        ? {
            id: dto.subject.id,
            displayName: getLocalizedName(dto.subject),
          }
        : null,
      lecture: dto.lecture ?? null,
      virtualClassroomLecture: dto.virtualClassroomLecture
        ? dto.virtualClassroomLecture
        : null,
    };
  }

  studentVCRAttendances(
    dtos: StudentVCRAttendanceDTO[],
  ): StudentVCRAttendance[] {
    return ensureArray(dtos).map((dto) => this.studentVCRAttendance(dto));
  }

  vcrsAttendance(dto: VCRAttendanceDTO[]): VCRAttendance[] {
    return ensureArray(dto).map((att) => {
      return {
        id: att.id,
        date: att.date,
        lecture: att.lecture,
        lectureId: att.lectureId,
        status: att.status,
        displayMarkBy: ensureArray(att.markedBy)
          .map((it) => getLocalizedFullName(it))
          .join(', '),
        virtualClassroomId: att.virtualClassroomId,
      };
    });
  }
})();
