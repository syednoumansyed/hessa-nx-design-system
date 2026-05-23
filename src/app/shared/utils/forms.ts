import { FormGroup } from '@angular/forms';

export const markInvalidFormControlsAsDirty = (form: FormGroup) => {
  Object.keys(form.controls).forEach((controlKey: string) => {
    const control = (form.controls as { [key: string]: any })[controlKey];
    if (control.invalid) {
      control.markAsDirty();
      control.markAsTouched();
    }
  });
};
