import { Injectable } from '@angular/core';
import { Client } from '@microsoft/microsoft-graph-client';
import { MicrosoftAuthService } from './microsoft-auth';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { InteractionType } from '@azure/msal-browser';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class MeetingService {
  constructor(private authService: MicrosoftAuthService) {}

  async createMeeting(subject: string): Promise<string | null> {
    const auth = await this.authService.login();
    if (!auth) throw new Error('Authentication failed.');

    const onlineMeeting = { subject };

    try {
      // ✅ Native: we already have an accessToken from MsAuthPlugin
      if (Capacitor.isNativePlatform()) {
        if (!auth.accessToken)
          throw new Error('No accessToken from native login');

        const graphClient = Client.init({
          authProvider: (done) => done(null, auth.accessToken),
        });

        const meeting = await graphClient
          .api('/me/onlineMeetings')
          .version('beta')
          .post(onlineMeeting);

        return meeting?.joinWebUrl ?? null;
      }

      // ✅ Web: use MSAL browser provider (account-based)
      if (!auth.account) throw new Error('No account from web login');

      const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
        this.authService.getPca(),
        {
          account: auth.account,
          interactionType: InteractionType.Popup,
          scopes: ['User.Read', 'OnlineMeetings.ReadWrite'], // IMPORTANT
        },
      );

      const graphClient = Client.initWithMiddleware({ authProvider });

      const meeting = await graphClient
        .api('/me/onlineMeetings')
        .version('beta')
        .post(onlineMeeting);

      return meeting?.joinWebUrl ?? null;
    } catch (e: any) {
      // log something meaningful
      console.error('Error creating meeting:', e?.message ?? e, e);
      throw e;
    }
  }
}
