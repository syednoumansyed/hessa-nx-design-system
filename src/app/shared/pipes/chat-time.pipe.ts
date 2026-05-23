import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Pipe({
  name: 'chatTime',
  standalone: true,
})
export class ChatTimePipe implements PipeTransform {
  private readonly translocoService = inject(TranslocoService);

  transform(value: string | number): string {
    const timestamp = typeof value === 'string' ? parseInt(value, 10) : value;
    const date = new Date(timestamp * 1000);

    if (isNaN(date.getTime())) {
      return value.toString();
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(
      this.translocoService.getActiveLang(),
      { numeric: 'auto' },
    );

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString(this.translocoService.getActiveLang(), {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return rtf.format(-diffInDays, 'days');
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return rtf.format(-diffInWeeks, 'weeks');
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return rtf.format(-diffInMonths, 'months');
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return rtf.format(-diffInYears, 'years');
  }
}
