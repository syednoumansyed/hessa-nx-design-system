import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat, Exception } from '@zxing/library';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { TranslocoService } from '@jsverse/transloco';

export interface DsQrScanResult {
  value: string;
  format: string;
}

export type DsQrScannerState = 'initializing' | 'ready' | 'scanning' | 'error';

@Component({
  selector: 'ds-qr-scanner',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, DsIconComponent],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
})
export class DsQrScannerComponent implements OnInit, OnDestroy {
  private readonly transloco = inject(TranslocoService);

  @ViewChild('scanner') scanner!: ElementRef;

  // Inputs
  readonly title = input<string>();
  readonly subtitle = input<string>();
  readonly showCloseButton = input<boolean>(true);

  // Outputs
  readonly scanSuccess = output<DsQrScanResult>();
  readonly scanError = output<string>();
  readonly closeClick = output<void>();

  // State
  readonly state = signal<DsQrScannerState>('initializing');
  readonly errorMessage = signal<string | null>(null);
  readonly hasPermission = signal<boolean | null>(null);
  readonly isTorchAvailable = signal<boolean>(false);
  readonly isTorchEnabled = signal<boolean>(false);
  readonly currentDevice = signal<MediaDeviceInfo | undefined>(undefined);

  // IMPORTANT: separate enable flag (prevents NotReadableError during switching)
  readonly scannerEnabled = signal<boolean>(false);

  // Computed
  readonly isReady = computed(() => this.state() === 'ready');
  readonly isScanning = computed(() => this.state() === 'scanning');
  readonly hasError = computed(() => this.state() === 'error');
  readonly isInitializing = computed(() => this.state() === 'initializing');
  readonly hasDevice = computed(() => this.currentDevice() !== undefined);

  // Turn scanner on ONLY when device exists + enabled
  readonly canScan = computed(() => this.hasDevice() && this.scannerEnabled());

  readonly displayTitle = computed(() => {
    return this.title() || this.transloco.translate('general.scan_qr_code.btn');
  });

  readonly displaySubtitle = computed(() => {
    return (
      this.subtitle() ||
      this.transloco.translate('general.point_your_camera.txt')
    );
  });

  readonly loadingText = computed(() => 'Initializing camera...');

  readonly closeIcon = faCircleXmark;

  // Scanner configuration
  readonly formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  readonly tryHarder = true;

  // Keep constraints modest for QR stability
  readonly videoConstraints: MediaTrackConstraints = {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  availableDevices: MediaDeviceInfo[] = [];
  private backCameras: MediaDeviceInfo[] = [];

  // --- Silent auto-correction logic ---
  private readonly LS_KEY = 'ds_qr_preferred_device_id';
  private isAutoCorrectingCamera = false;
  private autoCorrectionTimer: any = null;
  private currentBackCameraIndex = 0;
  private hasSuccessfulScan = false;

  // Time to wait before trying next camera (silent auto-correction)
  private readonly AUTO_CORRECTION_DELAY_MS = 3500;

  // Switching cooldowns (this is what prevents NotReadableError)
  private readonly DISABLE_BEFORE_SWITCH_MS = 250;
  private readonly ENABLE_AFTER_SWITCH_MS = 250;

  ngOnInit(): void {
    this.state.set('initializing');
    this.scannerEnabled.set(false);
  }

  ngOnDestroy(): void {
    this.stopAutoCorrection();
    this.scannerEnabled.set(false);
  }

  // --------- Cameras ----------

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;

    if (!devices || devices.length === 0) {
      this.handleNoCamerasFound();
      return;
    }

    // Filter and sort back cameras (main camera first, then others)
    this.backCameras = this.getSortedBackCameras(devices);

    if (this.backCameras.length === 0) {
      // No back cameras found, use last available device as fallback
      const fallback = devices[devices.length - 1];
      this.safeSwitchToDevice(fallback);
      return;
    }

    // Check if we have a previously successful camera stored
    const preferredId = this.getPreferredDeviceId();
    const preferredCamera = preferredId
      ? this.backCameras.find((d) => d.deviceId === preferredId)
      : null;

    if (preferredCamera) {
      // Use the previously successful camera
      this.currentBackCameraIndex = this.backCameras.indexOf(preferredCamera);
      this.safeSwitchToDevice(preferredCamera);
    } else {
      // Start with first back camera (likely main camera) and enable auto-correction
      this.currentBackCameraIndex = 0;
      const initialCamera = this.backCameras[0];
      this.safeSwitchToDevice(initialCamera);
      this.startAutoCorrectionTimer();
    }
  }

  onCamerasNotFound(): void {
    this.handleNoCamerasFound();
  }

  private handleNoCamerasFound(): void {
    const message = 'No cameras found on this device';
    this.state.set('error');
    this.errorMessage.set(message);
    this.scanError.emit(message);
  }

  // --------- Permission ----------

  onPermissionResponse(hasPermission: boolean | null): void {
    this.hasPermission.set(hasPermission);

    if (hasPermission === null) {
      const message =
        'Camera not supported in this browser context. Please use HTTPS or a supported browser.';
      this.state.set('error');
      this.errorMessage.set(message);
      this.scanError.emit(message);
      return;
    }

    if (!hasPermission) {
      this.scanError.emit('Camera permission denied');
      // Disable scanning if denied
      this.scannerEnabled.set(false);
      this.stopAutoCorrection();
    }
  }

  // --------- Scan ----------

  onScanSuccess(result: string): void {
    if (!result) return;

    // Stop auto-correction and remember successful camera
    if (!this.hasSuccessfulScan) {
      this.hasSuccessfulScan = true;
      this.stopAutoCorrection();

      // Save this camera as preferred for future sessions
      const successfulCamera = this.currentDevice();
      if (successfulCamera?.deviceId) {
        this.setPreferredDeviceId(successfulCamera.deviceId);
      }
    }

    this.state.set('scanning');
    this.scanSuccess.emit({ value: result, format: 'QR_CODE' });
  }

  onScanFailure(_error: Exception | undefined): void {
    // Silently ignore scan failures (common when no QR in frame)
  }

  onScanError(error: Error): void {
    const message = error.message || 'Scanner error';

    // Permission style errors
    const lower = message.toLowerCase();
    if (
      lower.includes('permission') ||
      lower.includes('denied') ||
      lower.includes('notallowed')
    ) {
      this.scanError.emit('Camera permission denied');
      this.scannerEnabled.set(false);
      this.stopAutoCorrection();
      return;
    }

    // NotReadableError: Could not start video source
    // Usually means camera is busy; we should slow down / fallback.
    if (
      lower.includes('notreadableerror') ||
      lower.includes('could not start video source')
    ) {
      // Stop auto-correction and fallback to first back camera with a longer restart delay
      this.stopAutoCorrection();
      const fallback =
        this.backCameras[0] ??
        this.availableDevices[this.availableDevices.length - 1];

      // Backoff restart
      this.safeSwitchToDevice(fallback, /*extraBackoff*/ 600);
      // Restart auto-correction after backoff
      setTimeout(() => this.startAutoCorrectionTimer(), 1000);
      return;
    }

    // Other errors
    this.state.set('error');
    this.errorMessage.set(message);
    this.scanError.emit(message);
  }

  // --------- Torch ----------

  onTorchCompatible(isCompatible: boolean): void {
    this.isTorchAvailable.set(isCompatible);
  }

  toggleTorch(): void {
    this.isTorchEnabled.update((v) => !v);
  }

  // --------- UI ----------

  onClose(): void {
    this.closeClick.emit();
  }

  // --------- Core fix: safe switching ----------

  /**
   * Safely switches camera by disabling scanner first, then re-enabling after a short delay.
   * This prevents NotReadableError on Android/WebView.
   */
  private safeSwitchToDevice(
    device: MediaDeviceInfo,
    extraBackoffMs = 0,
  ): void {
    if (!device) return;

    this.state.set('initializing');

    // 1) Disable scanner (releases stream)
    this.scannerEnabled.set(false);

    // 2) Wait a bit, set device
    setTimeout(() => {
      this.currentDevice.set(device);

      // 3) Wait a bit more, then enable scanner again
      setTimeout(() => {
        this.scannerEnabled.set(true);
        this.state.set('ready');
      }, this.ENABLE_AFTER_SWITCH_MS + extraBackoffMs);
    }, this.DISABLE_BEFORE_SWITCH_MS + extraBackoffMs);
  }

  // --------- Silent Auto-Correction ----------

  /**
   * Starts a timer that will silently switch to the next back camera
   * if no QR code is successfully scanned within the timeout period.
   * This keeps cycling through cameras until a successful scan occurs.
   */
  private startAutoCorrectionTimer(): void {
    // Don't start if already successful or only one camera available
    if (this.hasSuccessfulScan || this.backCameras.length <= 1) {
      return;
    }

    this.stopAutoCorrection();
    this.isAutoCorrectingCamera = true;

    this.autoCorrectionTimer = setTimeout(() => {
      if (this.hasSuccessfulScan || !this.isAutoCorrectingCamera) {
        return;
      }

      // Move to next back camera (cycle back to 0 if at end)
      this.currentBackCameraIndex =
        (this.currentBackCameraIndex + 1) % this.backCameras.length;

      const nextCamera = this.backCameras[this.currentBackCameraIndex];

      // Switch to next camera silently (no UI state change to "initializing")
      this.silentSwitchToDevice(nextCamera);

      // Schedule next auto-correction (continuous cycling until success)
      this.startAutoCorrectionTimer();
    }, this.AUTO_CORRECTION_DELAY_MS);
  }

  private stopAutoCorrection(): void {
    this.isAutoCorrectingCamera = false;

    if (this.autoCorrectionTimer) {
      clearTimeout(this.autoCorrectionTimer);
      this.autoCorrectionTimer = null;
    }
  }

  /**
   * Silently switches camera without changing the UI state.
   * Used for auto-correction to avoid flickering.
   */
  private silentSwitchToDevice(device: MediaDeviceInfo): void {
    if (!device) return;

    // Disable scanner briefly
    this.scannerEnabled.set(false);

    setTimeout(() => {
      this.currentDevice.set(device);

      setTimeout(() => {
        this.scannerEnabled.set(true);
      }, this.ENABLE_AFTER_SWITCH_MS);
    }, this.DISABLE_BEFORE_SWITCH_MS);
  }

  // --------- Helpers ----------

  /**
   * Gets and sorts back cameras with main camera first.
   * Sorting priority: "camera 0" > "camera 2" > others
   * This helps ensure the main (non-ultra-wide) camera is tried first.
   */
  private getSortedBackCameras(devices: MediaDeviceInfo[]): MediaDeviceInfo[] {
    const backs = devices.filter((d) => {
      const label = (d.label || '').toLowerCase();
      return (
        label.includes('facing back') ||
        label.includes('back') ||
        label.includes('rear') ||
        label.includes('environment')
      );
    });

    // Sort: prefer "camera 0" (usually main), then "camera 2", then others
    return [...backs].sort((a, b) => {
      const al = (a.label || '').toLowerCase();
      const bl = (b.label || '').toLowerCase();

      const getPriority = (label: string): number => {
        if (label.includes('camera 0')) return 0;
        if (label.includes('camera 2')) return 1;
        return 2;
      };

      return getPriority(al) - getPriority(bl);
    });
  }

  private getPreferredDeviceId(): string | null {
    try {
      return localStorage.getItem(this.LS_KEY);
    } catch {
      return null;
    }
  }

  private setPreferredDeviceId(deviceId: string): void {
    try {
      localStorage.setItem(this.LS_KEY, deviceId);
    } catch {
      // ignore
    }
  }
}
