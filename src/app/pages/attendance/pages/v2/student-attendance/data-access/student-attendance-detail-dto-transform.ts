import { getLocalizedName } from '@shared/utils/localization.util';
import {
  AbsenceType,
  AttendanceEventType,
  DsAttendanceEvent,
} from '@ds/calendar/attendance-calendar.component';
import {
  AttendanceDetailDto,
  AttendanceDetailRawDto,
  AttendanceEventRawDto,
} from './student-attendance-detail.model';

export const STUDENT_ATTENDANCE_DETAIL_MAP_FROM_DTO = new (class {
  detail(dto: AttendanceDetailRawDto): AttendanceDetailDto {
    return {
      ...dto,
      dates: (dto.dates ?? []).map((date) => this.event(date)),
    };
  }

  private event(dto: AttendanceEventRawDto): DsAttendanceEvent {
    const holiday = dto.holiday;
    const attendanceStatus = this.mapAttendanceStatus(dto.attendanceStatus);
    const absenceType = this.mapAbsenceType(dto.absenceType);
    if (!holiday) {
      return {
        ...dto,
        attendanceStatus,
        absenceType,
        holiday: undefined,
      };
    }

    return {
      ...dto,
      attendanceStatus,
      absenceType,
      holiday: {
        displayName: this.localizedHolidayName({
          arName: holiday.arName ?? holiday.globalHoliday?.arName ?? null,
          enName: holiday.enName ?? holiday.globalHoliday?.enName ?? null,
        }),
      },
    };
  }

  private localizedHolidayName(names: {
    arName: string | null;
    enName: string | null;
  }): string | null {
    const localized = getLocalizedName(names).trim();
    return localized || null;
  }

  private mapAttendanceStatus(
    value: string | null | undefined,
  ): AttendanceEventType | undefined {
    if (!value) return undefined;
    const enumValue = value as AttendanceEventType;
    return Object.values(AttendanceEventType).includes(enumValue)
      ? enumValue
      : undefined;
  }

  private mapAbsenceType(
    value: string | null | undefined,
  ): AbsenceType | undefined {
    if (!value) return undefined;
    const enumValue = value as AbsenceType;
    return Object.values(AbsenceType).includes(enumValue)
      ? enumValue
      : undefined;
  }
})();
