import { Pipe, PipeTransform } from '@angular/core';
import { isRtl } from '@shared/utils/platform';
import { formatToHesDate } from '@utils/date';

@Pipe({
  name: 'hesDate',
  standalone: true,
})
/**
 * Custom pipe for formatting dates in nx application.
 */
export class HesDatePipe implements PipeTransform {
  readonly isRtl = isRtl();
  /**
   * Transforms a string value representing a date into a formatted date string.
   * @param value - The string value representing the date.
   * @returns The formatted date string or returns the same input value if it's not a valid Date.
   */

  transform(value: string | undefined | null): string {
    if (!value) return ''; // Return an empty string if the value is undefined or empty
    return formatToHesDate(value, this.isRtl) ?? value;
  }
}
