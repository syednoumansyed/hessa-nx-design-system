import { RowClassParams } from 'ag-grid-community';

export function dangerRowRules<T>(field: keyof T, value: string) {
  return {
    'danger-row': (params: RowClassParams<T>) => params.data?.[field] === value,
  };
}
