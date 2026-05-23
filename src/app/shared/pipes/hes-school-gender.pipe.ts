import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { GenderEnum } from '@shared/enums';

@Pipe({
  name: 'hesSchoolGender',
  standalone: true,
})
export class HesSchoolGenderPipe implements PipeTransform {
  private readonly translocoService = inject(TranslocoService);

  transform(gender: GenderEnum): string {
    return this.translocoService.translate(`enum.${gender.toUpperCase()}`);
  }
}
