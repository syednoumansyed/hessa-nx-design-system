import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
} from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';

export const LanguageMiddlewareInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const translocoService = inject(TranslocoService);
  const cloned = req.clone({
    setHeaders: {
      'Accept-Language': translocoService.getActiveLang(),
    },
  });
  return next(cloned);
};
