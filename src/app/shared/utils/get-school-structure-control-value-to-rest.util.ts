import { SchoolStructureControlValue } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';

export function getSchoolStructureControlValueToRest(
  value: SchoolStructureControlValue[],
): SchoolStructureControlValue[] {
  return (
    value?.map((item) => {
      if (item.type === 'sub-company') {
        return {
          ...item,
          type: 'company',
        };
      }
      return item;
    }) ?? []
  );
}
