import {
  Component,
  Inject,
  OnInit,
  inject,
  ErrorHandler,
  APP_INITIALIZER,
  signal,
} from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DOCUMENT, NgClass } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import { OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';
import { Router } from '@angular/router';
import { SplashScreenWebComponent } from '@layout/components/splash-screen-web/splash-screen-web.component';
import { LayoutService } from '@layout/layout.service';
import * as Sentry from '@sentry/angular';
import { environment } from '../environments/environment';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TuiDialogModule, TuiRootModule } from '@taiga-ui/core';
import { register } from 'swiper/element/bundle';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppUpdateService } from '@core/app-update.service';
import { createAppUpdateModal } from '@shared/components/app-update/app-update-modal';
import { ChatMessageListenerService } from '@pages/chat/chat-message-listener.service';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { AuthService } from '@auth/auth.service';
import { NotificationContainerComponent } from '@ds/in-app-notification/notification-container.component';
import { ModalSheetContainerComponent } from '@ds/modal-sheet/modal-sheet-container.component';

register();
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp,
    IonRouterOutlet,
    SplashScreenWebComponent,
    NgClass,
    TuiRootModule,
    TuiDialogModule,
    NotificationContainerComponent,
    ModalSheetContainerComponent,
  ],
  providers:
    environment.ENVIRONMENT_NAME !== 'local'
      ? [
          {
            provide: ErrorHandler,
            useValue: Sentry.createErrorHandler({
              showDialog: false,
              logErrors: true,
            }),
          },
          {
            provide: Sentry.TraceService,
            deps: [Router],
          },
          {
            provide: APP_INITIALIZER,
            useFactory: () => () => {},
            deps: [Sentry.TraceService],
            multi: true,
          },
        ]
      : [],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly layout = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly appUpdateService = inject(AppUpdateService);
  private readonly appUpdateModal = createAppUpdateModal();
  private readonly chatMessageListener = inject(ChatMessageListenerService);
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly ngUnsubscribe$ = new Subject<void>();
  private readonly subscriptions = new Subscription();
  private readonly isUserLoggedIn$ = toObservable(
    this.authService.isUserLoggedIn,
  );

  showSplashScreen = signal(true);

  constructor(
    private translocoService: TranslocoService,
    @Inject(DOCUMENT) private document: Document,
    _service: BreadcrumbService,
  ) {
    toObservable(this.layout.showSplashScreen)
      .pipe(takeUntilDestroyed(), debounceTime(4000))
      .subscribe((v) => {
        this.showSplashScreen.set(v);
      });
  }

  ngOnInit(): void {
    this.translocoService.langChanges$.subscribe((lang) => {
      this.document.documentElement.lang = lang;
      this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
    const lang = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) ?? 'ar';
    this.translocoService.setActiveLang(lang);
    this.document.documentElement.lang = lang;
    this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.initializeStatusBar();
    this.setCapGoDelay();
    this.checkAppVersion();
    this.initializeChatCleanup();
  }

  /**
   * Sets up cleanup handlers for chat when user logs out.
   * Chat listeners are now initialized lazily via the chat guard when user visits chat page.
   */
  private initializeChatCleanup(): void {
    this.subscriptions.add(
      this.isUserLoggedIn$.subscribe((isLoggedIn) => {
        if (!isLoggedIn) {
          this.cleanupChatListeners();
        }
      }),
    );

    this.subscriptions.add(
      this.chatMessageListener.fetchUnreadCount$.subscribe(() => {
        if (
          this.authService.isUserLoggedIn() &&
          this.chatService.isCometChatLoggedIn()
        ) {
          this.chatService.fetchUnreadCountFromCometChat();
        }
      }),
    );
  }

  private cleanupChatListeners(): void {
    this.chatMessageListener.destroyListener();
    this.chatService.setTotalUnreadCount(0);
  }

  private async initializeStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.show();

    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: true });
    }
  }

  async setCapGoDelay() {
    await CapacitorUpdater.setMultiDelay({
      delayConditions: [
        {
          kind: 'background',
          value: '30000',
        },
      ],
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
    this.subscriptions.unsubscribe();
    this.chatMessageListener.destroyListener();
  }

  private async checkAppVersion() {
    const platform = Capacitor.getPlatform();

    if (Capacitor.isNativePlatform()) {
      const { version, build } = await App.getInfo();
      this.performUpdateCheck(build, version, platform);
    } else {
      // Web platform - load version from assets
      this.appUpdateService.loadVersion().subscribe({
        next: ({ version, buildNumber }) => {
          this.performUpdateCheck(buildNumber, version, platform);
        },
        error: (error) => {
          console.error('Failed to load version info:', error);
        },
      });
    }
  }

  private performUpdateCheck(
    buildNumber: string,
    version: string,
    platform: string,
  ) {
    this.appUpdateService
      .checkForUpdate(buildNumber, version, platform)
      .subscribe(() => {
        if (this.appUpdateService.isUnderMaintenance()) {
          // open maintenance page
          if (this.appUpdateService.isReLoginRequired()) {
            localStorage.clear();
          }
          this.router.navigate(['/maintenance']);
        } else if (
          (this.appUpdateService.isUpdateAvailable() ||
            this.appUpdateService.isForceUpdate()) &&
          platform !== 'web'
        ) {
          if (this.appUpdateService.isForceUpdate()) {
            this.router.navigate(['/app-update']);
          } else {
            this.appUpdateModal();
          }
        }
      });
  }
}
