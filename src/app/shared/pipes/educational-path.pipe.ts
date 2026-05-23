import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Pipe({
  name: 'hesEducationalPath',
  standalone: true,
})
export class HesEducationalPathPipe implements PipeTransform {
  private readonly translocoService = inject(TranslocoService);

  transform(path: string | undefined): string {
    return this.translocoService.translate(`enum.${path?.toUpperCase()}`);
  }
}
