import {
  Component,
  OnInit,
  OnDestroy,
  input,
  signal,
  output,
} from '@angular/core';
import { DsPdfViewerComponent } from '@ui-kit/ds-pdf-viewer/ds-pdf-viewer.component';

@Component({
  selector: 'app-message-media-preview',
  templateUrl: './message-media-preview.component.html',
  standalone: true,
  imports: [DsPdfViewerComponent],
  host: {
    class: 'block h-full w-full',
  },
})
export class MessageMediaPreviewComponent implements OnInit, OnDestroy {
  media = input.required<File>();
  previewImage = signal<string | null>(null);
  previewVideo = signal<string | null>(null);
  previewDoc = signal<string | null>(null);
  pdfLoadSuccess = output<void>();

  private pdfBlobUrl: string | null = null;

  constructor() {}

  ngOnInit() {
    const media = this.media();
    if (media instanceof File) {
      if (media.type.includes('image')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.previewImage.set(event?.target?.result as string);
        };
        reader.readAsDataURL(media);
        return;
      }

      if (media.type.includes('video')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.previewVideo.set(event?.target?.result as string);
        };
        reader.readAsDataURL(media);
        return;
      }

      if (media.type.includes('application/pdf')) {
        // Use Blob URL for PDF viewer
        this.pdfBlobUrl = URL.createObjectURL(media);
        this.previewDoc.set(this.pdfBlobUrl);
        return;
      }
    }
  }

  onPdfSuccess() {
    this.pdfLoadSuccess.emit();
  }

  ngOnDestroy() {
    // Clean up blob URL to prevent memory leaks
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
    }
  }
}
