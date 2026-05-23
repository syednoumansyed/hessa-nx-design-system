import { TranslocoService } from '@jsverse/transloco';
import { Idropdown } from '@shared/interfaces';

export const activeInactiveDropdownOptions = (
  translationService: TranslocoService,
): Idropdown[] => {
  return [
    {
      value: 'ACTIVE',
      displayedValue: translationService.translate('enum.ACTIVE'),
    },
    {
      value: 'INACTIVE',
      displayedValue: translationService.translate('enum.INACTIVE'),
    },
  ];
};
