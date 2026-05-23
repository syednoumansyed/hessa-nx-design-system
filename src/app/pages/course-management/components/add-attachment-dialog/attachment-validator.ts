import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function attachmentValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const attachment = control.get('attachment')?.value;
    const link = control.get('link')?.value;

    if (!attachment && !link) {
      return { atLeastOneRequired: true };
    }
    return null;
  };
}
