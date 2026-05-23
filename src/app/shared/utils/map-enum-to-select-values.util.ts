import { inject } from '@angular/core';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';

export function mapEnumToSelectValues<T extends Record<string, string>>(
  enumType: T,
): ISelectValue[] {
  const enumPipe = inject(EnumLangPipe);
  return Object.values(enumType).map((value) => ({
    value: value as string,
    displayedValue: enumPipe.transform(value as string),
  }));
}
