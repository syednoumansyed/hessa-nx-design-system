import {
  HttpRequest,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { createAccountBlockedAlertModal } from './account-blocked-alert/account-blocked-alert.modal';

let isModalOpen = false;
/**
 * Interceptor for handling account paused scenario.
 * If the server responds with an error indicating the account is paused,
 * it shows a modal to the user and prevents further HTTP requests from processing.
 */
export const AccountBlockedInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const AccountBlockedAlertModal = createAccountBlockedAlertModal();
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const blockedStatus = error.error?.data?.statusData?.status;
      if (
        error.status === 401 &&
        error.error?.data?.accessDenied &&
        (blockedStatus === 'PAUSED' || blockedStatus === 'INACTIVE')
      ) {
        if (!isModalOpen) AccountBlockedAlertModal(blockedStatus);
        isModalOpen = true;
      }
      return throwError(() => error);
    }),
  );
};
