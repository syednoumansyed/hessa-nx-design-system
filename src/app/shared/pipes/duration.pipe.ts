import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { formatToHesDate } from '@shared/utils/date';
import { isToday, isYesterday } from 'date-fns';
import { Platform } from '@ionic/angular/standalone';

@Pipe({
  name: 'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  private translocoService = inject(TranslocoService);
  private platform = inject(Platform);
  transform(value: number): string | null {
    if (isToday(value)) {
      return this.translocoService.translate('global.today.txt');
    } else if (isYesterday(value)) {
      return this.translocoService.translate('global.yesterday.txt');
    } else {
      return (
        formatToHesDate(new Date(value)?.toISOString(), this.platform.isRTL) ??
        value?.toString()
      );
    }
  }
}
