import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import {
  AbsenceAttendanceListItemDTO,
  AbsentAttendanceDetailDTO,
  AttendanceListItemDTO,
  StudentAttendanceDetailDTO,
  StudentAttendanceDetailsWidthSummaryDTO,
  StudentAttendanceDTO,
} from './attendance.dto';
import {
  AbsenceAttendanceListItem,
  AbsentAttendanceDetail,
  AttendanceListItem,
  StudentAttendance,
  StudentAttendanceDetail,
  StudentAttendanceDetailsWidthSummary,
} from './attendance.interface';
import { ensureArray } from '@shared/utils/array.util';

export const ATTENDANCE_MAP_FROM_DTO = new (class {
  classAttendanceList(dto: AttendanceListItemDTO[]): AttendanceListItem[] {
    return dto.map((item) => ({
      classId: item.classId,
      displayClassName: getLocalizedName({
        arName: item.arClassName,
        enName: item.enClassName,
      }),
      classRoomNumber: item.classRoomNumber,
      displayLevelName: getLocalizedName({
        arName: item.arLevelName,
        enName: item.enLevelName,
      }),
      levelId: item.levelId,
      status: item.status,
      date: item.date,
      displayMarkedBy: getLocalizedName({
        arName: item.markedByAr,
        enName: item.markedByEn,
      }),
    }));
  }

  studentAttendanceList(dto: StudentAttendanceDTO[]): StudentAttendance[] {
    return ensureArray(dto).map((item) => ({
      studentId: item.studentId,
      displayName: getLocalizedFullName(item),
      nationalId: item.nationalId,
      imageUrl: item.isAvatar ? item.imageUrl : undefined,
      attendance: item.attendance
        ? this.studentAttendanceDetail(item.attendance)
        : null,
    }));
  }

  studentAttendanceDetail(
    dto: StudentAttendanceDetailDTO,
  ): StudentAttendanceDetail {
    return {
      id: dto.id,
      levelId: dto.levelId,
      classId: dto.classId,
      studentId: dto.studentId,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      reason: dto.reason,
      attendanceStatus: dto.attendanceStatus,
      type: dto.type,
      confirmationStatus: dto.confirmationStatus,
      academicYearId: dto.academicYearId,
      schoolId: dto.schoolId,
      date: dto.date,
    };
  }

  absenceAttendanceList(
    dto: AbsenceAttendanceListItemDTO[],
  ): AbsenceAttendanceListItem[] {
    return ensureArray(dto).map((item) => ({
      displayName: getLocalizedFullName(item),
      class: {
        id: item.class.id,
        displayName: getLocalizedName(item.class),
      },
      attendance: this.absentAttendanceDetail(item.attendance),
      guardians: ensureArray(item.guardians).map((guardian) => ({
        displayName: getLocalizedFullName(guardian),
        displayPhoneNumber: `${guardian.countryCode || ''} ${guardian.phoneNumber || ''}`,
      })),
      nationalId: item.nationalId,
      studentId: item.studentId,
      // Status history from history table
      statusHistory: item.statusHistory,
    }));
  }

  absentAttendanceDetail(
    dto: AbsentAttendanceDetailDTO,
  ): AbsentAttendanceDetail {
    return {
      id: dto.id,
      levelId: dto.levelId,
      classId: dto.classId,
      studentId: dto.studentId,
      reason: dto.reason,
      attendanceStatus: dto.attendanceStatus,
      type: dto.type,
      confirmationStatus: dto.confirmationStatus,
      academicYearId: dto.academicYearId,
      schoolId: dto.schoolId,
      date: dto.date,
    };
  }

  studentAttendanceDetailsWidthSummary(
    dto: StudentAttendanceDetailsWidthSummaryDTO,
  ): StudentAttendanceDetailsWidthSummary {
    const { student, attendanceStats } = dto;
    return {
      student: {
        userId: student.userId,
        studentId: student.studentId,
        displayName: getLocalizedFullName(student),
        nationalId: student.nationalId,
        displayPhoneNumber: `${student.countryCode || ''} ${student.phoneNumber || ''}`,
        gender: student.gender,
        classDisplayName: getLocalizedName({
          arName: student.classArName,
          enName: student.classEnName,
        }),
        classId: student.classId,
        levelId: student.levelId,
        levelDisplayName: getLocalizedName({
          arName: student.levelArName,
          enName: student.levelEnName,
        }),
        imageUrl: student.imageUrl || undefined,
      },
      attendanceStats,
      attendances: ensureArray(dto.attendances),
    };
  }
})();
