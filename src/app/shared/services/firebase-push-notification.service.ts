import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  PushNotificationSchema,
} from '@capacitor/push-notifications';
import { ApiUrl } from '@shared/utils/api-url.util';
import { DeepLinkService } from '@core/services/deep-link.service';
import { Router } from '@angular/router';
import { NotificationDestination } from '@shared/enums';
import { NotificationService } from '@ds/in-app-notification/notification.service';
import { resolveNotificationIcon } from '@ds/in-app-notification/notification-icon-resolver';

@Injectable({
  providedIn: 'root',
})
export class FirebasePushNotificationService {
  private readonly http = inject(HttpClient);
  private readonly deepLinkService = inject(DeepLinkService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly ngZone = inject(NgZone);

  updateFCMToken(token: string) {
    this.http
      .put(`${ApiUrl.v1BE}/users/fcm-token`, { fcmToken: token })
      .subscribe();
  }
  public initPush() {
    if (Capacitor.getPlatform() !== 'web') {
      this.registerNotifications();
    }
  }
  registerNotifications = async () => {
    await this.addListeners();
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      return;
    }

    await PushNotifications.register();
  };

  addListeners = async () => {
    await PushNotifications.addListener('registration', (token) => {
      this.updateFCMToken(token.value);
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('push notification Registration error: ', err.error);
    });

    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        // Run inside Angular's zone to ensure proper change detection
        // This is critical when the app resumes from background
        this.ngZone.run(() => {
          const data = action.notification.data;
          console.log('Notification action performed: ', JSON.stringify(data));
          try {
            const destination = this.deepLinkService.handleNotificationClick(
              data.destination as NotificationDestination,
              data.metadata || data,
            );

            this.deepLinkService.navigateToDestination(destination);
          } catch (error) {
            console.error('Error handling notification click:', error);
            // Fallback to home/dashboard
            this.router.navigate(['/home']); // let's take to the home page because we don't have any other destination
            // todo: replace above with notifications path once ready
          }
        });
      },
    );

    await PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
        // Run inside Angular's zone to ensure proper change detection
        this.ngZone.run(() => {
          // By having this listener, the OS notification is automatically blocked.
          // We will use it to show in app notifications
          console.log(
            'Notification pushNotificationReceived: ',
            JSON.stringify(notification),
          );
          this.handleMessage(notification);
        });
      },
    );
  };

  handleMessage(payload: any) {
    console.log('Payload received: ', JSON.stringify(payload));
    const title = payload?.title ?? 'Alert';
    const body = payload?.body ?? '';
    const resource = payload.data?.resource;
    const destination = payload.data?.destination as NotificationDestination;
    const metadata = payload.data?.metadata || payload.data;
    const iconName = resolveNotificationIcon(resource);

    this.notificationService.show({
      title,
      message: body,
      icon: iconName,
      destination,
      metadata,
      // duration: 5000, // optional override
    });
  }

  async unregister() {
    await PushNotifications.unregister();
  }
}
