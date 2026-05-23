import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { TUI_IS_IOS, TuiDay } from '@taiga-ui/cdk';
import { isMobile } from '@shared/utils/platform';

const STARTING_YEAR = 1900;
const MONTHS_IN_YEAR = 12;
const YEARS_IN_ROW = 5;

/**
 * Calculates the number of week rows a calendar month occupies.
 * Uses Monday as first day of week (ISO), matching Taiga UI's calculation.
 */
function weekCount(year: number, month: number): number {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const days = lastOfMonth.getDate() + ((firstOfMonth.getDay() || 7) - 1);
  return Math.ceil(days / 7);
}

/**
 * Calculates the pixel height of a month in the mobile calendar.
 * Mirrors the calculation in TuiMobileCalendarStrategy.
 */
function getMonthHeight(year: number, month: number, isIOS: boolean): number {
  const labelHeight = isIOS ? 50 : 64;
  const weekHeight = isIOS ? 50 : 48;
  return labelHeight + weekCount(year, month) * weekHeight;
}

/**
 * Calculates the scroll offset (in pixels) to reach a given month index
 * in the mobile calendar's virtual scroll viewport.
 * Uses 28-year cycle optimization since calendar patterns repeat every 28 years.
 */
function getScrollOffsetForMonth(
  targetMonthIndex: number,
  isIOS: boolean,
): number {
  const cycleMonths = 28 * MONTHS_IN_YEAR;

  // Pre-calculate one 28-year cycle of month heights
  const cycleSizes: number[] = [];
  let cycleTotal = 0;
  for (let i = 0; i < cycleMonths; i++) {
    const year = STARTING_YEAR + Math.floor(i / MONTHS_IN_YEAR);
    const month = i % MONTHS_IN_YEAR;
    const h = getMonthHeight(year, month, isIOS);
    cycleSizes.push(h);
    cycleTotal += h;
  }

  const fullCycles = Math.floor(targetMonthIndex / cycleMonths);
  const remainder = targetMonthIndex % cycleMonths;

  let offset = fullCycles * cycleTotal;
  for (let i = 0; i < remainder; i++) {
    offset += cycleSizes[i];
  }

  return offset;
}

/**
 * On mobile, Taiga UI's mobile calendar always opens scrolled to the current month.
 * When a min date is set beyond the current month, this directive scrolls
 * the mobile calendar to the min date's month after it opens.
 */
@Directive({
  selector: '[mobileCalendarMinScroll]',
  standalone: true,
})
export class MobileCalendarMinScrollDirective implements OnDestroy {
  @Input('mobileCalendarMinScroll') minDate: TuiDay | null = null;

  private readonly isMobileDevice = isMobile();
  private readonly isIOS = inject(TUI_IS_IOS);
  private readonly ngZone = inject(NgZone);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private pollTimeout: ReturnType<typeof setTimeout> | null = null;

  @HostListener('click')
  onClick(): void {
    if (!this.isMobileDevice || !this.minDate) return;

    // Don't override scroll if a date is already selected
    const inputEl = this.elementRef.nativeElement.querySelector('input');
    if (inputEl && inputEl.value.trim()) return;

    const today = TuiDay.currentLocal();
    const min = this.minDate;

    // Only override scroll if min date is beyond the current month
    if (
      min.year < today.year ||
      (min.year === today.year && min.month <= today.month)
    ) {
      return;
    }

    this.scrollToMinDate(min);
  }

  private scrollToMinDate(min: TuiDay): void {
    this.clearPoll();

    const targetMonthIndex =
      min.month + (min.year - STARTING_YEAR) * MONTHS_IN_YEAR;

    this.ngZone.runOutsideAngular(() => {
      const attemptScroll = (retries = 0): void => {
        if (retries >= 40) return;

        const mobileCalendar = document.querySelector('tui-mobile-calendar');
        if (!mobileCalendar) {
          this.pollTimeout = setTimeout(() => attemptScroll(retries + 1), 100);
          return;
        }

        const viewports = mobileCalendar.querySelectorAll(
          'cdk-virtual-scroll-viewport',
        );

        // Mobile calendar has 2 viewports: [0] = years (horizontal), [1] = months (vertical)
        if (viewports.length < 2) {
          this.pollTimeout = setTimeout(() => attemptScroll(retries + 1), 100);
          return;
        }

        const monthsViewport = viewports[1];

        // Wait until the viewport has rendered content
        if (monthsViewport.scrollHeight <= 0) {
          this.pollTimeout = setTimeout(() => attemptScroll(retries + 1), 100);
          return;
        }

        // Scroll months viewport to the target month
        const monthScrollOffset = getScrollOffsetForMonth(
          targetMonthIndex,
          this.isIOS,
        );
        monthsViewport.scrollTop = monthScrollOffset;

        // Scroll years viewport to the target year
        const yearsViewport = viewports[0];
        const yearWidth = document.documentElement.clientWidth / YEARS_IN_ROW;
        const yearIndex = Math.max(min.year - STARTING_YEAR - 2, 0);
        yearsViewport.scrollLeft = yearIndex * yearWidth;
      };

      // Start polling after a short delay for the calendar to begin rendering
      this.pollTimeout = setTimeout(() => attemptScroll(), 300);
    });
  }

  private clearPoll(): void {
    if (this.pollTimeout !== null) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
  }

  ngOnDestroy(): void {
    this.clearPoll();
  }
}
