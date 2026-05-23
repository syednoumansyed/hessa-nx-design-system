import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideTransloco } from '@jsverse/transloco';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideToastr } from 'ngx-toastr';
import { HesToastrComponent } from '@ui-kit/hes-alert/hes-alert-toast.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  BrowserAnimationsModule,
  provideAnimations,
} from '@angular/platform-browser/animations';

import {
  AuthHeadersInterceptor,
  AuthTokenInterceptor,
  RefreshTokenInterceptor,
} from '@auth/auth.interceptor';
import { LanguageMiddlewareInterceptor } from '@core/interceptors/language-middleware.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([
        // Note: sequence of interceptors is important
        // 1. refresh token api call (RefreshTokenInterceptor)
        // 2. set token to storage (AuthTokenInterceptor)
        // 3. get token from storage and set to header (AuthHeadersInterceptor)
        // 4. Other & language middleware (LanguageMiddlewareInterceptor)
        RefreshTokenInterceptor,
        AuthTokenInterceptor,
        AuthHeadersInterceptor,
        LanguageMiddlewareInterceptor,
      ]),
    ),
    provideAnimations(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'ar'],
        defaultLang: !isDevMode() ? 'ar' : 'en',
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideToastr({
      timeOut: 3000,
      toastComponent: HesToastrComponent,
      closeButton: true,
      positionClass: 'toast-bottom-right',
    }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
