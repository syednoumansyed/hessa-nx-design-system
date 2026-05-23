import { ITimePeriodListItem, TimePeriod } from '@shared/dto-transformation';
import { HesTranslateService } from '@shared/services/hes-translate.service';

export const days = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export function mapTimeperiodsToListItems(
  data: TimePeriod[],
  hesTranslateService: HesTranslateService,
): ITimePeriodListItem[] {
  return data.map((item) => {
    return {
      id: item.id,
      createdAt: item.createdAt,
      academicYearName: item.academicYear.name,
      academicYearId: item.academicYear.id,
      levelName: item.level.displayName,
      levelId: item.level.id,
      className: item.class?.displayName,
      classId: item.class?.id,
      isDeletable: item.isDeletable,
      dayOfWeek: item.days
        ? item.days
            .map((day) => hesTranslateService.enumT(days[day.dayOfWeek]))
            .join(', ')
        : '-',
    };
  });
}

export function generateDays(hesTranslationService: HesTranslateService) {
  return days.map((day, index) => ({
    displayedValue: hesTranslationService.enumT(day),
    value: index,
  }));
}
