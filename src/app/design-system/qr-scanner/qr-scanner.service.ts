import { inject, Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { DsQrScannerModalComponent } from './qr-scanner-modal.component';
import { DsQrScanResult } from './qr-scanner.component';

export interface DsQrScannerOptions {
  /**
   * Title displayed on the scanner screen
   * @default 'Scan QR Code'
   */
  title?: string;

  /**
   * Subtitle/instruction text
   * @default 'Point your camera at a QR code and capture it.'
   */
  subtitle?: string;

  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;
}

export interface DsQrScannerResult {
  /**
   * The role indicating how the scanner was dismissed
   * - 'success': QR code was successfully scanned
   * - 'cancel': User closed the scanner
   * - 'error': An error occurred
   */
  role: 'success' | 'cancel' | 'error';

  /**
   * The scan result data (only present when role is 'success')
   */
  data?: DsQrScanResult;

  /**
   * Error message (only present when role is 'error')
   */
  error?: string;
}

/**
 * Service for opening the web QR scanner as a full-screen modal.
 *
 * This service is intended for use on web platforms only. For native platforms,
 * use the native Capacitor barcode scanner instead.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await this.qrScannerService.scan();
 *
 * if (result.role === 'success' && result.data) {
 *   console.log('Scanned:', result.data.value);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom options
 * const result = await this.qrScannerService.scan({
 *   title: 'Scan Delegate QR',
 *   subtitle: 'Scan the delegate QR code to verify pickup authorization.'
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DsQrScannerService {
  private readonly modalCtrl = inject(ModalController);

  /**
   * Opens the QR scanner as a full-screen modal and returns the scan result.
   *
   * @param options - Configuration options for the scanner
   * @returns Promise resolving to the scan result
   */
  async scan(options: DsQrScannerOptions = {}): Promise<DsQrScannerResult> {
    const modal = await this.modalCtrl.create({
      component: DsQrScannerModalComponent,
      componentProps: {
        title: options.title ?? 'Scan QR Code',
        subtitle:
          options.subtitle ?? 'Point your camera at a QR code and capture it.',
        showCloseButton: options.showCloseButton ?? true,
      },
      cssClass: 'ds-qr-scanner-modal',
      showBackdrop: false,
      backdropDismiss: false,
    });

    await modal.present();

    // Wait for dismiss
    const { data, role } = await modal.onWillDismiss<DsQrScanResult | string>();

    if (role === 'success' && data && typeof data !== 'string') {
      return { role: 'success', data };
    } else if (role === 'error') {
      return {
        role: 'error',
        error: typeof data === 'string' ? data : 'Unknown error',
      };
    }

    return { role: 'cancel' };
  }
}
