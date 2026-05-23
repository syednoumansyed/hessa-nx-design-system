import {
  format,
  getTime,
  getUnixTime,
  isSameDay,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';
import { enUS, ar } from 'date-fns/locale';
import { isRtl } from './platform';

/**
 * Formats a date string into a nx date format.
 * @param date - The date string to format. The value is an ISO-8601 date string.
 * @returns The formatted date string in d/M/y format
 */
export const formatToHesDate = (date: string, isRTL = false) => {
  try {
    const day = new Date(date).getDate().toString().padStart(2, '0');
    const month = (new Date(date).getMonth() + 1).toString().padStart(2, '0');
    const year = new Date(date).getFullYear();

    return isRTL ? `${year}/${month}/${day}` : `${day}/${month}/${year}`;
  } catch (error) {
    return null;
  }
};

/**
 * Formats a date string into a nx time format.
 * The format will differ based on the provided locale.
 *
 * @param date - The date string to format. The value should be an ISO-8601 date string.
 * @param isRTL - A boolean indicating if the right-to-left format should be used (Arabic).
 *                If true, the time will be formatted in RTL (Arabic). Otherwise, it will be in LTR (English).
 * @returns The formatted date string in 'hh:mm a' format for LTR or 'a mm:hh' format for RTL.
 *          Returns null if the date is invalid.
 */
export const formatToHestime = (date: string, isRTL = false) => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      numberingSystem: 'latn',
    };
    return new Date(date).toLocaleTimeString(
      isRTL ? 'ar-SA' : 'en-US',
      options,
    );
  } catch (error) {
    return null;
  }
};

/**
 * Formats an Ion datetime string into a unix timestamp date set to begining of day.
 * @param dateFromIonDatetime - The Ion datetime string to format. The value is an ISO-8601 date string.
 * @returns unix timestamp date set to begining of day
 */
export const formatDateToUnix = (
  dateFromIonDatetime: string,
  // formatString?: string,
) => {
  // remove time by setting it to 00:00:00
  const startofDay = startOfDay(parseISO(dateFromIonDatetime));
  // if (formatString) {
  //   return format(startofDay, formatString);
  // } else
  return getUnixTime(startofDay);
};

export const formatDateToUnixMidnight = (
  dateFromIonDatetime: string,
  // formatString?: string,
) => {
  // remove time by setting it to 00:00:00
  const startofDay = startOfDay(parseISO(dateFromIonDatetime));
  const utcMidnight = parseISO(
    format(startofDay, "yyyy-MM-dd'T00:00:00.000Z'"),
  );
  // if (formatString) {
  //   return format(startofDay, formatString);
  // } else
  return getUnixTime(utcMidnight);
};

/**
 * Formats an Ion datetime string into a unix timestamp date with time.
 * @param dateFromIonDatetime
 */
export const formatDateToUnixWithTime = (dateFromIonDatetime: string) => {
  return getUnixTime(parseISO(dateFromIonDatetime));
};

/**
 * Formats an Ion datetime string into a unix timestamp date set to begining of day.
 * @param date -  an ISO-8601 date string.
 * @param formatString -  format string
 * @returns formatted date
 */
export const formatDate = (date: string, formatString: string) => {
  return format(date, formatString);
};

export const formatToHesDatetime = (
  date: string,
  isRTL = false,
  connector: string = ' ',
) => {
  try {
    return (
      formatToHestime(date, isRTL) + connector + formatToHesDate(date, isRTL)
    );
  } catch (error) {
    return null;
  }
};

export const formatToHesDateDay = (date: string, isRTL = false) => {
  try {
    const locale = isRTL ? ar : enUS;
    return format(parseISO(date), 'EEEE', { locale });
  } catch (error) {
    return null;
  }
};

export const parseIsoToEpochMs = (date: string | null | undefined): number => {
  if (!date) {
    return 0;
  }

  const parsed = parseISO(date);
  return isValid(parsed) ? getTime(parsed) : 0;
};

export const areIsoDatesOnSameDay = (
  first: string | null | undefined,
  second: string | null | undefined,
): boolean => {
  if (!first || !second) {
    return false;
  }

  const firstDate = parseISO(first);
  const secondDate = parseISO(second);
  if (!isValid(firstDate) || !isValid(secondDate)) {
    return false;
  }

  return isSameDay(firstDate, secondDate);
};
