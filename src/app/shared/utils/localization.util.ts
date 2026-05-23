import { LanguageStore } from '@shared/language-store';

// Helper to get localized name from DTO using current app language
export function getLocalizedName(dto: {
  enName: string | null;
  arName: string | null;
}): string {
  if (!dto) return '';
  const lang = LanguageStore.getLang();
  const ar = (dto.arName || '').trim();
  const en = (dto.enName || '').trim();
  if (lang === 'ar') return ar || en;
  return en || ar;
}

export function getLocalizedFullName(dto: {
  enFullName: string | null;
  arFullName: string | null;
}): string {
  if (!dto) return '';
  const lang = LanguageStore.getLang();
  const ar = (dto.arFullName || '').trim();
  const en = (dto.enFullName || '').trim();
  if (lang === 'ar') return ar || en;
  return en || ar;
}
