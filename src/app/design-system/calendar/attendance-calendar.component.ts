import {
  Component,
  input,
  TemplateRef,
  output,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarMonthComponent } from './calendar-month.component';
import {
  DsCalendarEventConfig,
  DsCalendarGridRange,
  DsCalendarSummaryConfig,
  DsCalendarPlaceholderConfig,
  DsCalendarConfig,
  DsCalendarReadyEvent,
} from './calender.interface';
import { faCheckSquare, faCircleMinus } from '@fortawesome/pro-solid-svg-icons';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';
import { formatDate } from '@shared/utils/date';
import { formatToDsDate } from '@ds/utils/ds-date';

export enum AttendanceEventType {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE_ARRIVAL = 'LATE_ARRIVAL',
  EXCUSED = 'EXCUSED',
  ON_LEAVE = 'ON_LEAVE',
}

export enum AbsenceType {
  UNPLANNED = 'UNPLANNED',
  PLANNED = 'PLANNED',
  // Add more as needed
}

type DsAttendanceSummary = Record<AttendanceEventType, number>;

export interface DsAttendanceEvent {
  id: number;
  date: string | Date;
  attendanceStatus?: AttendanceEventType;
  confirmationStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  reason: string | null;
  type: string; // e.g. 'MANUAL', 'AUTO', etc.
  day: number;
  isHoliday: boolean;
  isWeekend: boolean;
  absenceType?: AbsenceType;
  holiday?: {
    displayName?: string | null;
  };
}

export interface CalendarStatsSummary {
  HOLIDAYS: number;
  WEEKEND_DAYS: number;
  WEEKDAYS: number;
}

export interface DsCalendarStats {
  fromDate: string;
  toDate: string;
  summary: CalendarStatsSummary;
}

export interface AttendanceStatsSummary {
  TOTAL: number;
  TOTAL_PRESENTS: number;
  TOTAL_ABSENTS: number;
  PRESENT: number;
  ABSENT: number;
  LATE_ARRIVAL: number;
  EXCUSED: number;
  ON_LEAVE: number;
  PLANNED: number;
  UNPLANNED: number;
}

export interface DsAttendanceStats {
  fromDate: string;
  toDate: string;
  summary: AttendanceStatsSummary;
}

export interface DsAttendanceConfig {
  dates: DsAttendanceEvent[];
  status?: string;
  calenderStats?: DsCalendarStats;
  attendanceStats?: DsAttendanceStats; // Optionally include the full backend object
  student?: {
    fullName: string;
  };
}
@Component({
  selector: 'ds-attendance-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CalendarMonthComponent],
  templateUrl: './attendance-calendar.component.html',
})
export class AttendanceCalendarComponent {
  // #region Inputs
  /** The month to display (0-indexed) */
  readonly month = input.required<number>();
  /** The year to display */
  readonly year = input.required<number>();
  /** The attendance config (records and summary) */
  readonly config = input.required<DsAttendanceConfig>();
  /** Optional placeholder config to pass to calendar month */
  readonly placeholderConfig = input<DsCalendarPlaceholderConfig | undefined>(
    undefined,
  );
  readonly local = input<string>('en'); // Optional locale for translations
  /** Minimum allowed month/year for navigation */
  readonly minMonth = input<{ month: number; year: number } | undefined>(
    undefined,
  );
  /** Maximum allowed month/year for navigation */
  readonly maxMonth = input<{ month: number; year: number } | undefined>(
    undefined,
  );

  // #endregion

  // #region injector
  private readonly translationService = inject(DS_TRANSLATION_TOKEN);
  // #endregion
  // #region Combined config for calendar-month
  readonly calendarConfig = computed<DsCalendarConfig>(() => ({
    events: this.events(),
    summaryConfig: [this.presentConfig(), this.absentConfig()], // You can map your summary here if needed
    placeholderConfig: undefined,
    // placeholderConfig: undefined,
    showSummary: true, // Set to true if you want to show summary
    status: this.todayStatus(), // Optional status message
    alert: this.getAlert(),
    minMonth: this.minMonth(), // Pass through min month restriction
    maxMonth: this.maxMonth(), // Pass through max month restriction
  }));

  getAlert(): DsCalendarConfig['alert'] | undefined {
    const status = this.config()?.calenderStats;
    if (!status) return undefined;
    const {
      summary: { HOLIDAYS },
    } = status;

    if (HOLIDAYS === 0) return undefined;
    return {
      title: this.translationService.translate(
        'attendance.vacation.total_days_month.title',
        {
          days: HOLIDAYS,
        },
      ),
      message: this.translationService.translate('attendance.vacation_wish'),
    };
  }
  // #endregion

  // #region Outputs
  /** Emits when a day is clicked */
  readonly dayClick = output<Date>();
  /** Emits when the month or visible grid range changes */
  readonly monthChange = output<DsCalendarGridRange>();
  readonly calendarReady = output<DsCalendarReadyEvent>();
  // #endregion

  // #region Template-accessible properties
  /** Optional custom cell template */
  readonly cellTemplate?: TemplateRef<any>;

  /**
   * Maps attendance event types to icon names
   */
  private readonly iconMap: Record<AttendanceEventType, string | undefined> = {
    [AttendanceEventType.PRESENT]: undefined, // No icon
    [AttendanceEventType.ABSENT]: 'attendance-unplanned',
    [AttendanceEventType.LATE_ARRIVAL]: 'attendance-late',
    [AttendanceEventType.EXCUSED]: 'attendance-excused',
    [AttendanceEventType.ON_LEAVE]: 'attendance-planned',
  };

  /**
   * Calendar events for the current month, mapped to cell config
   */
  protected readonly events = computed((): DsCalendarEventConfig[] => {
    const currentMonth = this.month();
    const currentYear = this.year();
    return (
      this.config()
        ?.dates.filter((c) => c.attendanceStatus || c.isHoliday)
        .map((c) => {
          // Ensure date is a Date object
          const dateObj =
            typeof c.date === 'string' ? new Date(c.date) : c.date;
          const today = new Date();
          const isToday =
            dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear();
          let cellType: DsCalendarEventConfig['cellType'];
          if (c.isHoliday) {
            cellType = 'exciting';
          } else if (
            [
              AttendanceEventType.PRESENT,
              AttendanceEventType.EXCUSED,
              AttendanceEventType.LATE_ARRIVAL,
            ].includes(c.attendanceStatus as AttendanceEventType)
          ) {
            cellType = isToday ? 'success' : 'success-outline';
          } else {
            cellType = isToday ? 'danger' : 'danger-outline';
          }
          // Only show tooltip for dates in the selected month and year
          let tooltip: DsCalendarEventConfig['tooltip'] | undefined = undefined;
          if (
            dateObj.getMonth() === currentMonth &&
            dateObj.getFullYear() === currentYear
          ) {
            if (c.isHoliday) {
              tooltip = this.getHolidayTooltip(c);
            } else {
              tooltip = this.getTooltip({
                absentType: c.absenceType,
                attendanceStatus: c.attendanceStatus!,
                footer: formatToDsDate(
                  c.date,
                  this.translationService.getActiveLang(),
                ),
              });
            }
          }
          return {
            date: dateObj,
            cellType,
            label: dateObj.getDate().toString(),
            icon:
              cellType === 'exciting'
                ? undefined
                : this.iconMap[c.attendanceStatus as AttendanceEventType],
            tooltip,
          };
        }) ?? []
    );
  });

  /**
   * Attendance summary for display (present/absent grouping)
   */
  protected readonly displaySummary = computed(
    (): DsCalendarSummaryConfig[] => {
      return [this.presentConfig(), this.absentConfig()];
    },
  );

  /**
   * Present grouping config for summary
   */
  protected readonly presentConfig = computed<DsCalendarSummaryConfig>(() => {
    const summary = this.config()?.attendanceStats?.summary as
      | AttendanceStatsSummary
      | undefined;
    const get = (k: keyof AttendanceStatsSummary) => (summary ? summary[k] : 0);
    const totalPresents = get('TOTAL_PRESENTS');

    return {
      label: this.translationService.translate('attendance.present.title'),
      icon: faCheckSquare,
      count: totalPresents,
      cssClass: 'text-emerald-600',
      children: [
        {
          label: this.translationService.translate('attendance.excused.title'),
          icon: this.iconMap[AttendanceEventType.EXCUSED],
          count: get('EXCUSED'),
        },
        {
          label: this.translationService.translate('attendance.late.title'),
          icon: this.iconMap[AttendanceEventType.LATE_ARRIVAL],
          count: get('LATE_ARRIVAL'),
        },
      ],
    };
  });

  /**
   * Absent grouping config for summary
   */
  protected readonly absentConfig = computed<DsCalendarSummaryConfig>(() => {
    const summary = this.config()?.attendanceStats?.summary as
      | AttendanceStatsSummary
      | undefined;
    const get = (k: keyof AttendanceStatsSummary) => (summary ? summary[k] : 0);
    const totalAbsents = get('TOTAL_ABSENTS');

    return {
      label: this.translationService.translate('attendance.absent.title'),
      icon: faCircleMinus,
      count: totalAbsents,
      cssClass: 'text-error-ds-600',
      children: [
        {
          label: this.translationService.translate('attendance.planned.title'),
          icon: this.iconMap[AttendanceEventType.ON_LEAVE],
          count: get('ON_LEAVE'),
        },
        {
          label: this.translationService.translate(
            'attendance.not_planned_absence.title',
          ),
          icon: this.iconMap[AttendanceEventType.ABSENT],
          count: get('UNPLANNED'),
        },
      ],
    };
  });
  // #endregion

  // #region Methods
  /** Emits when a day is clicked */
  protected onDayClick(date: Date) {
    this.dayClick.emit(date);
  }
  /** Emits when the month or visible grid range changes */
  protected onMonthChange(e: DsCalendarGridRange) {
    this.monthChange.emit(e);
  }

  protected onCalendarReady(e: DsCalendarReadyEvent) {
    this.calendarReady.emit(e);
  }

  // #endregion

  private getTooltip(args: {
    absentType?: AbsenceType;
    attendanceStatus: AttendanceEventType;
    footer: string | null;
  }): DsCalendarEventConfig['tooltip'] | undefined {
    const { attendanceStatus, absentType, footer } = args;
    const studentName = this.config()?.student?.fullName;

    // Map status to tooltip config
    const tooltipMap: Record<
      AttendanceEventType,
      { titleKey: string; contentKey?: string }
    > = {
      [AttendanceEventType.PRESENT]: {
        titleKey: 'attendance.tooltip.present.title',
        contentKey: 'attendance.tooltip.present.description',
      },
      [AttendanceEventType.EXCUSED]: {
        titleKey: 'attendance.tooltip.Present_with_Excuse.title',
        contentKey: 'attendance.tooltip.present_with_excuse.description',
      },
      [AttendanceEventType.LATE_ARRIVAL]: {
        titleKey: 'attendance.tooltip.present_but_late.title',
        contentKey: 'attendance.tooltip.present_but_late.description',
      },
      [AttendanceEventType.ON_LEAVE]: {
        titleKey: 'attendance.tooltip.planned_absence.title',
        contentKey: 'attendance.tooltip.planned_absence_description',
      },
      [AttendanceEventType.ABSENT]: {
        titleKey:
          absentType === AbsenceType.UNPLANNED
            ? 'attendance.tooltip.Not_planned_absence.title'
            : 'attendance.tooltip.planned_absence.title',
        contentKey:
          absentType === AbsenceType.UNPLANNED
            ? 'attendance.tooltip.not_planned_absence.description'
            : 'attendance.tooltip.planned_absence_description',
      },
    };

    const config = tooltipMap[attendanceStatus];
    if (!config) return undefined;

    return {
      title: this.translationService.translate(config.titleKey),
      content: config.contentKey
        ? this.translationService.translate(config.contentKey, {
            studentName,
          })
        : '',
      footer,
    };
  }

  private getHolidayTooltip(
    event: DsAttendanceEvent,
  ): DsCalendarEventConfig['tooltip'] {
    const lang = this.translationService.getActiveLang();
    const holidayName =
      event.holiday?.displayName ||
      this.translationService.translate('attendance.tooltip.holiday.title');

    return {
      title: holidayName,
      content: '',
      footer: formatToDsDate(event.date, lang),
    };
  }

  private readonly todayStatus = computed((): string | undefined => {
    const dates = this.config()?.dates ?? [];
    const today = new Date();
    // Only show today status if the selected month/year matches today
    if (
      this.month() !== today.getMonth() ||
      this.year() !== today.getFullYear()
    ) {
      return undefined;
    }
    if (!dates.length) return undefined;

    // Helper to compare dates
    const isSameDay = (d: Date) =>
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const todayEvent = dates.find((d) => {
      const dateObj = typeof d.date === 'string' ? new Date(d.date) : d.date;
      return isSameDay(dateObj);
    });

    const formatedDate = formatToDsDate(today);
    if (!todayEvent) {
      return this.translationService.translate(
        'attendance.todaystatus.attendance_not_submitted',
        { date: formatedDate },
      );
    }

    const { attendanceStatus, absenceType, reason } = todayEvent;

    // Map status to translation key and params
    const statusMap: Record<string, { key: string; params?: any }> = {
      [AttendanceEventType.PRESENT]: {
        key: 'attendance.todaystatus.attended_on_time',
      },
      [AttendanceEventType.LATE_ARRIVAL]: {
        key: reason
          ? 'attendance.todaystatus.attended_late_with_excuse'
          : 'attendance.todaystatus.attended_late_without_excuse',
      },
      [AttendanceEventType.EXCUSED]: {
        key: 'attendance.todaystatus.left_early_with_Excuse',
      },
      [AttendanceEventType.ON_LEAVE]: {
        key: 'attendance.todaystatus.planned_absence',
      },
      [AttendanceEventType.ABSENT]: {
        key:
          absenceType === AbsenceType.UNPLANNED
            ? 'attendance.todaystatus.non_planned_absence'
            : 'attendance.todaystatus.planned_absence',
      },
    };

    const status = statusMap[attendanceStatus as AttendanceEventType];
    if (status) {
      return this.translationService.translate(
        status.key,
        status.params ?? { date: formatedDate },
      );
    }

    // Default fallback
    return this.translationService.translate(
      'attendance.todaystatus.attendance_not_submitted',
      { date: formatedDate },
    );
  });
}
