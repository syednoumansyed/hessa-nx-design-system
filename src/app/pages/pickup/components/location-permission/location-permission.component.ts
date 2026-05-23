import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesCheckboxModule } from '@ui-kit/hes-checkbox/hes-checkbox.module';
import { IonImg, IonButton } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { Capacitor } from '@capacitor/core';
import { LocationService } from '@shared/services/location.service';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import {
  AndroidSettings,
  NativeSettings,
  IOSSettings,
} from 'capacitor-native-settings';

@Component({
  selector: 'app-location-permission',
  standalone: true,
  templateUrl: './location-permission.component.html',
  imports: [
    TranslocoDirective,
    CommonModule,
    HesCheckboxModule,
    IonImg,
    IonButton,
    HesButtonModule,
  ],
})
export class LocationPermissionComponent implements OnInit, OnDestroy {
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);
  readonly isNativePlatform = Capacitor.isNativePlatform();

  // UI state
  private resumeListener?: PluginListenerHandle;
  private readonly targetRoute = '/pickup';

  ngOnInit() {
    this.initPermissionFlow();
    // Re-check when app returns from background (user may have changed permission in Settings)
    App.addListener('resume', async () => {
      await this.checkPermissionAfterResume();
    }).then((l) => (this.resumeListener = l));
  }

  ngOnDestroy() {
    this.resumeListener?.remove();
  }

  private async initPermissionFlow(userInitiated = false) {
    if (this.locationService.hasPermission()) {
      await this.onPermissionGranted();
      return;
    }

    const granted = await this.locationService.requestLocationPermission();

    if (granted) {
      await this.onPermissionGranted();
    }
  }

  private async onPermissionGranted() {
    await this.locationService.startWatching();
    this.safeNavigateToPickup();
  }

  private async checkPermissionAfterResume() {
    try {
      const status = await Geolocation.checkPermissions();
      if (
        status.location === 'granted' &&
        !this.locationService.hasPermission()
      ) {
        await this.locationService.requestLocationPermission();
      }
      if (status.location === 'granted') {
        await this.onPermissionGranted();
      }
    } catch (e) {
      console.warn('Could not re-check permission after resume', e);
    }
  }

  private safeNavigateToPickup() {
    if (this.router.url !== this.targetRoute) {
      this.router.navigate([this.targetRoute], { replaceUrl: true });
    } else {
      this.router.navigateByUrl(this.targetRoute, { replaceUrl: true });
    }
  }

  async openSettings() {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') {
      await NativeSettings.openIOS({ option: IOSSettings.App });
    } else if (platform === 'android') {
      await NativeSettings.openAndroid({
        option: AndroidSettings.ApplicationDetails,
      });
    }
  }
}
