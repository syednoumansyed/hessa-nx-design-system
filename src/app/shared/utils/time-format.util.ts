import { LanguageStore } from '@shared/language-store';
import { format, getHours, getMinutes, isValid, parse } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

type TimeUnit = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

interface TimeDifference {
  value: number;
  unit: TimeUnit;
}

const formatterCache = new Map<string, Intl.RelativeTimeFormat>();

const getRelativeTimeFormatter = (locale: string): Intl.RelativeTimeFormat => {
  if (!formatterCache.has(locale)) {
    formatterCache.set(
      locale,
      new Intl.RelativeTimeFormat(locale, { numeric: 'always' }),
    );
  }

  return formatterCache.get(locale)!;
};

const clampToMinimum = (value: number): number => (value > 0 ? value : 1);

const resolveTimeDifference = (
  created: Date,
  reference: Date,
): TimeDifference => {
  let diffMs = reference.getTime() - created.getTime();

  if (Number.isNaN(diffMs) || diffMs < 0) {
    diffMs = 0;
  }

  const totalMinutes = Math.floor(diffMs / MS_PER_MINUTE);
  if (totalMinutes < 1) {
    return { value: 1, unit: 'minute' };
  }

  if (totalMinutes < 60) {
    return { value: clampToMinimum(totalMinutes), unit: 'minute' };
  }

  const totalHours = Math.floor(diffMs / MS_PER_HOUR);
  if (totalHours < 24) {
    return { value: clampToMinimum(totalHours), unit: 'hour' };
  }

  const totalDays = Math.floor(diffMs / MS_PER_DAY);
  if (totalDays < 7) {
    return { value: clampToMinimum(totalDays), unit: 'day' };
  }

  if (totalDays < 30) {
    const weeks = Math.floor(totalDays / 7);
    return { value: clampToMinimum(weeks), unit: 'week' };
  }

  const totalMonths = Math.floor(totalDays / 30);
  if (totalMonths < 12) {
    return { value: clampToMinimum(totalMonths), unit: 'month' };
  }

  const totalYears = Math.floor(totalDays / 365);
  return { value: clampToMinimum(totalYears), unit: 'year' };
};

const resolveLocale = (): string => {
  const language = LanguageStore.getLang?.() ?? 'en';
  return language.startsWith('ar') ? 'ar' : 'en';
};

export const getDateFnsLocale = () => (LanguageStore.isArabic() ? ar : enUS);

/**
 * Locale-aware wrapper around date-fns `format`.
 * Automatically picks Arabic or English locale based on LanguageStore.
 */
export const formatWithLocale = (
  date: Date | number | string,
  formatStr: string,
): string => {
  return format(date, formatStr, { locale: getDateFnsLocale() });
};

export const formatNotificationTime = (
  createdAt: string | Date,
  reference: Date = new Date(),
): string => {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const difference = resolveTimeDifference(created, reference);
  const locale = resolveLocale();
  const formatter = getRelativeTimeFormatter(locale);

  return formatter.format(-difference.value, difference.unit);
};

export const startOfDay = (value: Date): Date => {
  const clone = new Date(value);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

export const differenceInCalendarDays = (a: Date, b: Date): number => {
  const msInDay = 24 * 60 * 60 * 1000;
  const diff = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(diff / msInDay);
};

/**
 * Convert 12-hour format to 24-hour format.
 * Input: "09:00 PM" or "12:00 AM"
 * Output: "21:00" or "00:00"
 */
export const to24HourFormat = (time12h: string | null): string | null => {
  if (!time12h) return null;

  try {
    // Normalize input to ensure space before AM/PM
    const normalized = time12h.replace(/\s*(AM|PM|am|pm)$/i, ' $1');
    // Parse 12-hour format (h allows 1 or 2 digit hours)
    const parsedTime = parse(normalized, 'h:mm a', new Date());

    // Return null if invalid
    if (!isValid(parsedTime)) {
      return null;
    }

    // Format to 24-hour format (e.g., "21:00")
    return format(parsedTime, 'HH:mm');
  } catch {
    return null;
  }
};

/**
 * Normalize time to HH:MM format (strip seconds if present).
 * Input: "21:00:00" or "21:00"
 * Output: "21:00"
 * Used to ensure API receives time without seconds.
 */
export const normalizeTimeFormat = (time: string | null): string | null => {
  if (!time) return null;

  try {
    // Try parsing with seconds first (H allows 1 or 2 digit hours)
    let parsedTime = parse(time, 'H:mm:ss', new Date());

    // If that fails, try without seconds
    if (!isValid(parsedTime)) {
      parsedTime = parse(time, 'H:mm', new Date());
    }

    // Return null if still invalid
    if (!isValid(parsedTime)) {
      return null;
    }

    // Format to HH:MM (without seconds)
    return format(parsedTime, 'HH:mm');
  } catch {
    return null;
  }
};

/**
 * Convert 24-hour format to 12-hour format.
 * Input: "21:00", "21:00:00", or "00:00"
 * Output: "09:00 PM" or "12:00 AM"
 * Handles both HH:MM and HH:MM:SS formats (database TIME type includes seconds).
 */
export const to12HourFormat = (time24h: string | null): string | null => {
  if (!time24h) return null;

  try {
    // Try parsing with seconds first (H allows 1 or 2 digit hours)
    let parsedTime = parse(time24h, 'H:mm:ss', new Date());

    // If that fails, try without seconds
    if (!isValid(parsedTime)) {
      parsedTime = parse(time24h, 'H:mm', new Date());
    }

    // Return null if still invalid
    if (!isValid(parsedTime)) {
      return null;
    }

    // Format to 12-hour format (e.g., "09:00 PM") - uses canonical AM/PM
    // so downstream parsers (to24HourFormat, DsTimePicker) can parse it back
    return format(parsedTime, 'hh:mm a');
  } catch {
    return null;
  }
};

/**
 * Checks if current time falls within the snooze window.
 * Handles overnight spans (e.g., 21:00 to 09:00) correctly.
 *
 * @param snoozeStartTime - Start time in HH:MM or HH:MM:SS format (24-hour)
 * @param snoozeEndTime - End time in HH:MM or HH:MM:SS format (24-hour)
 * @returns true if current time is within the snooze window
 */
export const isWithinPauseWindow = (
  snoozeStartTime: string | null | undefined,
  snoozeEndTime: string | null | undefined,
): boolean => {
  if (!snoozeStartTime || !snoozeEndTime) return false;

  try {
    const now = new Date();
    const currentMinutes = getHours(now) * 60 + getMinutes(now);

    // Try parsing with seconds first (H allows 1 or 2 digit hours)
    let startTime = parse(snoozeStartTime, 'H:mm:ss', new Date());
    if (!isValid(startTime)) {
      startTime = parse(snoozeStartTime, 'H:mm', new Date());
    }

    let endTime = parse(snoozeEndTime, 'H:mm:ss', new Date());
    if (!isValid(endTime)) {
      endTime = parse(snoozeEndTime, 'H:mm', new Date());
    }

    // Validate parsed times
    if (!isValid(startTime) || !isValid(endTime)) {
      return false;
    }

    const startMinutes = getHours(startTime) * 60 + getMinutes(startTime);
    const endMinutes = getHours(endTime) * 60 + getMinutes(endTime);

    // Handle overnight spans (e.g., 21:00 to 09:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch {
    return false;
  }
};
