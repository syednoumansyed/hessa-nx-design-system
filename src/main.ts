import { LanguageStore } from './app/shared/language-store';
import { TuiErrorModule, TuiRootModule } from '@taiga-ui/core';
import {
  APP_INITIALIZER,
  enableProdMode,
  importProvidersFrom,
  inject,
  isDevMode,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
  Platform,
} from '@ionic/angular/standalone';
import { provideLottieOptions } from 'ngx-lottie';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco, TranslocoService } from '@jsverse/transloco';
import { ReactiveFormsModule } from '@angular/forms';
import {
  AuthHeadersInterceptor,
  AuthTokenInterceptor,
  RefreshTokenInterceptor,
} from '@auth/auth.interceptor';
import { LanguageMiddlewareInterceptor } from '@core/interceptors/language-middleware.interceptor';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { BreadcrumbModule } from '@ui-kit/hes-breadcrumbs/breadcrumb.module';
import {
  BrowserAnimationsModule,
  provideAnimations,
} from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { firstValueFrom, map, of, shareReplay, Observable } from 'rxjs';
import { AuthService } from '@auth/auth.service';
import { StudentsService } from '@pages/user-management/students/students.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { GuardianService } from '@pages/user-management/guardians/guardians.service';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { AcademicYearItem } from '@shared/interfaces/academic-year-scope.interface';
import * as Sentry from '@sentry/angular';
import { SENTRY_CONFIG } from '@shared/constants/sentry.constant';
import { provideNgIconLoader } from '@ng-icons/core';
import { TUI_DATE_FORMAT } from '@taiga-ui/cdk';
import {
  TUI_CANCEL_WORD,
  TUI_DONE_WORD,
  tuiInputTimeOptionsProvider,
} from '@taiga-ui/kit';
import { AccountBlockedInterceptor } from '@auth/account-blocked.interceptor';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import {
  DS_TRANSLATION_TOKEN,
  DsTranslationService,
} from '@ds/i18n/ds-translation.token';
import { DsToastComponent } from '@ds/toast/ds-toast.component';
// Initialize language store before app bootstrap
LanguageStore.init();
CapacitorUpdater.notifyAppReady();

if (SENTRY_CONFIG.ENABLED && environment.ENVIRONMENT_NAME !== 'local') {
  const integrations = [
    Sentry.browserTracingIntegration(),
    Sentry.httpClientIntegration(),
  ];

  if (SENTRY_CONFIG.ENABLE_REPLAY) {
    integrations.push(
      Sentry.replayIntegration({
        maskAllText: SENTRY_CONFIG.MASK_ALL_TEXT,
        blockAllMedia: SENTRY_CONFIG.BLOCK_ALL_MEDIA,
      }),
    );
  }

  Sentry.init({
    dsn: environment.SENTRY_DSN,
    integrations,
    tracesSampleRate: SENTRY_CONFIG.TRACES_SAMPLE_RATE,
    tracePropagationTargets: [
      environment.BE_API_BASE_URL.trim(),
      environment.AUTH_API_BASE_URL.trim(),
    ].map((url) => new URL(url).origin),
    replaysSessionSampleRate: SENTRY_CONFIG.ENABLE_REPLAY
      ? SENTRY_CONFIG.REPLAYS_SESSION_SAMPLE_RATE
      : 0,
    replaysOnErrorSampleRate: SENTRY_CONFIG.ENABLE_REPLAY
      ? SENTRY_CONFIG.REPLAYS_ON_ERROR_SAMPLE_RATE
      : 0,
    sendDefaultPii: true,
    environment: environment.ENVIRONMENT_NAME,
    beforeSend(event) {
      if (event.request?.headers) {
        for (const header of SENTRY_CONFIG.SENSITIVE_HEADERS) {
          delete event.request.headers[header];
          delete event.request.headers[header.toLowerCase()];
        }
      }

      if (event.request?.data && typeof event.request.data === 'object') {
        for (const key of SENTRY_CONFIG.SENSITIVE_BODY_KEYS) {
          if (key in (event.request.data as Record<string, unknown>)) {
            (event.request.data as Record<string, unknown>)[key] = '[Filtered]';
          }
        }
      }

      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (
            breadcrumb.category === 'xhr' ||
            breadcrumb.category === 'fetch'
          ) {
            if (breadcrumb.data?.['headers']) {
              delete breadcrumb.data['headers'];
            }
          }
          return breadcrumb;
        });
      }

      return event;
    },
    beforeSendTransaction(event) {
      if (event.request?.headers) {
        for (const header of SENTRY_CONFIG.SENSITIVE_HEADERS) {
          delete event.request.headers[header];
          delete event.request.headers[header.toLowerCase()];
        }
      }
      return event;
    },
  });
}

// Privacy-friendly analytics by Plausible — loaded only when configured
if (environment.PLAUSIBLE_SCRIPT_URL) {
  (window as any).plausible =
    (window as any).plausible ||
    function (...args: any[]) {
      ((window as any).plausible.q = (window as any).plausible.q || []).push(
        args,
      );
    };
  (window as any).plausible.init =
    (window as any).plausible.init ||
    function (i: any) {
      (window as any).plausible.o = i || {};
    };
  (window as any).plausible.init();

  const script = document.createElement('script');
  script.async = true;
  script.src = environment.PLAUSIBLE_SCRIPT_URL;
  document.head.appendChild(script);
}

if (environment.production) {
  enableProdMode();
}

const translocoTokenProvider = {
  provide: DS_TRANSLATION_TOKEN,
  useFactory: (transloco: TranslocoService): DsTranslationService => ({
    translate: (key: string, params?: Record<string, any>) =>
      transloco.translate(key, params),
    getActiveLang: () => transloco.getActiveLang(),
  }),
  deps: [TranslocoService],
};

const appSetting: CometChat.AppSettings = new CometChat.AppSettingsBuilder()
  .subscribePresenceForAllUsers()
  .setRegion(environment.COMET_REGION)
  .autoEstablishSocketConnection(true)
  .build();

async function prepareMockApp() {
  if (environment.MOCK_ENABLED) {
    const { worker } = await import('./mocks/browser');
    return worker.start();
  }

  return Promise.resolve();
}

function initRbac(rbacService: RoleBaseAccessControlService) {
  return () => rbacService.fetchPermission();
}

export function preloadTranslation(transloco: TranslocoService) {
  return function () {
    return firstValueFrom(transloco.load(transloco.getActiveLang()));
  };
}

// TODO: check if still needed
export function preloadStudent(
  auth: AuthService,
  studentsService: StudentsService,
  studentSelectionScopeService: StudentSelectionScopeService,
) {
  return function () {
    if (auth.isUserLoggedIn() && auth.user()?.type === 'STUDENT') {
      return firstValueFrom(
        studentsService.getStudent(auth.user()!?.userTypeId).pipe(
          map((student) => {
            const mappedStudent = {
              ...student,
              fullName: student.displayName,
              academicYear: student.academicYear,
              school: {
                ...student.school,
                id: student?.school?.id ?? null,
                name: student.school?.displayName ?? null,
                class: student.class,
                level: student.level,
              },
            };
            studentSelectionScopeService.updateStudentSelectionScope([
              mappedStudent,
            ]);
            studentSelectionScopeService.updateSelectedStudent(student.id);
            return student;
          }),
        ),
      );
    } else return of(null);
  };
}
// TODO: check if still needed
export function preloadGuardianStudents(
  auth: AuthService,
  studentSelectionScopeService: StudentSelectionScopeService,
  schoolStructureScopeService: SchoolStructureScopeService,
  guardianService: GuardianService,
  academicYearsScopeService: AcademicYearsScopeService,
) {
  return function () {
    if (auth.isUserLoggedIn() && auth.user()?.type === 'GUARDIAN') {
      return firstValueFrom(
        guardianService.getGuardian(auth.user()?.userTypeId!).pipe(
          map((g) => {
            if (g?.students?.length) {
              studentSelectionScopeService.updateStudentSelectionScopeFromGuardianStudents(
                g.students,
              );
              studentSelectionScopeService.updateSelectedStudent(
                g.students[0].id,
              );
              const firstStudentWithSchoolYear = g.students.find((s) => {
                const { school, academicYear } = s;
                return school?.id && academicYear?.id;
              });
              if (firstStudentWithSchoolYear) {
                schoolStructureScopeService.updateSelectedStructure({
                  id: firstStudentWithSchoolYear.school?.id,
                  type: 'school',
                } as sideMenuSchoolStructureItem);

                academicYearsScopeService.updateSelectedAcademicYear({
                  id: firstStudentWithSchoolYear.academicYear?.id,
                  name: firstStudentWithSchoolYear.academicYear?.displayName,
                } as AcademicYearItem);
              }
            }
            return g.students;
          }),
        ),
      );
    } else return of(null);
  };
}

CometChat.init(environment.COMET_APP_ID, appSetting)!
  .then((initialized) => {
    console.log('Initialization completed successfully', initialized);
    prepareMockApp()
      .then(() => {
        bootstrapApplication(AppComponent, {
          providers: [
            { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
            provideIonicAngular({
              useSetInputAPI: true,
              animated: true,
              // mode: 'ios', // Force iOS mode for consistent horizontal slide animations
              platform: {
                desktop: (win) => {
                  const isMobile =
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                      win.navigator.userAgent,
                    );
                  const isIpadOS =
                    /Macintosh/.test(win.navigator.userAgent) &&
                    'ontouchend' in document;
                  return !isMobile && !isIpadOS;
                },
              },
            }),
            provideRouter(routes, withComponentInputBinding()),
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
                AccountBlockedInterceptor,
              ]),
            ),
            provideTransloco({
              config: {
                availableLangs: ['en', 'ar'],
                defaultLang: !isDevMode() ? 'ar' : 'en',
                prodMode: !isDevMode(),
              },
              loader: TranslocoHttpLoader,
            }),
            translocoTokenProvider,
            {
              provide: APP_INITIALIZER,
              multi: true,
              deps: [TranslocoService],
              useFactory: preloadTranslation,
            },
            {
              provide: APP_INITIALIZER,
              multi: true,
              deps: [
                AuthService,
                StudentsService,
                StudentSelectionScopeService,
              ],
              useFactory: preloadStudent,
            },
            {
              provide: APP_INITIALIZER,
              multi: true,
              deps: [
                AuthService,
                StudentSelectionScopeService,
                SchoolStructureScopeService,
                GuardianService,
                AcademicYearsScopeService,
              ],
              useFactory: preloadGuardianStudents,
            },
            importProvidersFrom(
              ReactiveFormsModule,
              BrowserAnimationsModule,
              TuiRootModule,
              TuiErrorModule,
            ),
            importProvidersFrom(BreadcrumbModule),
            {
              provide: APP_INITIALIZER,
              useFactory: initRbac,
              multi: true,
              deps: [RoleBaseAccessControlService],
            },
            provideAnimations(),
            provideToastr({
              timeOut: 3000,
              easeTime: 180,
              toastComponent: DsToastComponent,
              closeButton: true,
              positionClass: 'toast-top-right',
            }),
            provideNgIconLoader(
              (() => {
                // Create a singleton cache outside the loader function
                const iconCache = new Map<string, Observable<string>>();

                return (name: string) => {
                  const http = inject(HttpClient);

                  // Check if icon request is already cached
                  if (iconCache.has(name)) {
                    return iconCache.get(name)!;
                  }

                  // Create and cache the observable
                  const iconRequest$ = http
                    .get(`/assets/icons/${name}.svg`, {
                      responseType: 'text',
                    })
                    .pipe(
                      shareReplay(1), // Cache the result and share it
                    );

                  iconCache.set(name, iconRequest$);
                  return iconRequest$;
                };
              })(),
            ),
            // TUI Injection tokens configuration
            {
              provide: TUI_DATE_FORMAT,
              useFactory: (platform: Platform) =>
                platform.isRTL ? 'YMD' : 'DMY',
              deps: [Platform],
            },
            {
              provide: TUI_CANCEL_WORD,
              useFactory: (transloco: TranslocoService) =>
                of(transloco.translate('global.cancel.btn')),
              deps: [TranslocoService],
            },
            {
              provide: TUI_DONE_WORD,
              useFactory: (transloco: TranslocoService) =>
                of(transloco.translate('global.ok.btn')),
              deps: [TranslocoService],
            },
            tuiInputTimeOptionsProvider({
              mode: 'HH:MM',
              maxValues: { HH: 11, MM: 59, SS: 59, MS: 999 },
            }),
            provideLottieOptions({
              player: () => import('lottie-web'),
            }),
          ],
        });
      })
      .catch((err) => console.error(err));
  })
  .catch((error) => {
    console.log('Initialization failed with error:', error);
  });
