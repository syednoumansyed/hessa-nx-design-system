import { Pipe, PipeTransform, inject } from '@angular/core';
import {
  DS_TRANSLATION_TOKEN,
  DsTranslationService,
} from './ds-translation.token';

@Pipe({
  name: 'dsTranslate',
  standalone: true,
})
export class DsTranslatePipe implements PipeTransform {
  private readonly translationService = inject(DS_TRANSLATION_TOKEN);

  transform(
    key: string | undefined | null,
    params?: Record<string, any>,
  ): string {
    if (!key) return '';
    return this.translationService.translate(key, params);
  }
}
