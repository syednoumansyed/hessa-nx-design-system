import { Component, computed, inject, input } from '@angular/core';
import { faFile } from '@fortawesome/pro-light-svg-icons';
import { BaseMessage } from '@cometchat/chat-sdk-javascript';
import { faCircleArrowDown, faEye } from '@fortawesome/pro-regular-svg-icons';
import { DsIconComponent } from '@ds/icon/icon.component';
import { isMobile } from '@shared/utils/platform';
import { HesFileService } from '@shared/services/hes-file.service';
import { createPdfViewerDialog } from '@ui-kit/ds-pdf-viewer/ds-pdf-viewer';

@Component({
  selector: 'app-file-message',
  templateUrl: './file-message.component.html',
  standalone: true,
  imports: [DsIconComponent],
})
export class FileMessageComponent {
  private readonly fileSystem = inject(HesFileService);
  private readonly pdfViewer = createPdfViewerDialog();

  message = input.required<BaseMessage>();
  fileName = computed(() => {
    return this.message().getData().attachments[0].name;
  });

  // Detect if file is a PDF
  isPdf = computed(() => {
    const fileName = this.fileName().toLowerCase();
    return fileName.endsWith('.pdf');
  });

  isMobile = isMobile();

  readonly arrowDownIcon = faCircleArrowDown;
  readonly eyeIcon = faEye;
  readonly fileIcon = faFile;

  async onClick() {
    const url = this.message().getData().url;
    if (!url) return;

    if (this.isPdf()) {
      // Open PDF viewer modal
      await this.pdfViewer({
        src: url,
        title: this.fileName(),
        fileName: this.fileName(),
      });
    } else {
      // Download non-PDF files
      this.fileSystem.downloadFile({
        url,
        fileName: this.fileName(),
      });
    }
  }
}
