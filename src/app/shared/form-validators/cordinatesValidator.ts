import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function latitudeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined) {
      return null;
    }
    return isFinite(value) && Math.abs(value) <= 90
      ? null
      : { invalidLatitude: true };
  };
}

export function longitudeValidator(): ValidatorFn {
  const maxPossibleLongitude = 180;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined) {
      return null;
    }
    return isFinite(value) && Math.abs(value) <= maxPossibleLongitude
      ? null
      : { invalidLongitude: true };
  };
}
