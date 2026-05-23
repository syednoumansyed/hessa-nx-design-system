import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { time12hr } from '../utils/time-12-hr.utils';

const AM_PM_MAP: Record<string, { AM: string; PM: string }> = {
  ar: { AM: 'ص', PM: 'م' },
};

@Pipe({
  name: 'time12hr',
  standalone: true,
})
export class Time12hrPipe implements PipeTransform {
  private readonly translocoService = inject(TranslocoService);

  transform(value: string): string {
    if (!value) return '';
    const formatted = time12hr(value) as string;
    const map = AM_PM_MAP[this.translocoService.getActiveLang()];
    if (!map) return formatted;
    return formatted.replace(/AM/g, map.AM).replace(/PM/g, map.PM);
  }
}
