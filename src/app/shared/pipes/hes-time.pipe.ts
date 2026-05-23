import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Pipe({
  name: 'hesTime',
  standalone: true,
})
export class HesTimePipe implements PipeTransform {
  private readonly translocoService = inject(TranslocoService);

  transform(value: string | number): string | number {
    const activeLang = this.translocoService.getActiveLang();

    if (typeof value === 'string' && this.isTimeFormat(value)) {
      // Handle "HH:MM" format explicitly with localization
      return this.convertToLocalized12HourFormat(value, activeLang);
    }

    const date =
      typeof value === 'string' && !value.endsWith('Z')
        ? new Date(`${value}Z`) // Assume it's UTC if no timezone is provided
        : new Date(value); // Directly parse if number or already in UTC

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString(activeLang, { timeStyle: 'short' });
  }

  /**
   * Helper function to check if the string is in "HH:MM" format.
   */
  private isTimeFormat(value: string): boolean {
    return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
  }

  /**
   * Convert "HH:MM" to localized 12-hour AM/PM format.
   */
  private convertToLocalized12HourFormat(time: string, locale: string): string {
    const [hourStr, minute] = time.split(':');
    const hour = parseInt(hourStr, 10);

    // Construct a date object for formatting
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(parseInt(minute, 10));
    date.setSeconds(0);

    // Use Intl.DateTimeFormat to format the time based on locale
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }
}
