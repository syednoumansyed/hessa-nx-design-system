import { Component, inject, Input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonSpinner } from '@ionic/angular/standalone';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { TranslocoPipe } from '@jsverse/transloco';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { HesFileService } from '@shared/services/hes-file.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { faXmark, faCircleArrowDown } from '@fortawesome/pro-regular-svg-icons';
import { isMobile } from '@shared/utils/platform';

@Component({
  selector: 'app-ds-pdf-viewer',
  templateUrl: './ds-pdf-viewer.component.html',
  styleUrls: ['./ds-pdf-viewer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    TranslocoPipe,
    DsIconComponent,
    DsButtonComponent,
    IonSpinner,
  ],
})
export class DsPdfViewerComponent {
  private modalCtrl = inject(ModalController);
  private fileService = inject(HesFileService);
  private translate = inject(HesTranslateService);

  @Input() src: string;
  @Input() title?: string;
  @Input() fileName?: string;
  /** When true, hides header and uses embedded mode (no modal controls) */
  @Input() previewMode = false;
  /** Custom height for the PDF viewer container */
  @Input() height?: string;

  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');
  isMobileDevice = isMobile();
  pdfLoaded = signal(false);

  /** Emitted when PDF successfully loads */
  pdfLoadSuccess = output<void>();

  readonly closeIcon = faXmark;
  readonly downloadIcon = faCircleArrowDown;

  // PDF viewer configuration based on platform and mode
  get pdfViewerConfig() {
    if (this.previewMode) {
      return {
        height: this.height || '100%',
        zoom: 'page-width' as const,
        showToolbar: false,
        showSidebarButton: false,
        showFindButton: false,
        showPagingButtons: false,
        showZoomButtons: false,
        showPresentationModeButton: false,
        showOpenFileButton: false,
        showPrintButton: false,
        showDownloadButton: false,
        showSecondaryToolbarButton: false,
      };
    }

    if (this.isMobileDevice) {
      return {
        height: this.height || 'calc(100vh - 120px)',
        zoom: 'page-fit' as const,
        showToolbar: true,
        showSidebarButton: false,
        showFindButton: false,
        showPagingButtons: true,
        showZoomButtons: false, // Use pinch-zoom on mobile
        showPresentationModeButton: false,
        showOpenFileButton: false,
        showPrintButton: false,
        showDownloadButton: false,
        showSecondaryToolbarButton: false, // Hide hamburger menu
      };
    } else {
      return {
        height: this.height || '80vh',
        zoom: 'auto' as const,
        showToolbar: true,
        showSidebarButton: false,
        showFindButton: false,
        showPagingButtons: true,
        showZoomButtons: true,
        showPresentationModeButton: false,
        showOpenFileButton: false,
        showPrintButton: false,
        showDownloadButton: false,
        showSecondaryToolbarButton: false, // Hide hamburger menu
      };
    }
  }

  onLoadComplete() {
    this.isLoading.set(false);
    this.pdfLoaded.set(true);
    this.pdfLoadSuccess.emit();
  }

  onError(error: any) {
    console.error('PDF loading error:', error);
    this.isLoading.set(false);
    this.hasError.set(true);

    // Determine error type and show appropriate message
    if (error?.status === 404) {
      this.errorMessage.set(this.translate.t('pdf_viewer.error.not_found'));
    } else if (
      error?.name === 'SecurityError' ||
      error?.message?.includes('CORS')
    ) {
      this.errorMessage.set(this.translate.t('pdf_viewer.error.security'));
    } else {
      this.errorMessage.set(this.translate.t('pdf_viewer.error.failed'));
    }
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  downloadPdf() {
    if (this.src) {
      this.fileService.downloadFile({
        url: this.src,
        fileName:
          this.fileName ||
          this.title ||
          this.translate.t('pdf_viewer.default_filename.txt'),
      });
    }
  }
}
