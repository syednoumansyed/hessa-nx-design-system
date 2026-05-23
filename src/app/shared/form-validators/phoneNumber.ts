import { FormControl } from '@angular/forms';
import { TranslocoService } from '@jsverse/transloco';

export const getPhoneNumberErrorMessage = (
  formControl: FormControl,
  translocoService: TranslocoService,
) => {
  if (formControl.hasError('invalidPhoneNumber')) {
    return translocoService.translate('login.invalid_number.txt');
  }
  if (formControl.hasError('notExist')) {
    return translocoService.translate('login.not_exist_number.txt');
  }
  return null;
};
