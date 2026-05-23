import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, Observable, tap, throwError, map } from 'rxjs';
import { Router } from '@angular/router';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { IResponse } from '@shared/interfaces';
import { AppUpdateData } from '@shared/interfaces/app.update.interface';
import { ApiUrl } from '@shared/utils/api-url.util';

@Injectable({
  providedIn: 'root',
})
export class AppUpdateService {
  private readonly http = inject(HttpClient);
  public isUpdateAvailable = signal<boolean>(false);
  public isForceUpdate = signal<boolean>(false);
  public isUnderMaintenance = signal<boolean>(false);
  public isReLoginRequired = signal<boolean>(false);
  public androidPackageName = signal('sa.com.hessa.app');
  public iosAppId = signal('6737763248');
  private appStoreUrl = signal(`https://apps.apple.com/app/id${this.iosAppId}`);
  private playStoreUrl = signal(
    `https://play.google.com/store/apps/details?id=${this.androidPackageName}`,
  );

  private readonly router = inject(Router);

  constructor() {}

  checkForUpdate(
    buildNumber: string,
    versionNumber: string,
    platform: string,
  ): Observable<IResponse<AppUpdateData>> {
    return this.http
      .get<IResponse<AppUpdateData>>(
        `${ApiUrl.v1BE}/public/versions/check-for-update`,
        {
          params: {
            buildNumber,
            versionNumber,
            platform,
          },
        },
      )
      .pipe(
        tap((response) => {
          this.extractUrl(response.data);
          this.isForceUpdate.set(response.data.forceUpdateRequired);
          this.isUpdateAvailable.set(response.data.updateAvailable);
          this.isUnderMaintenance.set(response.data.underMaintenance);
          this.isReLoginRequired.set(response.data.reloginRequired);
        }),
        catchError((error) => {
          return throwError(error);
        }),
      );
  }

  async extractUrl(appUpdateData: AppUpdateData) {
    const platform = Capacitor.getPlatform();

    if (platform === 'android') {
      // Extract package name dynamically
      const packageNameMatch =
        appUpdateData.playStoreAppUrl.match(/id=([^&]+)/);
      const packageName = packageNameMatch
        ? packageNameMatch[1]
        : 'sa.com.hessa.app';
      this.playStoreUrl.set(appUpdateData.playStoreAppUrl);
      this.androidPackageName.set(packageName);
    } else if (platform === 'ios') {
      // Extract app ID dynamically
      const appIdMatch = appUpdateData.appStoreAppUrl.match(/id(\d+)/);
      const appId = appIdMatch ? appIdMatch[1] : '6737763248';
      this.appStoreUrl.set(appUpdateData.appStoreAppUrl);
    }
  }

  async openUpdatePage() {
    const platform = Capacitor.getPlatform();

    if (platform === 'android') {
      // Extract package name dynamically
      const marketUrl = `market://details?id=${this.androidPackageName()}`;
      const { value } = await AppLauncher.canOpenUrl({ url: marketUrl });

      if (value) {
        await AppLauncher.openUrl({ url: marketUrl });
      } else {
        await AppLauncher.openUrl({ url: this.playStoreUrl() }); // Fallback to backend URL
      }
    } else if (platform === 'ios') {
      // Extract app ID dynamically
      const appStoreUrlDirect = `itms-apps://itunes.apple.com/app/id/${this.iosAppId()}`;
      const canOpenAppStore = await AppLauncher.canOpenUrl({
        url: appStoreUrlDirect,
      });

      if (canOpenAppStore.value) {
        await AppLauncher.openUrl({ url: appStoreUrlDirect });
      } else {
        await AppLauncher.openUrl({ url: this.iosAppId() }); // Fallback to backend URL
      }
    }
  }

  loadVersion(): Observable<{ version: string; buildNumber: string }> {
    return this.http.get<{ version: string }>('/assets/json/version.json').pipe(
      map((response) => {
        const versionString = response.version;
        const parts = versionString.split('+');
        return {
          version: parts[0] || '',
          buildNumber: parts[1] || '',
        };
      }),
    );
  }
}
