import { LanguageStore } from '@shared/language-store';

/**
 * mapLocalizedSortFullName
 * Minimal utility to localize a generic full name sort column.
 * If sortByColumn === 'displayName', it's replaced by 'arFullName' or 'enFullName'
 * depending on current language from LanguageStore. Otherwise it's passed through.
 * Other params are preserved untouched.
 */
export function mapLocalizedSortFullName<
  T extends Record<string, any> | undefined,
>(params: T) {
  if (!params) return {} as Record<string, any>;
  const { sortByColumn, ...rest } = params as Record<string, any>;
  if (sortByColumn === 'displayName') {
    const localized = LanguageStore.getLang().toLowerCase().startsWith('ar')
      ? 'arFullName'
      : 'enFullName';
    return { ...rest, sortByColumn: localized };
  }
  return { ...rest, ...(sortByColumn && { sortByColumn }) };
}
