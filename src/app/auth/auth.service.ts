import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  computed,
  inject,
  signal,
  runInInjectionContext,
} from '@angular/core';
import { Router } from '@angular/router';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { faUserPlus } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoService } from '@jsverse/transloco';
import { UserType } from '@shared/enums';
import { FeedbackService } from '@shared/services/feedback.service';
import { FirebasePushNotificationService } from '@shared/services/firebase-push-notification.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Observable, finalize, first, map, tap } from 'rxjs';
import {
  ILoginPayload,
  ILoginResponse,
  ILoginVerifyPayload,
  ILoginVerifyResponse,
  ISwitchPayload,
  PlatformOwnerCheckResponseDTO,
  UserInfo,
  UserSettings,
  IGenericResponse,
} from './model';

import { Injector } from '@angular/core';
import { faWarning } from '@fortawesome/pro-light-svg-icons';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SocketService } from '@shared/services/socket.service';
import { ThemeManagerService } from '../shared/services/theme-manager.service';
import { LOGIN_VERIFY_RESPONSE_MAP_FROM_DTO } from '@pages/login/data-access/user-profile-dto-transform';
import { LoginVerifyDTO } from '@pages/login/data-access/user-profile-dto';
import { getLocalizedFullName } from '@utils/localization.util';
import { ChatService } from '@pages/chat/data-access/chat.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  faUserPlus = faUserPlus;

  private readonly socketService = inject(SocketService);
  private httpClient = inject(HttpClient);
  private feedbackService = inject(FeedbackService);
  private translocoService = inject(TranslocoService);
  private readonly toaster = inject(HesToasterService);
  private themeService = inject(ThemeManagerService);
  private academicYearScopeService = inject(AcademicYearsScopeService);
  private firebasePushNotificationService = inject(
    FirebasePushNotificationService,
  );
  private router = inject(Router);
  private injector = inject(Injector);
  private chatService = inject(ChatService);

  isLoggedInAsOtherUser = signal<boolean>(
    !!localStorage.getItem('login_as_data'),
  );
  isUserLoggedIn = signal<boolean>(
    JSON.parse(localStorage.getItem('isUserLoggedIn') ?? 'false'),
  );

  private _user = signal<UserInfo | null>(
    JSON.parse(localStorage.getItem('user') ?? 'null'),
  );

  user = computed(() => {
    const user = this._user();
    if (!user) {
      return null;
    }
    user.displayName = getLocalizedFullName({
      arFullName: this._user()?.arFullName ?? null,
      enFullName: this._user()?.enFullName ?? null,
    });
    return user;
  });

  readonly isUserPersonnel = computed<boolean>(() => {
    return this.user()?.type === UserType.PERSONNEL;
  });

  readonly isUserStudent = computed<boolean>(() => {
    return this.user()?.type === UserType.STUDENT;
  });

  readonly isUserGuardian = computed<boolean>(() => {
    return this.user()?.type === UserType.GUARDIAN;
  });

  private readonly userTypeTranslationKeys: Record<UserType, string> = {
    [UserType.STUDENT]: 'global.student.txt',
    [UserType.GUARDIAN]: 'global.guardian.txt',
    [UserType.PERSONNEL]: 'global.personnel.txt',
  };

  readonly typeDisplay = computed(() => {
    const user = this.user();

    if (!user) {
      return '';
    }

    const key = this.userTypeTranslationKeys[user.type];

    return key ? this.translocoService.translate(key) : user.type;
  });

  private readonly _redirectUri = signal<string | null>(null);
  redirectUri = this._redirectUri.asReadonly();

  login(payload: ILoginPayload) {
    return this.httpClient.post<ILoginResponse>(
      `${ApiUrl.v2AUTH}/login`,
      payload,
    );
  }

  studentLogin(payload: ILoginPayload) {
    return this.httpClient.post<ILoginVerifyResponse>(
      `${ApiUrl.v1Auth}/login`,
      payload,
    );
  }

  verifyOtp(
    payload: ILoginVerifyPayload,
    headers?: { [key: string]: string },
    configuration?: { isOnSuccessRedirection?: boolean },
  ) {
    const { isOnSuccessRedirection = true } = configuration || {};
    return this.httpClient
      .post<LoginVerifyDTO>(`${ApiUrl.v2AUTH}/login/verify`, payload, {
        headers,
      })
      .pipe(
        map((res) => LOGIN_VERIFY_RESPONSE_MAP_FROM_DTO.loginResponse(res)),
      );
  }

  async displayLoginConfirmationDialog(
    userId: number,
    profileId: number,
    type: UserType,
  ) {
    return await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'global.login_as_user.title',
        ),
        modalMessage: this.translocoService.translate(
          'global.login_as_user.txt',
        ),
        primaryBtnStr: this.translocoService.translate('global.login.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
        icon: faWarning,
      },
      () => {
        this.backupOriginalProfile();
        this.loginAsUser({
          userId,
          id: profileId,
          userType: type,
        })
          .pipe(first())
          .subscribe({
            error: (err) => {
              this.toaster.showBackendError(err);
              this.clearBackupProfile();
            },
          });
      },
    );
  }

  loadUserTypeProfile(userType: UserType, profileId: number) {
    const user = this.user();
    if (!user) {
      return;
    }

    switch (userType) {
      case UserType.PERSONNEL:
        return;
      case UserType.STUDENT:
        return;
      case UserType.GUARDIAN:
        return;
    }
  }

  backupOriginalProfile() {
    const backupData = {
      user: localStorage.getItem('user'),
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      chatAuthToken: localStorage.getItem('chatAuthToken'),
      path: this.router.url,
      selectedSchoolStructureItem: localStorage.getItem(
        'selectedSchoolStructureItem',
      ),
    };
    localStorage.setItem('login_as_data', JSON.stringify(backupData));
  }

  public async restoreOriginalProfileData() {
    // Logout from CometChat before restoring original profile
    // This ensures the impersonated user's session is cleared
    // The original user will login lazily when they visit the chat page
    await this.chatService.logoutFromCometChat();

    const backupData = JSON.parse(localStorage.getItem('login_as_data') ?? '');
    localStorage.setItem('user', backupData.user ?? '');
    localStorage.setItem('accessToken', backupData.accessToken ?? '');
    localStorage.setItem('refreshToken', backupData.refreshToken ?? '');
    localStorage.setItem('chatAuthToken', backupData.chatAuthToken ?? '');
    localStorage.setItem(
      'selectedSchoolStructureItem',
      backupData.selectedSchoolStructureItem ?? '',
    );
    localStorage.removeItem('login_as_data');
    this.isLoggedInAsOtherUser.set(false);
    this._user.set(JSON.parse(backupData.user ?? 'null'));
    this.isUserLoggedIn.set(true);

    runInInjectionContext(this.injector, () => {
      const rbacService = inject(RoleBaseAccessControlService);
      rbacService
        .fetchPermission()
        .pipe(
          finalize(() => {
            this.navigateToOriginalPath(backupData.path);
          }),
        )
        .subscribe();
    });
  }

  private navigateToOriginalPath(path: string) {
    this.router.navigate([path]).then(() => {
      window.location.reload();
    });
  }

  clearBackupProfile() {
    localStorage.removeItem('login_as_data');
    this.isLoggedInAsOtherUser.set(false);
  }

  public loginAsUser(payload: ISwitchPayload) {
    return this.httpClient
      .post<ILoginVerifyResponse>(`${ApiUrl.v2AUTH}/login-as-user`, {
        userId: this.user()?.id,
        ...payload,
      })
      .pipe(
        tap(async (resp) => {
          // Logout from CometChat before switching users to ensure clean state
          // The new user will login lazily when they visit the chat page
          await this.chatService.logoutFromCometChat();

          this.setSession(resp);
          this.isLoggedInAsOtherUser.set(true);
          this.router.navigate(['/']).then(() => {
            window.location.reload();
          });
        }),
      );
  }

  public switchProfile(payload: ISwitchPayload) {
    return this.httpClient
      .post<ILoginVerifyResponse>(`${ApiUrl.v2AUTH}/switch-profile`, {
        ...payload,
        userId: this.user()?.id,
      })
      .pipe(
        tap((resp) => {
          this.setSession(resp);
        }),
      );
  }

  refreshToken() {
    return this.httpClient
      .post<ILoginVerifyResponse>(`${ApiUrl.v2AUTH}/refresh`, {
        userId: this.user()?.id,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data?.token) {
            // Update tokens in localStorage
            localStorage.setItem(
              'accessToken',
              response.data.token.accessToken,
            );
            localStorage.setItem(
              'refreshToken',
              response.data.token.refreshToken,
            );
            localStorage.setItem(
              'chatAuthToken',
              response.data.token.chatAuthToken,
            );
          }
        }),
      );
  }

  public redirect() {
    this.router.navigateByUrl(this.redirectUri() ?? 'home');
    this.updateRedirectUri(null);
  }

  private callLogoutApi() {
    return this.httpClient.put<IGenericResponse>(
      `${ApiUrl.v1BE}/users/logout`,
      {},
    );
  }

  logout(isReload = true) {
    if (!this.isLoggedInAsOtherUser()) {
      // Call the logout API before clearing data
      this.callLogoutApi()
        .pipe(
          finalize(() => {
            // Navigate to login and clear data regardless of API success/failure
            this.cleanup(isReload);
          }),
        )
        .subscribe({
          error: (error) => {
            // Log the error but don't prevent logout
            console.error('Logout API error:', error);
          },
        });
    } else {
      this.cleanup(isReload);
    }
  }

  cleanup(isReload: boolean) {
    this.router.navigate(['login']).then(async () => {
      await this.chatService.logoutFromCometChat();
      this.socketService.disconnect();
      this.isUserLoggedIn.set(false);
      this.academicYearScopeService.resetState();
      this.clearData();
      if (isReload) {
        window.location.reload();
      }
    });
  }

  clearData() {
    this.isUserLoggedIn.set(false);
    this._user.set(null);
    this.clearBackupProfile();
    localStorage.removeItem('isUserLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('chatAuthToken');
    localStorage.removeItem('selectedSchoolStructureItem');
  }

  public setSession(res: ILoginVerifyResponse) {
    localStorage.setItem('accessToken', res.data.token.accessToken);
    localStorage.setItem('refreshToken', res.data.token.refreshToken);
    localStorage.setItem('chatAuthToken', res.data.token.chatAuthToken);
    if (
      res.data.userInfo.type === UserType.STUDENT ||
      res.data.userInfo.type === UserType.GUARDIAN
    ) {
      this.themeService.setStudent();
    } else {
      this.themeService.setPersonnel();
    }
    this.isUserLoggedIn.set(true);
    localStorage.setItem('isUserLoggedIn', 'true');
    this._user.set(res.data.userInfo);
    localStorage.setItem('user', JSON.stringify(res.data.userInfo));
    this.syncLanguagePreference();
  }

  private syncLanguagePreference() {
    const selectedLanguage = localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY);
    if (selectedLanguage) {
      this.httpClient
        .put(`${ApiUrl.v1BE}/user-settings`, { selectedLanguage })
        .subscribe();
    }
  }

  updateRedirectUri(url: string | null) {
    this._redirectUri.set(url);
  }

  // student login setup methods
  async onSetupAccount(res: ILoginVerifyResponse) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate('login.setup.title'),
        modalMessage: this.translocoService.translate('login.setup.txt'),
        primaryBtnStr: this.translocoService.translate('login.setup.btn'),
        secondaryBtnStr: this.translocoService.translate('login.skip.btn'),
        icon: faUserPlus,
      },
      () => {
        this.router.navigate(['login', 'setup']);
      },
      () => {
        this.setSession(res);
        this.redirect();
      },
    );
  }

  private checkLanguage(settings?: UserSettings) {
    // If the user has a selected language, set it in local storage and update the transloco service
    if (settings && settings.selectedLanguage !== null) {
      if (
        settings.selectedLanguage !==
        localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY)
      ) {
        localStorage.setItem(
          LANGUAGE_LOCAL_STORAGE_KEY,
          settings.selectedLanguage,
        );
        this.translocoService.setActiveLang(settings.selectedLanguage);
      }
    }
  }

  platformOwnerCheck(): Observable<PlatformOwnerCheckResponseDTO['data']> {
    return this.httpClient
      .get<PlatformOwnerCheckResponseDTO>(
        `${ApiUrl.v1Auth}/platform-owner-check`,
      )
      .pipe(map((resp) => resp.data));
  }
}
