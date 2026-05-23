import { InjectionToken } from '@angular/core';

export interface DsTranslationService {
  translate(key: string, params?: Record<string, any>): string;
  getActiveLang: () => string;
}

export const DS_TRANSLATION_TOKEN = new InjectionToken<DsTranslationService>(
  'DS_TRANSLATION_TOKEN',
);
