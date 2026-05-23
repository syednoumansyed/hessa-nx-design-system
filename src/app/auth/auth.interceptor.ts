import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiUrl } from '@shared/utils/api-url.util';
import { throwError } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Interceptor for handling authentication tokens.
 * This interceptor checks if the request URL starts with the authentication API base URL,
 * and if so, it intercepts the request and handles the authentication token in the response.
 * If the response contains a token object with an access token and a refresh token,
 * it stores them in the local storage.
 * For all other requests, the interceptor forwards them without modifications.
 */
export const AuthTokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (req.url.startsWith(ApiUrl.v1Auth)) {
    return next(req).pipe(
      filter(
        (event: HttpEvent<any>): event is HttpResponse<any> =>
          event instanceof HttpResponse,
      ),
      tap((event: HttpResponse<any>) => {
        // Check if the response contains a token object
        if (
          event.body?.data?.token &&
          event.body?.data?.token?.accessToken &&
          event.body?.data?.token?.refreshToken &&
          !event.body?.data?.profilesDetected
        ) {
          localStorage.setItem(
            'accessToken',
            event.body.data.token.accessToken,
          );
          localStorage.setItem(
            'refreshToken',
            event.body.data.token.refreshToken,
          );
          localStorage.setItem(
            'chatAuthToken',
            event.body.data.token.chatAuthToken,
          );
        }
      }),
    );
  } else {
    // For all other requests, just forward them without modifications
    return next(req);
  }
};

/**
 * Interceptor to add authorization headers to outgoing HTTP requests.
 * If the user is logged in, it adds the access and refresh tokens to the "authorization" header.
 * If the user is not logged in, it forwards the request without modifications.
 */
export const AuthHeadersInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  if (accessToken && refreshToken) {
    let authHeaders = req.headers.set(
      'authorization',
      `Bearer ${localStorage.getItem('accessToken')}`,
    );
    authHeaders = authHeaders.set(
      'refreshToken',
      `${localStorage.getItem('refreshToken')}`,
    );
    const authReq = req.clone({
      headers: authHeaders,
    });
    return next(authReq);
  } else {
    return next(req);
  }
};

export const RefreshTokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        error.error?.invalidToken &&
        !req.url.endsWith('/auth/refresh') &&
        !req.url.endsWith('auth/login')
      ) {
        return authService.refreshToken().pipe(
          switchMap((refreshResponse) => {
            // Get the updated access token from localStorage after refresh
            const newAccessToken = localStorage.getItem('accessToken');
            const newRefreshToken = localStorage.getItem('refreshToken');

            // Clone the original request with updated authorization headers
            let updatedHeaders = req.headers.set(
              'authorization',
              `Bearer ${newAccessToken}`,
            );
            updatedHeaders = updatedHeaders.set(
              'refreshToken',
              `${newRefreshToken}`,
            );

            const clonedReq = req.clone({
              headers: updatedHeaders,
            });

            return next(clonedReq);
          }),
          catchError((refreshError: HttpErrorResponse) => {
            if (
              !refreshError?.error?.success &&
              refreshError?.error?.data?.invalidToken
            ) {
              authService.logout();
            }
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
