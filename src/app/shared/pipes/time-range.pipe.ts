import { inject, Pipe, PipeTransform } from '@angular/core';
import { Language } from '@shared/enums';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { format, parse } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';

@Pipe({
  name: 'timeRangeWithDuration',
  standalone: true,
})
export class TimeRangePipe implements PipeTransform {
  private readonly hesTranslationService = inject(HesTranslateService);

  transform(
    startTime: string,
    endTime: string,
    duration: number,
    lang: Language,
  ): string {
    const locale = lang === Language.ARABIC ? arSA : enUS;

    const start = parse(startTime, 'HH:mm:ss', new Date());
    const end = parse(endTime, 'HH:mm:ss', new Date());

    const startFormatted = format(start, 'h:mm a', { locale });
    const endFormatted = format(end, 'h:mm a', { locale });

    return `${startFormatted} - ${endFormatted} (${duration} ${this.hesTranslationService.t('global.minutes.txt')})`;
  }
}
