import { LanguageStore } from '@shared/language-store';

export function mapLocalizedSortFullName<T extends any>(params: T) {
  let { sortByColumn, ...rest } = params as Record<string, any>;
  if (sortByColumn && sortByColumn === 'displayName') {
    sortByColumn = LanguageStore.getLang().toLowerCase().startsWith('ar')
      ? 'arFullName'
      : 'enFullName';
  }

  return { ...rest, sortByColumn };
}
