import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { formatToHesDatetime } from '@shared/utils/date';

@Pipe({
  name: 'hesDateTime',
  standalone: true,
})
export class HesDateTimePipe implements PipeTransform {
  private readonly translocoService = inject(TranslocoService);

  transform(value: string, dateTimeConnector?: string): string {
    return (
      formatToHesDatetime(
        value,
        this.translocoService.getActiveLang() === 'ar',
        dateTimeConnector,
      ) ?? value
    );
  }
}
