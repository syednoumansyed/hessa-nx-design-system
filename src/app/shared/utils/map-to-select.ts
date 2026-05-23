import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';

export const mapToSelectValue = (
  data: Array<
    { id: number; name: string } | { id: number; displayName: string }
  >,
): Array<ISelectValue> => {
  return data.map((item) => {
    const displayedValue = 'displayName' in item ? item.displayName : item.name;
    return {
      displayedValue,
      value: item.id,
    };
  });
};
