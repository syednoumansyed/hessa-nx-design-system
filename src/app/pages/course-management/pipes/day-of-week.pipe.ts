import { Pipe, PipeTransform, inject } from '@angular/core';
import { getDayOfWeek } from '../utils/day-of-week.utils';
import { TranslocoService } from '@jsverse/transloco';

@Pipe({
  name: 'dayOfWeek',
  standalone: true,
})
export class DayOfWeekPipe implements PipeTransform {
  private readonly translocoService = inject(TranslocoService);
  transform(value: number): unknown {
    return getDayOfWeek(this.translocoService.getActiveLang(), value);
  }
}
