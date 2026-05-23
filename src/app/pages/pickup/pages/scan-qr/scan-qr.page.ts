import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { faCamera } from '@fortawesome/pro-solid-svg-icons';

/**
 * Camera Permission Error Page
 *
 * This page is displayed when camera permission is denied.
 * It informs users about the permission requirement and provides
 * a way to navigate to device settings to grant camera access.
 *
 * On web platforms, it shows instructions for enabling camera in browser settings.
 * On native platforms, it provides a button to open device settings.
 *
 * All QR scanning logic is handled in pickup-personnel.page.ts.
 */
@Component({
  selector: 'app-camera-permission-error',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    DsButtonComponent,
    DsIconComponent,
  ],
  templateUrl: './scan-qr.page.html',
})
export class CameraPermissionErrorPage implements OnInit {
  private readonly router = inject(Router);
  private readonly toaster = inject(HesToasterService);
  private readonly transloco = inject(TranslocoService);
  readonly cameraIcon = faCamera;

  // Platform detection
  readonly isNative = signal(false);
  readonly isWeb = computed(() => !this.isNative());

  ngOnInit(): void {
    this.isNative.set(Capacitor.isNativePlatform());
  }

  /**
   * Opens device settings to allow users to grant camera permission.
   * Only works on native platforms (iOS/Android).
   * After granting permission, users can navigate back to try scanning again.
   */
  async openSettings(): Promise<void> {
    if (!this.isNative()) {
      // On web, show a toast with instructions
      this.toaster.info(
        this.transloco.translate('general.camera_access_required.txt'),
      );
      return;
    }

    try {
      const { NativeSettings, AndroidSettings, IOSSettings } =
        await import('capacitor-native-settings');
      await NativeSettings.open({
        optionAndroid: AndroidSettings.ApplicationDetails,
        optionIOS: IOSSettings.App,
      });
    } catch (error) {
      this.toaster.error(this.transloco.translate('global.wrong_msg.title'));
    }
  }

  /**
   * Navigate back to personnel request page
   */
  goBack(): void {
    void this.router.navigate(['/pickup/personnel-request']);
  }
}
