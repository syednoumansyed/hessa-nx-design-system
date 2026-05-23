import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import {
  DsAttendanceStats,
  AbsenceType,
  AttendanceEventType,
  DsAttendanceEvent,
  DsAttendanceConfig,
} from 'src/app/design-system/calendar/attendance-calendar.component';
import {
  DsCalendarGridRange,
  DsCalendarPlaceholderConfig,
} from 'src/app/design-system/calendar/calender.interface';
import { AttendanceCalendarComponent } from 'src/app/design-system/calendar/attendance-calendar.component';

@Component({
  selector: 'app-calendar-demo',
  template: `
    <div class="flex justify-center bg-[#FAF8F4] py-4">
      <ds-attendance-calendar
        [month]="effectiveMonth()"
        [year]="effectiveYear()"
        [config]="visibleEvents()"
        [placeholderConfig]="placeholderConfig()"
        (dayClick)="onCalendarDayClick($event)"
        (monthChange)="onCalendarMonthChange($event)"
        [local]="local"
      ></ds-attendance-calendar>
    </div>
  `,
  standalone: true,
  imports: [AttendanceCalendarComponent],
})
export class CalendarDemoComponent {
  calendarMonth = signal<number | null>(null); // null means use current month (March for testing)
  calendarYear = signal<number | null>(null); // null means use current year
  calendarGridStart = signal<Date | null>(null);
  calendarGridEnd = signal<Date | null>(null);
  private readonly transloco = inject(TranslocoService);
  local = this.transloco.getActiveLang();
  calendarEvents = signal<DsAttendanceEvent[]>([
    // --- Current Month (July 2025) ---
    {
      id: 101,
      date: '2025-07-01',
      attendanceStatus: AttendanceEventType.PRESENT,
      confirmationStatus: 'CONFIRMED',
      reason: null,
      type: 'AUTO',
      day: 2,
      isHoliday: false,
      isWeekend: false,
      absenceType: undefined,
    },
    {
      id: 102,
      date: '2025-07-02',
      attendanceStatus: AttendanceEventType.LATE_ARRIVAL,
      confirmationStatus: 'PENDING',
      reason: null,
      type: 'AUTO',
      day: 3,
      isHoliday: false,
      isWeekend: false,
      absenceType: undefined,
    },
    {
      id: 103,
      date: '2025-07-03',
      attendanceStatus: AttendanceEventType.EXCUSED,
      confirmationStatus: 'CONFIRMED',
      reason: 'Doctor',
      type: 'MANUAL',
      day: 4,
      isHoliday: false,
      isWeekend: false,
      absenceType: undefined,
    },
    {
      id: 1065,
      date: '2025-07-06',
      attendanceStatus: AttendanceEventType.ABSENT,
      confirmationStatus: 'CONFIRMED',
      reason: null,
      type: 'AUTO',
      day: 7,
      isHoliday: false,
      isWeekend: false,
      absenceType: AbsenceType.PLANNED,
    },
    {
      id: 1065,
      date: '2025-07-07',
      attendanceStatus: AttendanceEventType.ABSENT,
      confirmationStatus: 'CONFIRMED',
      reason: null,
      type: 'AUTO',
      day: 7,
      isHoliday: false,
      isWeekend: false,
      absenceType: AbsenceType.UNPLANNED,
    },

    {
      id: 1032,
      date: '2025-07-08',
      attendanceStatus: undefined,
      confirmationStatus: 'CONFIRMED',
      reason: 'Doctor',
      type: 'MANUAL',
      day: 4,
      isHoliday: true,
      isWeekend: false,
      absenceType: undefined,
    },
    {
      id: 1063,
      date: '2025-07-09',
      attendanceStatus: undefined,
      confirmationStatus: 'CONFIRMED',
      reason: null,
      type: 'AUTO',
      day: 7,
      isHoliday: true,
      isWeekend: false,
      absenceType: undefined,
    },
    // --- May 2025, end of week, all possible events ---
    {
      id: 201,
      date: '2025-05-29',
      attendanceStatus: AttendanceEventType.PRESENT,
      confirmationStatus: 'CONFIRMED',
      reason: null,
      type: 'AUTO',
      day: 4,
      isHoliday: false,
      isWeekend: false,
      absenceType: undefined,
    },
    {
      id: 202,
      date: '2025-05-30',
      attendanceStatus: AttendanceEventType.LATE_ARRIVAL,
      confirmationStatus: 'PENDING',
      reason: null,
      type: 'AUTO',
      day: 5,
      isHoliday: false,
      isWeekend: true,
      absenceType: undefined,
    },
    {
      id: 203,
      date: '2025-05-31',
      attendanceStatus: AttendanceEventType.EXCUSED,
      confirmationStatus: 'CONFIRMED',
      reason: 'Doctor',
      type: 'MANUAL',
      day: 6,
      isHoliday: false,
      isWeekend: false,
      absenceType: undefined,
    },
    {
      id: 204,
      date: '2025-05-31',
      attendanceStatus: AttendanceEventType.ON_LEAVE,
      confirmationStatus: 'CONFIRMED',
      reason: 'Family event',
      type: 'MANUAL',
      day: 6,
      isHoliday: false,
      isWeekend: false,
      absenceType: AbsenceType.PLANNED,
    },
    {
      id: 205,
      date: '2025-05-31',
      attendanceStatus: AttendanceEventType.ABSENT,
      confirmationStatus: 'REJECTED',
      reason: 'Sick',
      type: 'MANUAL',
      day: 6,
      isHoliday: false,
      isWeekend: false,
      absenceType: AbsenceType.UNPLANNED,
    },
    // --- February 2025, 23rd to 28th, all possible events ---
    {
      id: 301,
      date: '2025-02-23',
      attendanceStatus: AttendanceEventType.PRESENT,
      confirmationStatus: 'CONFIRMED',
      reason: null,
      type: 'AUTO',
      day: 0,
      isHoliday: false,
      isWeekend: true,
      absenceType: undefined,
    },
    {
      id: 302,
      date: '2025-02-24',
      attendanceStatus: AttendanceEventType.ABSENT,
      confirmationStatus: 'REJECTED',
      reason: 'Sick',
      type: 'MANUAL',
      day: 1,
      isHoliday: false,
      isWeekend: false,
      absenceType: AbsenceType.UNPLANNED,
    },
    {
      id: 303,
      date: '2025-02-25',
      attendanceStatus: AttendanceEventType.LATE_ARRIVAL,
      confirmationStatus: 'PENDING',
      reason: null,
      type: 'AUTO',
      day: 2,
      isHoliday: false,
      isWeekend: false,
      absenceType: undefined,
    },
    {
      id: 304,
      date: '2025-02-26',
      attendanceStatus: AttendanceEventType.EXCUSED,
      confirmationStatus: 'CONFIRMED',
      reason: 'Doctor',
      type: 'MANUAL',
      day: 3,
      isHoliday: false,
      isWeekend: false,
      absenceType: undefined,
    },
    {
      id: 305,
      date: '2025-02-27',
      attendanceStatus: AttendanceEventType.ON_LEAVE,
      confirmationStatus: 'CONFIRMED',
      reason: 'Family event',
      type: 'MANUAL',
      day: 4,
      isHoliday: false,
      isWeekend: false,
      absenceType: AbsenceType.PLANNED,
    },
    {
      id: 306,
      date: '2025-02-28',
      attendanceStatus: AttendanceEventType.PRESENT,
      confirmationStatus: 'CONFIRMED',
      reason: null,
      type: 'AUTO',
      day: 5,
      isHoliday: false,
      isWeekend: false,
      absenceType: undefined,
    },
    // --- June 2025, 29th (Sunday) and 30th (Monday) ---
    {
      id: 350,
      date: '2025-06-29',
      attendanceStatus: AttendanceEventType.PRESENT,
      confirmationStatus: 'CONFIRMED',
      reason: null,
      type: 'AUTO',
      day: 0, // Sunday
      isHoliday: false,
      isWeekend: true,
      absenceType: undefined,
    },
    {
      id: 351,
      date: '2025-06-30',
      attendanceStatus: AttendanceEventType.ABSENT,
      confirmationStatus: 'REJECTED',
      reason: 'Unplanned absence',
      type: 'MANUAL',
      day: 1, // Monday
      isHoliday: false,
      isWeekend: false,
      absenceType: AbsenceType.UNPLANNED,
    },
    // --- March 2025, 10 present, 4 absent ---
    // Present: 1-10, Absent: 11-14
    ...Array.from({ length: 10 }, (_, i) => {
      const dayOfWeek = (i + 1) % 7;
      // Remove Friday (5) and Saturday (6)
      if (dayOfWeek === 5 || dayOfWeek === 6)
        return undefined as unknown as DsAttendanceEvent;
      return {
        id: 400 + i + 1,
        date: `2025-03-${String(i + 1).padStart(2, '0')}`,
        attendanceStatus: AttendanceEventType.PRESENT,
        confirmationStatus: 'CONFIRMED' as const,
        reason: null,
        type: 'AUTO',
        day: dayOfWeek,
        isHoliday: false,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        absenceType: undefined,
      };
    }).filter((e): e is DsAttendanceEvent => !!e),
    ...Array.from({ length: 4 }, (_, i) => {
      const dayOfWeek = (i + 11) % 7;
      // Remove Friday (5) and Saturday (6)
      if (dayOfWeek === 5 || dayOfWeek === 6)
        return undefined as unknown as DsAttendanceEvent;
      return {
        id: 410 + i + 1,
        date: `2025-03-${String(i + 11).padStart(2, '0')}`,
        attendanceStatus: AttendanceEventType.ABSENT,
        confirmationStatus: 'REJECTED' as const,
        reason: 'Unplanned absence',
        type: 'MANUAL',
        day: dayOfWeek,
        isHoliday: false,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        absenceType: AbsenceType.UNPLANNED,
      };
    }).filter((e): e is DsAttendanceEvent => !!e),
  ]);
  attendanceSnapshot = null;

  // Semester start date (example: June 10, 2025)
  readonly semesterStartDate = new Date(2025, 5, 10); // Months are 0-indexed

  // Compute the current month/year, defaulting to today if not set
  readonly effectiveMonth = computed(() =>
    this.calendarMonth() !== null
      ? this.calendarMonth()!
      : new Date().getMonth(),
  );
  readonly effectiveYear = computed(() =>
    this.calendarYear() !== null
      ? this.calendarYear()!
      : new Date().getFullYear(),
  );

  visibleEvents = computed<DsAttendanceConfig>(() => {
    // Use grid range if available, otherwise default to month start/end
    const start =
      this.calendarGridStart() ??
      new Date(this.effectiveYear(), this.effectiveMonth(), 1);
    const end =
      this.calendarGridEnd() ??
      new Date(this.effectiveYear(), this.effectiveMonth() + 1, 0);
    // Convert all event dates to Date objects for filtering and summary
    const filteredEvents = this.calendarEvents().filter((e) => {
      const dateObj = typeof e.date === 'string' ? new Date(e.date) : e.date;
      return dateObj >= start && dateObj <= end;
    });

    // Only count events that are in the current visible month for summary
    const month = this.effectiveMonth();
    const year = this.effectiveYear();
    const summaryEvents = filteredEvents.filter((e) => {
      const dateObj = typeof e.date === 'string' ? new Date(e.date) : e.date;
      return dateObj.getMonth() === month && dateObj.getFullYear() === year;
    });

    // Calculate summary for current month events only
    const summary = {
      [AttendanceEventType.PRESENT]: 0,
      [AttendanceEventType.ABSENT]: 0,
      [AttendanceEventType.LATE_ARRIVAL]: 0,
      [AttendanceEventType.EXCUSED]: 0,
      [AttendanceEventType.ON_LEAVE]: 0,
    };

    summaryEvents.forEach((event) => {
      if (event.attendanceStatus === undefined) {
        // Skip events without attendance status
        return;
      }
      summary[event.attendanceStatus || event.absenceType]++;
    });
    // Compute today status HTML string for translation/Frontitude
    const today = new Date();
    const todayEvent = summaryEvents.find((e) => {
      const dateObj = typeof e.date === 'string' ? new Date(e.date) : e.date;
      return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
      );
    });
    // Always show this status string for today (for demo/Frontitude)
    const todayDateStr = `${today.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'numeric',
      year: 'numeric',
    })}`;
    const todayStatusHtml = `<span class="text-feedback-stroke-positive">Today: {{date}},</span> <span class="text-feedback-stroke-danger">attended late without excuse 🤨</span>`;

    // Mock calendarStats for holidays, weekends, weekdays
    // Only show calenderStats for July 2025
    let calenderStats: any = undefined;
    if (month === 6 && year === 2025) {
      // July is month 6 (0-indexed)
      calenderStats = {
        fromDate: `${year}-07-01`,
        toDate: `${year}-07-31`,
        summary: {
          HOLIDAYS: 2, // mock value
          WEEKEND_DAYS: 8, // mock value
          WEEKDAYS: 21, // mock value for July
        },
      };
    }

    return {
      dates: filteredEvents,
      status: todayStatusHtml.replace('{{date}}', todayDateStr),
      calenderStats,
      attendanceStats: getMockAttendanceStats(filteredEvents, month, year),
      month: this.effectiveMonth() + 1, // JS months are 0-based
      year: this.effectiveYear(),
    };
  });

  // Compute if the current calendar view is before the semester start
  readonly placeholderConfig = computed<DsCalendarPlaceholderConfig>(() => {
    return {
      show: true,
      title: "The semester hasn't started",
      subtitle: 'Attendance for the month will appear here',
    };
  });

  setMonthYear(month: number, year: number) {
    this.calendarMonth.set(month);
    this.calendarYear.set(year);
    this.calendarGridStart.set(null);
    this.calendarGridEnd.set(null);
  }

  onCalendarDayClick(date: Date) {
    console.log('Calendar day clicked:', date);
  }

  onCalendarMonthChange(e: DsCalendarGridRange) {
    this.calendarMonth.set(e.month);
    this.calendarYear.set(e.year);
    this.calendarGridStart.set(e.startDate);
    this.calendarGridEnd.set(e.endDate);
  }

  ngOnInit() {
    // On first render, emit the visible grid range for the initial month/year
    setTimeout(() => {
      this.emitVisibleGridRange();
    });
  }

  emitVisibleGridRange() {
    // Compute the visible grid range for the current month/year
    const month = this.effectiveMonth();
    const year = this.effectiveYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    this.onCalendarMonthChange({ month, year, startDate, endDate });
  }
}

function getMockAttendanceStats(
  events: DsAttendanceEvent[],
  month: number,
  year: number,
): DsAttendanceStats {
  // Filter events for the given month/year
  const filtered = events.filter((e) => {
    const dateObj = typeof e.date === 'string' ? new Date(e.date) : e.date;
    return dateObj.getMonth() === month && dateObj.getFullYear() === year;
  });
  const summary = {
    TOTAL: filtered.length,
    TOTAL_PRESENTS: 0,
    TOTAL_ABSENTS: 0,
    PRESENT: 0,
    ABSENT: 0,
    LATE_ARRIVAL: 0,
    EXCUSED: 0,
    ON_LEAVE: 0,
    PLANNED: 0,
    UNPLANNED: 0,
  };
  filtered.forEach((e) => {
    switch (e.attendanceStatus) {
      case AttendanceEventType.PRESENT:
        summary.PRESENT++;
        summary.TOTAL_PRESENTS++;
        break;
      case AttendanceEventType.ABSENT:
        summary.ABSENT++;
        summary.TOTAL_ABSENTS++;
        if (e.absenceType === AbsenceType.UNPLANNED) summary.UNPLANNED++;
        if (e.absenceType === AbsenceType.PLANNED) summary.PLANNED++;
        break;
      case AttendanceEventType.LATE_ARRIVAL:
        summary.LATE_ARRIVAL++;
        summary.TOTAL_PRESENTS++;
        break;
      case AttendanceEventType.EXCUSED:
        summary.EXCUSED++;
        summary.TOTAL_PRESENTS++;
        break;
      case AttendanceEventType.ON_LEAVE:
        summary.ON_LEAVE++;
        summary.TOTAL_ABSENTS++;
        if (e.absenceType === AbsenceType.PLANNED) summary.PLANNED++;
        if (e.absenceType === AbsenceType.UNPLANNED) summary.UNPLANNED++;
        break;
    }
  });
  // Find first and last date in filtered events
  const dates = filtered.map((e) =>
    typeof e.date === 'string' ? new Date(e.date) : e.date,
  );
  const fromDate = dates.length
    ? dates
        .reduce((a, b) => (a < b ? a : b))
        .toISOString()
        .slice(0, 10)
    : '';
  const toDate = dates.length
    ? dates
        .reduce((a, b) => (a > b ? a : b))
        .toISOString()
        .slice(0, 10)
    : '';
  return {
    fromDate,
    toDate,
    summary,
  };
}
