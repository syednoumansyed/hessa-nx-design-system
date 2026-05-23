import { Platform } from '@ionic/angular/standalone';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { isToday } from 'date-fns';
import { formatToHesDate, formatToHesDatetime } from '@shared/utils/date';

@Pipe({
  name: 'chatTimeDate',
  standalone: true,
})
export class ChatTimeDatePipe implements PipeTransform {
  private readonly translocoService = inject(TranslocoService);
  private platform = inject(Platform);
  transform(value: number, ...args: unknown[]): unknown {
    const dateTime = new Date(value);
    if (dateTime.toString() === 'Invalid Date') {
      return value;
    }
    const isRTL = this.translocoService.getActiveLang() === 'ar';
    const time = dateTime.toLocaleTimeString(
      this.translocoService.getActiveLang(),
      {
        timeStyle: 'short',
      },
    );
    const date = formatToHesDate(dateTime.toISOString(), isRTL);
    return `${date} ${time}`;
  }
}
