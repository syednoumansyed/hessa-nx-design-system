import {
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  Validators,
  FormControl,
} from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

export const passwordValidator = Validators.pattern(/^.{8,}$/);

export function confirmPasswordValidator(params: any): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const passwordControl = params?.passwordControl();
    if (!passwordControl && control) {
      return null;
    }
    return passwordControl.value === control.value ? null : { mismatch: true };
  };
}

export const getPasswordErrorMessage = (
  formControl: FormControl,
  translocoService: TranslocoService,
) => {
  if (formControl.hasError('pattern')) {
    return translocoService.translate('global.error_password.txt');
  }

  if (formControl.hasError('mismatch')) {
    return translocoService.translate('global.password_not_match.txt');
  }
  return null;
};

export const getConfirmPasswordErrorMessage = (
  formControl: FormControl,
  translocoService: TranslocoService,
) => {
  if (formControl.hasError('mismatch')) {
    return translocoService.translate('global.password_not_match.txt');
  }
  return null;
};
