import { Pipe, PipeTransform } from '@angular/core';
import { formatDuration, intervalToDuration } from 'date-fns';

@Pipe({
  name: 'convertSecondsToHrsMinSec',
  standalone: true,
})
export class SecondsToMinHrsPipe implements PipeTransform {
  transform(value: number | null | undefined): string | null {
    if (!value) return '0 seconds';
    const duration = intervalToDuration({ start: 0, end: value * 1000 });
    return formatDuration(duration, {
      format: ['hours', 'minutes', 'seconds'],
    });
  }
}
