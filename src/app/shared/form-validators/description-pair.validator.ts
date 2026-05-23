import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that if one localized field (English or Arabic) has a value,
 * the other must also have a value. This is useful for optional bilingual fields
 * where both languages must be provided together or neither.
 *
 * @param enControlName - The form control name for the English field
 * @param arControlName - The form control name for the Arabic field
 * @returns ValidatorFn that returns validation errors or null
 *
 * Error keys (generated based on control names):
 * - `{enControlName}Required`: When Arabic field is filled but English is empty
 * - `{arControlName}Required`: When English field is filled but Arabic is empty
 */
export function localizedPairValidator(
  enControlName: string,
  arControlName: string,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const enValue = control.get(enControlName)?.value?.trim?.() || '';
    const arValue = control.get(arControlName)?.value?.trim?.() || '';

    const enFilled = enValue.length > 0;
    const arFilled = arValue.length > 0;

    if (enFilled && !arFilled) {
      return { [`${arControlName}Required`]: true };
    }
    if (arFilled && !enFilled) {
      return { [`${enControlName}Required`]: true };
    }
    return null;
  };
}
