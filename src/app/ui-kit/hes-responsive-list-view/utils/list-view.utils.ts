import {
  formatToHesDate,
  formatToHesDateDay,
  formatToHestime,
} from '@shared/utils/date';
import { ITableCol } from '../../hes-table/model';
import { HesTranslateService } from '@shared/services/hes-translate.service';

interface GetFormattedValueOptions {
  col: ITableCol;
  data: Record<string, any>;
  translation: HesTranslateService;
  isRtl: boolean;
}
export function getFormattedValueByField({
  col,
  data,
  translation,
  isRtl,
}: GetFormattedValueOptions): string {
  const { field, type } = col;
  const value = data?.[field];
  if (value === null || value === undefined) {
    return '-';
  }
  switch (type) {
    case 'enum': {
      return translation.enumT(value);
    }
    case 'dateTime': {
      return `${formatToHesDate(value, isRtl)} ${formatToHestime(value, isRtl)}`;
    }
    case 'dateDay': {
      return `${formatToHesDate(value, isRtl)} ${formatToHesDateDay(value, isRtl)}`;
    }
    case 'date': {
      return `${formatToHesDate(value, isRtl)}`;
    }
    case 'time': {
      return `${formatToHestime(value, isRtl)}`;
    }
    default:
      return value;
  }
}

export function isSelectorType(column: ITableCol) {
  const selectorTypes = ['select', 'chip-selector'];
  return selectorTypes.includes(column.filterType!);
}
