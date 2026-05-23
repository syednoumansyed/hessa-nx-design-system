import { Component, inject, input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { DsQrScannerComponent, DsQrScanResult } from './qr-scanner.component';

/**
 * Wrapper component for the QR scanner that handles modal dismissal.
 * This is used internally by DsQrScannerService.
 */
@Component({
  selector: 'ds-qr-scanner-modal',
  standalone: true,
  imports: [DsQrScannerComponent],
  template: `
    <ds-qr-scanner
      [title]="title()"
      [subtitle]="subtitle()"
      [showCloseButton]="showCloseButton()"
      (scanSuccess)="onScanSuccess($event)"
      (scanError)="onScanError($event)"
      (closeClick)="onClose()"
    />
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class DsQrScannerModalComponent {
  private readonly modalCtrl = inject(ModalController);

  // Inputs passed from modal service
  readonly title = input<string>('Scan QR Code');
  readonly subtitle = input<string>(
    'Point your camera at a QR code and capture it.',
  );
  readonly showCloseButton = input<boolean>(true);

  onScanSuccess(result: DsQrScanResult): void {
    this.modalCtrl.dismiss(result, 'success');
  }

  onScanError(error: string): void {
    this.modalCtrl.dismiss(error, 'error');
  }

  onClose(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
