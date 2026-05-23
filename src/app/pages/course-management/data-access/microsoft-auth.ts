import { Injectable } from '@angular/core';
import {
  PublicClientApplication,
  AuthenticationResult,
  AccountInfo,
  Configuration,
} from '@azure/msal-browser';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';
import { MsAuthPlugin } from '@recognizebv/capacitor-plugin-msauth'; // Import the native plugin

@Injectable({
  providedIn: 'root',
})
export class MicrosoftAuthService {
  private pca: PublicClientApplication;

  // Scopes required for Teams Link creation
  private readonly scopes = ['User.Read', 'OnlineMeetings.ReadWrite'];

  constructor() {
    const config: Configuration = {
      auth: {
        clientId: environment.MICROSOFT_APPLICATION_CLIENT_ID,
        authority: `${environment.MICROSOFT_AUTHORITY}${environment.MICROSOFT_TENANT_ID}`,
        redirectUri: Capacitor.isNativePlatform()
          ? `msauth.${environment.APP_ID}://auth`
          : environment.FE_BASE_URL,
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false,
      },
    };

    this.pca = new PublicClientApplication(config);
    this.pca.initialize();
  }

  async login(): Promise<any> {
    if (Capacitor.isNativePlatform()) {
      return this.loginNative();
    } else {
      return this.loginWeb();
    }
  }

  getPca() {
    return this.pca;
  }

  private async loginNative() {
    try {
      // The plugin handles the browser opening and the redirect callback internally
      const result = await MsAuthPlugin.login({
        clientId: environment.MICROSOFT_APPLICATION_CLIENT_ID,
        tenant: environment.MICROSOFT_TENANT_ID, // Use 'common' if multi-tenant
        domainHint: '',
        scopes: this.scopes,
        keyHash: '8fWd9p4HJc5W3CnPFaAdPfXq9UQ=',
      });

      console.log('Native Login Success:', result);
      // Result contains accessToken, idToken, and expires
      return result;
    } catch (error) {
      console.error('Native Login Error:', error);
      throw error;
    }
  }

  private async loginWeb(): Promise<AuthenticationResult | null> {
    try {
      return await this.pca.acquireTokenPopup({
        scopes: this.scopes,
      });
    } catch (error) {
      console.error('Web Login Error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await MsAuthPlugin.logout({
        clientId: environment.MICROSOFT_APPLICATION_CLIENT_ID,
      });
    } else {
      const account = this.pca.getAllAccounts()[0];
      if (account) await this.pca.logoutPopup({ account });
    }
  }
}
