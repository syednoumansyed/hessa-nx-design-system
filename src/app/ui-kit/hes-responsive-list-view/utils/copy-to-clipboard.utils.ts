import { ITableCol } from '@ui-kit/hes-table/model';
import { getFormattedValueByField } from './list-view.utils';
import { inject } from '@angular/core';
import { isRtl } from '@shared/utils/platform';
import { HesTranslateService } from '@shared/services/hes-translate.service';

export function createCopyToClipboard<T>() {
  const isRTL = isRtl();
  const translation = inject(HesTranslateService);
  return (data: T[], columns: ITableCol<T>[]) => {
    // Step 1: Create headers
    const headers = columns
      .filter((col) => col.field !== 'actions') // Exclude action columns
      .map((col) => col.headerName)
      .join('\t'); // Use tab instead of comma

    // Step 2: Create rows
    const rows = data.map((item) => {
      return columns
        .filter((col) => col.field !== 'actions') // Exclude action columns
        .map((col) => {
          if (col.extractValue) {
            // Use `extractValue` if defined
            return String(col.extractValue({ data: item })).replace(/\t/g, ' ');
          } else if (col.valueFormatter) {
            // Use `valueFormatter` if defined
            const value = col.valueFormatter({
              data: item,
              value: item[col.field as keyof T],
            });
            return String(value).replace(/\t/g, ' ');
          } else {
            return getFormattedValueByField({
              col,
              data: item as Record<string, any>,
              isRtl: isRTL,
              translation,
            });
          }
        })
        .join('\t'); // Use tab instead of comma
    });

    // Step 3: Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');

    // Step 4: Copy to clipboard
    navigator.clipboard.writeText(csvContent).catch((err) => {
      console.log('Failed to copy data. Try again.', err);
    });
  };
}
