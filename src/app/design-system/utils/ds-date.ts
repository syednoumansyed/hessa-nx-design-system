import { inject } from '@angular/core';
import { DS_TRANSLATION_TOKEN } from '@ds/i18n/ds-translation.token';

export const formatToDsDate = (
  input: string | Date,
  locale: 'en' | 'ar' | Omit<string, 'en' | 'ar'> = 'en',
): string | null => {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return null; // Invalid date

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return locale === 'ar'
    ? `${year}/${month}/${day}`
    : `${day}/${month}/${year}`;
};

export function createFormatToDsDate() {
  const t = inject(DS_TRANSLATION_TOKEN);
  return (input: string | Date) => {
    return formatToDsDate(input, t.getActiveLang());
  };
}
