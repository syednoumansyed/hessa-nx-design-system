import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';

const dayOfWeekEN: ISelectValue[] = [
  {
    value: 0,
    displayedValue: 'Sunday',
  },
  {
    value: 1,
    displayedValue: 'Monday',
  },
  {
    value: 2,
    displayedValue: 'Tuesday',
  },
  {
    value: 3,
    displayedValue: 'Wednesday',
  },
  {
    value: 4,
    displayedValue: 'Thursday',
  },
  {
    value: 5,
    displayedValue: 'Friday',
  },
  {
    value: 6,
    displayedValue: 'Saturday',
  },
];
const dayOfWeekAR: ISelectValue[] = [
  {
    value: 0,
    displayedValue: 'الأحد',
  },
  {
    value: 1,
    displayedValue: 'الاثنين',
  },
  {
    value: 2,
    displayedValue: 'الثلاثاء',
  },
  {
    value: 3,
    displayedValue: 'الأربعاء',
  },
  {
    value: 4,
    displayedValue: 'الخميس',
  },
  {
    value: 5,
    displayedValue: 'الجمعة',
  },
  {
    value: 6,
    displayedValue: 'السبت',
  },
];
export function getDaysOfWeek(locale: string): ISelectValue[] {
  return locale === 'ar' ? dayOfWeekAR : dayOfWeekEN;
}

export function getDayOfWeek(locale: string, byId: number) {
  const days = getDaysOfWeek(locale);
  return days.find((d) => d.value === byId)?.displayedValue;
}
