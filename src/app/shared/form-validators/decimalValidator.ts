import { AbstractControl, ValidationErrors } from '@angular/forms';

export function decimalRangeValidator(min = 1, max = 150, decimals = 2) {
  const regex = new RegExp(
    `^\\d+(?:\\.\\d{1,${decimals}})?$`, // any number with ≤ decimals
  );

  return (ctrl: AbstractControl): ValidationErrors | null => {
    const value = ctrl.value;

    if (value === null || value === '') return null; // leave required() to complain

    // 1) basic number + decimal format
    if (!regex.test(value)) return { decimalFormat: true };

    const num = parseFloat(value);

    // 2) range check
    if (num < min || num > max) return { outOfRange: true };

    // 3) special‑case 150.xx (reject)
    if (num === max && /\.\d/.test(value)) return { outOfRange: true };

    return null; // valid 🎉
  };
}
