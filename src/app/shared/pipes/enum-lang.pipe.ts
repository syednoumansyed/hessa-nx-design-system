import { Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Pipe({
  name: 'enumLang',
  standalone: true,
})

/**
 * Pipe to translate enum values
 * Usage: {{ 'enum.enumName' | enumLang }}
 * @param value - enum value
 * @returns translated enum value or original value if translation not found
 */
export class EnumLangPipe implements PipeTransform {
  constructor(private transLocoService: TranslocoService) {}

  transform(value: string, lang?: string | null): string {
    const translation = this.transLocoService.translate(
      'enum.' + value?.toUpperCase(),
      {},
      lang ?? undefined,
    );
    if (translation && translation.startsWith('enum')) return value;

    return translation;
  }
}
