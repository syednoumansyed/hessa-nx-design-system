import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  IonContent,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { Delegate } from '../../data-access/delegate.interface';
import { DelegateService } from '../../data-access/delegate.service';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesLogService } from '@shared/services/hes-log.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import {
  faArrowDownToLine,
  faShareNodes,
} from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-delegate-qr-sheet',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    IonSpinner,
    DsButtonComponent,
    DsIconComponent,
    NgClass,
    HesDatePipe,
  ],
  templateUrl: './delegate-qr-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DelegateQrSheetComponent implements OnInit {
  private readonly delegateService = inject(DelegateService);
  private readonly modalController = inject(ModalController);
  private readonly toasterService = inject(HesToasterService);
  private readonly logService = inject(HesLogService);
  private readonly transloco = inject(TranslocoService);

  @Input() delegate!: Delegate;

  // Icons
  readonly downloadIcon = faArrowDownToLine;
  readonly shareIcon = faShareNodes;

  // State
  qrCode = signal<string | null>(null);
  isLoading = signal(false);

  // Student chip colors
  private readonly chipColors = [
    'bg-pastels-indigo-250',
    'bg-pastels-emerald-250',
    'bg-pastels-magenta-250',
    'bg-pastels-cyan-250',
    'bg-pastels-yellow-250',
  ];

  ngOnInit(): void {
    if (this.delegate.qrCode) {
      this.qrCode.set(this.delegate.qrCode);
    } else {
      this.loadDelegateWithQrCode();
    }
  }

  private loadDelegateWithQrCode(): void {
    this.isLoading.set(true);
    this.delegateService.getDelegateById(this.delegate.id).subscribe({
      next: (delegate) => {
        this.delegate = delegate;
        this.qrCode.set(delegate.qrCode);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.logService.error('Failed to load delegate:', error);
        this.toasterService.error('Failed to load QR code');
        this.isLoading.set(false);
      },
    });
  }

  getStudentChipColor(index: number): string {
    return this.chipColors[index % this.chipColors.length];
  }

  dismiss(): void {
    this.modalController.dismiss();
  }

  async downloadQrCode(): Promise<void> {
    const qrCodeData = this.qrCode();
    if (!qrCodeData || !this.delegate) return;

    try {
      // Convert SVG to PNG with higher quality
      const pngDataUrl = await this.svgToPng(qrCodeData);

      if (Capacitor.isNativePlatform()) {
        const base64Data = this.extractBase64Data(pngDataUrl);
        const fileName = `delegate-qr-${this.delegate.nationalId}.png`;

        // Save to Documents directory
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });

        // On iOS, use Share API to let user save to Photos
        // On Android, file is saved and accessible
        const platform = Capacitor.getPlatform();
        if (platform === 'ios') {
          // Use share dialog so user can save to Photos
          await Share.share({
            title: this.transloco.translate(
              `dismissal.qr_code_for_with_delegate_name.title`,
              { delegate_name: this.delegate.displayName },
            ),
            url: result.uri,
          });
        } else {
          // Android: Show success message
          this.toasterService.success(
            this.transloco.translate('global.image_download_success.txt'),
          );
        }
      } else {
        // Web: Use download link
        const link = document.createElement('a');
        link.href = pngDataUrl;
        link.download = `delegate-qr-${this.delegate.nationalId}.png`;
        link.click();
      }
    } catch (error) {
      this.logService.error('Failed to download QR code:', error);
    }
  }

  async shareQrCode(): Promise<void> {
    const qrCodeData = this.qrCode();
    if (!qrCodeData || !this.delegate) return;

    const message = this.transloco.translate(
      'dismissal.qr_code_for_with_delegate_name.title',
      { delegate_name: this.delegate.displayName },
    );

    try {
      // Convert SVG to PNG with higher quality
      const pngDataUrl = await this.svgToPng(qrCodeData);

      if (Capacitor.isNativePlatform()) {
        const base64Data = this.extractBase64Data(pngDataUrl);
        const fileName = `delegate-qr-${this.delegate.nationalId}.png`;

        // Write to Documents directory (more reliable than Cache)
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });

        const platform = Capacitor.getPlatform();
        let shareUrl = result.uri;

        // Android needs content:// URI from FileProvider
        if (platform === 'android') {
          const { uri } = await Filesystem.getUri({
            directory: Directory.Documents,
            path: fileName,
          });
          shareUrl = uri;
        }
        // iOS works with the absolute path from result.uri

        await Share.share({
          title: message,
          text: message,
          url: shareUrl,
        });
      } else {
        // Web: Use native share API if available
        if (navigator.share && navigator.canShare) {
          const blob = await this.base64ToBlob(pngDataUrl);
          const file = new File(
            [blob],
            `delegate-qr-${this.delegate.nationalId}.png`,
            {
              type: 'image/png',
            },
          );
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: message,
              text: message,
              files: [file],
            });
          } else {
            this.downloadQrCode();
          }
        } else {
          this.downloadQrCode();
        }
      }
    } catch (error) {
      this.logService.error('Failed to share QR code:', error);
    }
  }

  private extractBase64Data(dataUrl: string): string {
    const base64Index = dataUrl.indexOf('base64,');
    if (base64Index !== -1) {
      return dataUrl.substring(base64Index + 7);
    }
    return dataUrl;
  }

  private async base64ToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  /**
   * Converts SVG data URL to PNG format with high quality
   * @param svgDataUrl - The SVG data URL
   * @param width - Width of the output PNG (default: 2000 for high quality)
   * @param height - Height of the output PNG (default: 2000 for high quality)
   * @returns Promise with PNG data URL
   */
  private async svgToPng(
    svgDataUrl: string,
    width = 2000,
    height = 2000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        // Draw the SVG image with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        // Convert to PNG with maximum quality
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = () => reject(new Error('Failed to load SVG image'));
      img.src = svgDataUrl;
    });
  }
}
