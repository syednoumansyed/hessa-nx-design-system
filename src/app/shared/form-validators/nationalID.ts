import { FormControl, Validators } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

export const SaudiNationalityId = 1;
export const nationalIdMax10Validator = Validators.pattern(/^\d{10}$/);
export const nationalIdMax18Validator = Validators.pattern(/^\d{8,18}$/);

export const getNationalIdErrorMessage = (
  formControl: FormControl,
  translocoService: TranslocoService,
) => {
  if (formControl.hasError('pattern')) {
    return translocoService.translate(
      'global.national_id_max_length_18_error.txt',
    );
  } else if (formControl.hasError('incorrect')) {
    return translocoService.translate('login.incorrect_national_id.txt');
  }
  return null;
};
