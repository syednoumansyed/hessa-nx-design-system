import { Injectable, signal, computed, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerTypeHint,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerScanOrientation,
} from '@capacitor/barcode-scanner';
import { DsQrScannerService } from '@ds/qr-scanner';

export type ScanState = 'idle' | 'scanning' | 'success' | 'error';

export interface ScanResult {
  value: string;
  format: string;
}

@Injectable({
  providedIn: 'root',
})
export class QrScannerService {
  private readonly webScannerService = inject(DsQrScannerService);

  private readonly _scanState = signal<ScanState>('idle');
  private readonly _lastResult = signal<ScanResult | null>(null);
  private readonly _errorMessage = signal<string | null>(null);

  readonly scanState = this._scanState.asReadonly();
  readonly lastResult = this._lastResult.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  readonly isScanning = computed(() => this._scanState() === 'scanning');
  readonly hasError = computed(() => this._scanState() === 'error');
  readonly isSuccess = computed(() => this._scanState() === 'success');

  /**
   * Scans a QR code using the appropriate scanner based on platform.
   * - Native platforms (iOS/Android): Uses Capacitor barcode scanner
   * - Web platform: Uses web-based ZXing scanner with custom UI
   *
   * @returns Promise resolving to scan result or null if cancelled
   */
  async scanQrCode(): Promise<ScanResult | null> {
    if (Capacitor.isNativePlatform()) {
      return this.scanNative();
    } else {
      return this.scanWeb();
    }
  }

  /**
   * Native QR scanning using Capacitor barcode scanner.
   * Opens the native camera scanner UI.
   */
  private async scanNative(): Promise<ScanResult | null> {
    try {
      this._scanState.set('scanning');
      this._errorMessage.set(null);

      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
        scanOrientation: CapacitorBarcodeScannerScanOrientation.PORTRAIT,
        scanInstructions: '',
        scanButton: false,
      });

      if (result.ScanResult) {
        const scanResult: ScanResult = {
          value: result.ScanResult,
          format: 'QR_CODE',
        };
        this._lastResult.set(scanResult);
        this._scanState.set('success');
        return scanResult;
      } else {
        this._scanState.set('idle');
        return null;
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to scan QR code';
      this._errorMessage.set(errorMsg);
      this._scanState.set('error');
      console.error('QR Scanner Error:', error);
      throw error instanceof Error ? error : new Error(errorMsg);
    }
  }

  /**
   * Web QR scanning using the design system's web scanner component.
   * Opens a full-screen modal with camera access and custom UI.
   */
  private async scanWeb(): Promise<ScanResult | null> {
    try {
      this._scanState.set('scanning');
      this._errorMessage.set(null);

      const result = await this.webScannerService.scan({
        title: 'Scan QR Code',
        subtitle: 'Point your camera at a QR code and capture it.',
        showCloseButton: true,
      });

      if (result.role === 'success' && result.data) {
        const scanResult: ScanResult = {
          value: result.data.value,
          format: result.data.format,
        };
        this._lastResult.set(scanResult);
        this._scanState.set('success');
        return scanResult;
      } else if (result.role === 'error') {
        const errorMsg = result.error || 'Failed to scan QR code';
        this._errorMessage.set(errorMsg);
        this._scanState.set('error');

        // Check for permission denied
        if (
          errorMsg.toLowerCase().includes('permission') ||
          errorMsg.toLowerCase().includes('denied')
        ) {
          throw new Error('Camera permission denied');
        }

        throw new Error(errorMsg);
      } else {
        // User cancelled
        this._scanState.set('idle');
        return null;
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to scan QR code';

      // Only update state if not already set
      if (this._scanState() === 'scanning') {
        this._errorMessage.set(errorMsg);
        this._scanState.set('error');
      }

      console.error('QR Scanner Error:', error);
      throw error instanceof Error ? error : new Error(errorMsg);
    }
  }

  /**
   * Checks if the current platform is native (iOS/Android).
   */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Gets the current platform name.
   */
  getPlatform(): 'ios' | 'android' | 'web' {
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  }

  resetState(): void {
    this._scanState.set('idle');
    this._lastResult.set(null);
    this._errorMessage.set(null);
  }
}
