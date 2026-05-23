// language-store.ts
export class LanguageStore {
  private static lang: 'en' | 'ar' = 'en';

  static setLang(lang: 'en' | 'ar') {
    LanguageStore.lang = lang;
    localStorage.setItem('lang', lang);
  }

  static getLang(): 'en' | 'ar' {
    return LanguageStore.lang;
  }

  static isArabic(): boolean {
    return LanguageStore.lang === 'ar';
  }

  static isEnglish(): boolean {
    return LanguageStore.lang === 'en';
  }

  static init() {
    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'ar') {
      LanguageStore.lang = stored;
    }
  }
}
