import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { differenceInMinutes, parse } from 'date-fns';

export const timeDiffInMins = 5; // 5 minutes

function generateTimeSlots(locale = 'en-GB', diffInMins = 15): ISelectValue[] {
  const times: ISelectValue[] = [];
  const date = new Date(Date.UTC(1970, 0, 1, 0, 0, 0));

  const valueFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });

  const wantsArabicAmPm = /^ar(-|$)/i.test(locale);
  const displayLocale = wantsArabicAmPm ? `${locale}-u-nu-latn` : locale;

  const displayFormatter = new Intl.DateTimeFormat(displayLocale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
    numberingSystem: 'latn', // ensures 0-9, not ٠١٢٣
  });

  while (date.getUTCDate() === 1) {
    times.push({
      value: valueFormatter.format(date), // e.g., "07:00"
      displayedValue: displayFormatter.format(date), // e.g., "1:25 ص"
    });
    date.setUTCMinutes(date.getUTCMinutes() + diffInMins);
  }

  return times;
}

function getDuration(
  startTime: string,
  endTime: string,
  locale: string,
): string {
  const start = parse(startTime, 'HH:mm', new Date());
  const end = parse(endTime, 'HH:mm', new Date());

  const durationInMinutes = differenceInMinutes(end, start);

  if (durationInMinutes < 60) {
    return `${durationInMinutes} ${locale === 'ar' ? 'دقائق' : 'mins'}`;
  } else {
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return `${hours} ${locale === 'ar' ? 'ساعة' : hours > 1 ? 'hrs' : 'hr'} ${minutes > 0 ? `${minutes} ${locale === 'ar' ? 'دقائق' : 'mins'}` : ''}`;
  }
}

function filterTimeSlot(
  startFromTime: string,
  locale: string,
  timeSlots: ISelectValue[],
): ISelectValue[] {
  let index = timeSlots.findIndex((slot) => slot.value === startFromTime);
  index++;
  if (index !== -1) {
    return timeSlots.slice(index).map((slot) => {
      return {
        value: slot.value,
        displayedValue: `${slot.displayedValue} (${getDuration(
          startFromTime,
          slot.value as string,
          locale,
        )})`,
      };
    });
  }
  return timeSlots;
}
export const getTimeSlots = (
  locale: string,
  startFromTime?: string,
  diffInMins?: number,
) => {
  const timeSlots = generateTimeSlots(locale, diffInMins);

  if (startFromTime) {
    return filterTimeSlot(startFromTime, locale, timeSlots);
  }

  return timeSlots;
};
