import { parse } from 'date-fns';
import { formatWithLocale } from '@shared/utils/time-format.util';

export function time12hr(time: string, locale?: string) {
  const parsedTime = parse(time, 'HH:mm', new Date());
  return formatWithLocale(parsedTime, 'hh:mm a');
}
