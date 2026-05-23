import { formatToHesDate } from './date';

type RelativeTimeLocale = 'en' | 'ar';

export interface RelativeTimeOptions {
  readonly now?: Date;
  readonly locale?: RelativeTimeLocale;
}

const TRANSLATIONS: Record<
  RelativeTimeLocale,
  {
    readonly now: string;
    readonly minute: string;
    readonly minutes: string;
    readonly hour: string;
    readonly hours: string;
    readonly yesterday: string;
  }
> = {
  en: {
    now: 'now',
    minute: 'min ago',
    minutes: 'mins ago',
    hour: 'hour ago',
    hours: 'hours ago',
    yesterday: 'Yesterday',
  },
  ar: {
    now: 'الآن',
    minute: 'دقيقة مضت',
    minutes: 'دقائق مضت',
    hour: 'ساعة مضت',
    hours: 'ساعات مضت',
    yesterday: 'أمس',
  },
};

const LOCALE_TOKEN: Record<RelativeTimeLocale, string> = {
  en: 'en-GB',
  ar: 'ar-SA',
};

const TEN_MINUTES_IN_MS = 10 * 60 * 1000;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const TWELVE_HOURS_IN_MS = 12 * ONE_HOUR_IN_MS;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;
const ONE_WEEK_IN_MS = 7 * ONE_DAY_IN_MS;

/**
 * Returns a localized relative timestamp label based on the Feed display criteria.
 * @example
 * formatRelativeTimeLabel('2025-05-22T08:00:00Z', { locale: 'en' })
 */
export function formatRelativeTimeLabel(
  input: Date | string | number,
  options: RelativeTimeOptions = {},
): string {
  const baseDate = normalizeDate(input);
  if (!baseDate) return '';

  const now = options.now ?? new Date();
  const locale: RelativeTimeLocale = options.locale ?? 'en';
  const diffMs = now.getTime() - baseDate.getTime();

  if (diffMs < 0) {
    // Future timestamps fall back to absolute date formatting.
    return formatAbsoluteDate(baseDate, locale);
  }

  const translations = TRANSLATIONS[locale];

  if (diffMs < TEN_MINUTES_IN_MS) {
    return translations.now;
  }

  const sameDay = isSameDay(baseDate, now);
  if (diffMs < TWELVE_HOURS_IN_MS || sameDay) {
    if (diffMs < ONE_HOUR_IN_MS) {
      const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
      return `${minutes} ${minutes === 1 ? translations.minute : translations.minutes}`;
    }

    const hours = Math.max(1, Math.floor(diffMs / ONE_HOUR_IN_MS));
    return `${hours} ${hours === 1 ? translations.hour : translations.hours}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(baseDate, yesterday)) {
    return `${translations.yesterday}, ${formatTime(baseDate, locale)}`;
  }

  if (diffMs < ONE_WEEK_IN_MS) {
    return formatWeekday(baseDate, locale);
  }

  return formatAbsoluteDate(baseDate, locale);
}

function normalizeDate(input: Date | string | number): Date | null {
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatTime(date: Date, locale: RelativeTimeLocale): string {
  const formatter = new Intl.DateTimeFormat(LOCALE_TOKEN[locale], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    numberingSystem: 'latn',
  });

  return formatter.format(date);
}

function formatWeekday(date: Date, locale: RelativeTimeLocale): string {
  const formatter = new Intl.DateTimeFormat(LOCALE_TOKEN[locale], {
    weekday: 'long',
  });

  return formatter.format(date);
}

function formatAbsoluteDate(date: Date, locale: RelativeTimeLocale): string {
  return (
    formatToHesDate(date.toISOString(), locale === 'ar') ??
    new Intl.DateTimeFormat(LOCALE_TOKEN[locale]).format(date)
  );
}
