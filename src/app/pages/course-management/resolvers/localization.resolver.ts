import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { first } from 'rxjs';

// make sure translation files are loaded and available before routing
export const localizationResolver: ResolveFn<any> = (_route, _state) => {
  const translocoService = inject(TranslocoService);
  return translocoService.selectTranslation();
};
