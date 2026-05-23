import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DsCalendarEventConfig } from '../calender.interface';
import { DsIcon, DsIconComponent } from '../../icon/icon.component';
import { NgClass } from '@angular/common';
import { DsTooltipDirective } from '@ds/tooltip/ds-tooltip.directive';
import { faCircleInfo } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'ds-calendar-cell',
  templateUrl: './calendar-cell.component.html',
  styleUrls: ['./calendar-cell.component.scss'],
  standalone: true,
  imports: [DsIconComponent, NgClass, DsTooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarCellComponent {
  // #region Inputs
  /** The label to display in the cell (overrides date if present) */
  label = input<string | number>();
  /** The event config for this cell (if any) */
  event = input<DsCalendarEventConfig>();
  /** The date this cell represents (if any) */
  date = input<Date>();
  /** True if this cell is a week label (header) */
  isWeekLabel = input.required<boolean>();
  /** The index of the day in the week (0=Su, 6=Sa) */
  dayIndex = input.required<number>();
  /** Tooltip text for the cell (optional) */
  isOutOfMonth = input<boolean>(false);

  // #endregion

  // #region Template-accessible properties
  /** Only show icon if event exists and NOT out-of-month */
  readonly icon = computed<DsIcon | null>(() => {
    const event = this.event();
    if (this.isOutOfMonth() || !event) return null;
    return (event.icon as string | null) || null;
  });

  /** The display value for the cell (label, date, or empty string) */
  readonly display = computed<string | number>(() => {
    if (this.label() !== undefined && this.label() !== null)
      return this.label() as string | number;
    if (this.date()) return this.date()!.getDate();
    return '';
  });

  readonly tooltipTitle = computed<string | undefined>(() => {
    const event = this.event();
    return event?.tooltip?.title;
  });

  readonly tooltipContent = computed<string | undefined>(() => {
    const event = this.event();
    return event?.tooltip?.content;
  });

  readonly tooltipFooter = computed<string | undefined>(() => {
    const event = this.event();
    return event?.tooltip?.footer ?? '';
  });

  circleInfoIcon = faCircleInfo;

  /** The computed style string for the cell */
  readonly cellStyle = computed(() => {
    const styles = [this.getDefaultStyles()];
    if (this.isOutOfMonth()) {
      this.applyOutOfMonthStyles(styles);
      return styles.join(' ');
    }
    if (this.isWeekLabel() || !this.event()) {
      this.applyDayTypeStyles(styles);
      if (!this.isWeekLabel() && this.isToday()) {
        styles.push(
          'border-stroke-high bg-icon-high !text-content-high-inverse',
        );
      } else {
        styles.push('border-transparent');
      }
      return styles.join(' ');
    }
    this.applyEventTypeStyles(styles);
    if (this.tooltipTitle() || this.tooltipContent() || this.tooltipFooter()) {
      styles.push('cursor-pointer');
    }
    return styles.join(' ');
  });

  /** True if this cell represents today */
  readonly isToday = computed<boolean>(() => {
    const date = this.date();
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  });

  /** True if this cell represents a future day (after today) */
  readonly isFutureDay = computed<boolean>(() => {
    const date = this.date();
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  });
  // #endregion

  // #region Private methods
  /** Returns the default style classes for a cell */
  private getDefaultStyles(): string {
    return 'relative flex single-line-sm-high-emphasis h-[30px] w-[28px] md:h-[39px] md:w-9 items-center justify-center border-2 border-b-4 rounded-ds-full';
  }

  /** Applies working/non-working day styles */
  private applyDayTypeStyles(styles: string[]): void {
    const idx = this.dayIndex();
    if (this.isFutureDay()) {
      styles.push('text-emphasis-low');
      return;
    }
    if (typeof idx === 'number') {
      if (idx >= 0 && idx <= 4) {
        styles.push('text-emphasis-mid'); // Working day (Sun-Thu)
      } else {
        styles.push('text-emphasis-low'); // Non-working day (Fri-Sat)
      }
    }
  }

  /** Applies event type styles */
  private applyEventTypeStyles(styles: string[]): void {
    const event = this.event();
    switch (event?.cellType) {
      case 'success-outline':
        styles.push(
          'bg-feedback-surface-positive border-feedback-stroke-positive text-feedback-stroke-positive',
        );
        break;
      case 'danger-outline':
        styles.push(
          'text-feedback-stroke-danger border-feedback-stroke-danger bg-feedback-surface-danger',
        );
        break;
      case 'danger':
        styles.push(
          'bg-feedback-stroke-danger border-error-fill text-content-high-inverse',
        );
        break;
      case 'success':
        styles.push(
          'bg-feedback-stroke-positive border-feedback-surface-positive text-content-high-inverse',
        );
        break;
      case 'exciting':
        styles.push(
          '[background:repeating-linear-gradient(-45deg,#7C3FF1_0px,#7C3FF1_2px,#9D67F5_2px,#9D67F5_4px)] text-content-high-inverse border-indigo-50',
        );
        break;
      default:
        styles.push('text-emphasis-mid');
    }
  }

  /** Applies out-of-month cell styles */
  private applyOutOfMonthStyles(styles: string[]): void {
    const event = this.event();
    if (event) {
      styles.push('opacity-50');
      switch (event.cellType) {
        case 'success-outline':
        case 'success':
          styles.push('text-feedback-stroke-positive');
          break;
        case 'danger-outline':
        case 'danger':
          styles.push('text-feedback-stroke-danger');
          break;
        default:
          styles.push('text-emphasis-low');
      }
    } else {
      styles.push('text-emphasis-low');
    }
    styles.push('border-transparent');
  }
  // #endregion
}
