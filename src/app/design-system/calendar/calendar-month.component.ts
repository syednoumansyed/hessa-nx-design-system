import {
  Component,
  input,
  TemplateRef,
  computed,
  ChangeDetectionStrategy,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../icon/icon.component';
import { CalendarCellComponent } from './calendar-cell/calendar-cell.component';
import {
  DsCalendarCellData,
  DsCalendarEventConfig,
  DsCalendarGridRange,
  DsCalendarConfig,
  DsCalendarReadyEvent,
} from './calender.interface';
import { faAngleLeft, faAngleRight } from '@fortawesome/pro-regular-svg-icons';
import { CalendarSummaryComponent } from './calendar-summary.component';
import { AlertMessageComponent } from '../../design-system/alert-message/alert-message.component';

@Component({
  selector: 'ds-calendar-month',
  standalone: true,
  templateUrl: './calendar-month.component.html',
  imports: [
    CommonModule,
    CalendarCellComponent,
    DsIconComponent,
    CalendarSummaryComponent,
    AlertMessageComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarMonthComponent {
  // #region Inputs
  month = input.required<number>();
  year = input.required<number>();
  locale = input<string>('en');
  dayLabels = input<string[] | undefined>(undefined);
  config = input.required<DsCalendarConfig>();
  cellTemplate = input<TemplateRef<any> | undefined>(undefined);
  // #endregion

  // #region Outputs
  dayClick = output<Date>();
  monthChange = output<DsCalendarGridRange>();
  calendarReady = output<DsCalendarReadyEvent>();
  // #endregion

  // #region Computed signals for config splitting
  readonly events = computed(() => this.config().events);
  readonly summaryConfig = computed(() => this.config().summaryConfig);
  readonly showSummary = computed(() => this.config().showSummary);
  readonly placeholderConfig = computed(() => this.config().placeholderConfig);
  readonly status = computed(() => this.config().status);
  readonly alert = computed(() => this.config().alert);
  readonly minMonth = computed(() => this.config().minMonth);
  readonly maxMonth = computed(() => this.config().maxMonth);
  // #endregion

  // #region Template-accessible properties
  readonly arrowleft = faAngleLeft;
  readonly arrowRight = faAngleRight;
  readonly effectiveDayLabels = computed(() => {
    const labels = this.dayLabels();
    if (labels && labels.length === 7) return labels;
    return this.locale() === 'ar'
      ? ['ا', 'إث', 'ث', 'أر', 'خ', 'ج', 'س']
      : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  });

  readonly monthName = computed(() =>
    new Date(this.year(), this.month()).toLocaleString(this.locale(), {
      month: 'long',
    }),
  );

  readonly todayString = computed(() => {
    const today = new Date();
    return today.toLocaleDateString(
      this.locale() === 'ar' ? 'ar-SA' : 'en-GB',
      { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' },
    );
  });

  readonly weeks = computed(() => this.generateWeeks());

  /**
   * Computed property to determine if placeholder should be shown
   */
  readonly showPlaceholder = computed(() => {
    const placeholder = this.placeholderConfig();
    return placeholder?.show ?? false;
  });

  readonly isNextMonthDisabled = computed(() => {
    const maxMonth = this.maxMonth();
    if (maxMonth) {
      const currentYear = this.year();
      const currentMonth = this.month();
      const nextMonth = currentMonth + 1;
      const nextYear = currentYear + (nextMonth > 11 ? 1 : 0);
      const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;

      return (
        nextYear > maxMonth.year ||
        (nextYear === maxMonth.year && nextMonthIndex > maxMonth.month)
      );
    }

    // Fallback to original logic if no maxMonth is configured
    const today = new Date();
    const nextMonth = this.month() + 1;
    const nextYear = this.year() + (nextMonth > 11 ? 1 : 0);
    const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
    return (
      nextYear > today.getFullYear() ||
      (nextYear === today.getFullYear() && nextMonthIndex > today.getMonth())
    );
  });

  readonly isPrevMonthDisabled = computed(() => {
    const minMonth = this.minMonth();
    if (minMonth) {
      const currentYear = this.year();
      const currentMonth = this.month();
      const prevMonth = currentMonth - 1;
      const prevYear = currentYear + (prevMonth < 0 ? -1 : 0);
      const prevMonthIndex = prevMonth < 0 ? 11 : prevMonth;

      return (
        prevYear < minMonth.year ||
        (prevYear === minMonth.year && prevMonthIndex < minMonth.month)
      );
    }

    return false;
  });
  // #endregion

  // #region Public methods
  /** Returns the current calendar grid range object */
  private getCurrentCalendarRange(): DsCalendarGridRange {
    const { startDate, endDate } = this.getVisibleGridRange();
    return {
      month: this.month(),
      year: this.year(),
      startDate,
      endDate,
    };
  }

  /** Emits the current month/year and visible grid range */
  emitCurrentMonthChange() {
    this.monthChange.emit(this.getCurrentCalendarRange());
  }

  /** Emits the calendar ready event with the current grid range */
  emitCalendarReadyEvent() {
    this.calendarReady.emit({
      range: this.getCurrentCalendarRange(),
    });
  }

  /** Emits when a day is clicked */
  onDayClick(date: Date) {
    this.dayClick.emit(date);
  }

  /** Emits when the component is initialized */
  ngOnInit() {
    // Only emit the ready event on init (not monthChange)
    this.emitCalendarReadyEvent();
  }
  // #endregion

  // #region Private methods
  /** Returns the first and last visible dates in the calendar grid (including out-of-month days). */
  private getVisibleGridRange(): { startDate: Date; endDate: Date } {
    const firstDay = new Date(this.year(), this.month(), 1);
    const lastDay = new Date(this.year(), this.month() + 1, 0);
    // Start from the Sunday before (or same day if already Sunday)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    // End at the Saturday after (or same day if already Saturday)
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    return { startDate, endDate };
  }

  /** Generates the weeks for the calendar grid */
  private generateWeeks(): DsCalendarCellData[][] {
    const firstDay = new Date(this.year(), this.month(), 1);
    const lastDay = new Date(this.year(), this.month() + 1, 0);
    const weeks: DsCalendarCellData[][] = [];
    let current = new Date(firstDay);
    current.setDate(current.getDate() - current.getDay());
    while (current <= lastDay || current.getDay() !== 0) {
      const week: DsCalendarCellData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(current);
        week.push({ date, event: this.getEventForDate(date) });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }

  /** Returns the event for a given date, if any */
  private getEventForDate(date: Date): DsCalendarEventConfig | undefined {
    return this.events().find(
      (e: DsCalendarEventConfig) =>
        e.date.getFullYear() === date.getFullYear() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getDate() === date.getDate(),
    );
  }

  /** Returns all events for a given date */
  getEventsForDate(date: Date): DsCalendarEventConfig[] {
    return this.events().filter(
      (e: DsCalendarEventConfig) =>
        e.date.getFullYear() === date.getFullYear() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getDate() === date.getDate(),
    );
  }

  /** True if the given date is today */
  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /** Go to previous month and emit new grid range */
  prevMonth() {
    if (this.isPrevMonthDisabled()) {
      return;
    }

    let newMonth = this.month() - 1;
    let newYear = this.year();
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    const { startDate, endDate } = this.getVisibleGridRangeFor(
      newYear,
      newMonth,
    );
    this.monthChange.emit({
      month: newMonth,
      year: newYear,
      startDate,
      endDate,
    });
  }

  /** Go to next month and emit new grid range */
  nextMonth() {
    if (this.isNextMonthDisabled()) {
      return;
    }

    let newMonth = this.month() + 1;
    let newYear = this.year();
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    const { startDate, endDate } = this.getVisibleGridRangeFor(
      newYear,
      newMonth,
    );
    this.monthChange.emit({
      month: newMonth,
      year: newYear,
      startDate,
      endDate,
    });
  }

  /** Helper to get visible grid range for any month/year */
  private getVisibleGridRangeFor(
    year: number,
    month: number,
  ): { startDate: Date; endDate: Date } {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    return { startDate, endDate };
  }
  // #endregion
}
