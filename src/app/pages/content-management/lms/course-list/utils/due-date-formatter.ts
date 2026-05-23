import { Language } from '@shared/enums';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  format,
  isSameDay,
} from 'date-fns';
import { enUS, ar } from 'date-fns/locale';

export interface DueDateInfo {
  label: string;
  color: 'red' | 'orange' | 'gray';
  isMissed: boolean;
}

/**
 * Formats a due date based on the time remaining from now until the due date.
 * Returns an object with a formatted label and appropriate color.
 *
 * @param dueDate - The due date as a Date object
 * @param hesTranslateService - The translation service instance
 * @returns An object containing the formatted label and color
 */
export function formatDueDate(
  dueDate: Date,
  hesTranslateService: HesTranslateService,
  currentLang: Language,
): DueDateInfo {
  const now = new Date();
  const minutesDiff = differenceInMinutes(dueDate, now);
  const hoursDiff = differenceInHours(dueDate, now);
  const daysDiff = differenceInDays(dueDate, now);

  // Get the appropriate locale for date-fns
  const locale = currentLang === Language.ARABIC ? ar : enUS;

  // Check if due date is in the past
  const isMissed = dueDate < now;

  // Determine color based on time remaining
  let color: 'red' | 'orange' | 'gray';
  if (isMissed) {
    color = 'gray';
  } else if (hoursDiff <= 24) {
    color = 'red';
  } else if (hoursDiff <= 72) {
    color = 'orange';
  } else {
    color = 'gray';
  }

  // Format label based on time remaining
  let label: string;

  if (isMissed) {
    // Past due date format
    const dateStr = format(dueDate, 'dd/MM/yyyy', { locale });
    const time = format(dueDate, 'h:mmaaa', { locale }).toLowerCase();

    label = hesTranslateService.t('content_management.was_due_on.txt', {
      date: dateStr,
      time: time,
    });
  } else if (minutesDiff < 60) {
    // Minutes format (0-59 minutes)
    const time = format(dueDate, 'h:mmaaa', { locale }).toLowerCase();
    const duration =
      minutesDiff === 1
        ? hesTranslateService.t('content_management.min.txt', {
            count: minutesDiff,
          })
        : hesTranslateService.t('content_management.mins.txt', {
            count: minutesDiff,
          });

    label = hesTranslateService.t('content_management.due_in.txt', {
      duration: duration,
      time: time,
    });
  } else if (hoursDiff <= 12) {
    // Hours format (1-12 hours)
    const time = format(dueDate, 'h:mmaaa', { locale }).toLowerCase();
    const duration =
      hoursDiff === 1
        ? hesTranslateService.t('content_management.hr.txt', {
            count: hoursDiff,
          })
        : hesTranslateService.t('content_management.hrs.txt', {
            count: hoursDiff,
          });

    label = hesTranslateService.t('content_management.due_in.txt', {
      duration: duration,
      time: time,
    });
  } else if (hoursDiff <= 24 && isSameDay(now, dueDate)) {
    // Extended hours format (12-24 hours, same day)
    const time = format(dueDate, 'h:mmaaa', { locale }).toLowerCase();
    const duration =
      hoursDiff === 1
        ? hesTranslateService.t('content_management.hr.txt', {
            count: hoursDiff,
          })
        : hesTranslateService.t('content_management.hrs.txt', {
            count: hoursDiff,
          });

    label = hesTranslateService.t('content_management.due_in.txt', {
      duration: duration,
      time: time,
    });
  } else if (daysDiff >= 1 && daysDiff <= 7) {
    // Weekday format (1-7 days)
    const weekday = format(dueDate, 'EEEE', { locale });
    const time = format(dueDate, 'h:mmaaa', { locale }).toLowerCase();

    label = hesTranslateService.t('content_management.due_on_date.txt', {
      date: weekday,
      time: time,
    });
  } else {
    // Date format (8+ days)
    const dateStr = format(dueDate, 'dd/MM/yyyy', { locale });
    const time = format(dueDate, 'h:mmaaa', { locale }).toLowerCase();

    label = hesTranslateService.t('content_management.due_on_date.txt', {
      date: dateStr,
      time: time,
    });
  }

  return {
    label,
    color,
    isMissed,
  };
}
