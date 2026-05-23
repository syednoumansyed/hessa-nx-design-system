import { Component, inject, input, output, computed } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import { getDsIconColorClass } from '@ds/icon/ds-icon-colors.util';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { DsAttachmentControlValue } from './attachment-control-value.interface';
import { dsGetAttachmentCategory } from './ds-get-attachment-type.util';
import { createDsFileInteractionService } from '@ds/utils/ds-file-interaction.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'ds-attachment-preview',
  standalone: true,
  imports: [DsIconComponent],
  template: `
    <div
      class="group flex items-center justify-between gap-2 rounded-ds-md p-ds-md hover:bg-surface-hover"
      [class]="cssClasses()"
      [class.cursor-pointer]="isInteractable()"
      (click)="onAttachmentClick()"
    >
      <app-ds-icon
        [icon]="fileIcon()"
        [class]="fileIconColorClass()"
        size="20"
      ></app-ds-icon>
      @if (fileName()) {
        <div class="content-xs-default flex-1 truncate text-content-high">
          <span class="font-medium">{{ fileName() }}</span>
        </div>
      }
      @if (showRemove()) {
        <button
          (click)="onRemoveClick($event)"
          class="ml-2 cursor-pointer text-gray-500 group-hover:text-icon-error"
        >
          <app-ds-icon [icon]="removeIcon" size="20"></app-ds-icon>
        </button>
      }
    </div>
  `,
})
export class DsAttachmentPreviewComponent {
  attachment = input<DsAttachmentControlValue>();
  showRemove = input<boolean>(true);
  enforceUnknownFile = input<boolean>(false);
  cssClasses = input<string>('');
  remove = output<void>();

  readonly removeIcon = faCircleXmark;
  private fileInteractionService = createDsFileInteractionService();
  private translateService = inject(HesTranslateService);

  fileName = computed(() => {
    const file = this.attachment();
    // Try name first (works for File objects), then title (backend DTO field)
    const name =
      file?.name || ('title' in (file ?? {}) ? (file as any).title : undefined);
    if (name) return name;
    // For uploaded files missing name/title, generate from extension
    if (file && 'extension' in file && (file as any).extension) {
      const attachmentLabel = this.translateService.t(
        'global.attachments.title',
      );
      return `${attachmentLabel}.${(file as any).extension}`;
    }
    if (this.enforceUnknownFile()) {
      return 'Unknown file';
    }
    return undefined;
  });

  fileIcon = computed(() => {
    const file = this.attachment();
    if (!file) return 'ds-attachment';
    const fileType = dsGetAttachmentCategory(file);
    if (fileType === null) {
      return 'ds-attachment';
    }
    // Check by MIME type first
    if (fileType === 'image') {
      return 'ds-image';
    }
    if (fileType === 'video') {
      return 'ds-video';
    }
    if (fileType === 'pdf') {
      return 'ds-pdf';
    }
    if (fileType === 'word') {
      return 'ds-ms-word';
    }
    return 'ds-attachment';
  });

  fileIconColorClass = computed(() => {
    const icon = this.fileIcon();
    return getDsIconColorClass(icon);
  });

  isInteractable = computed(() => {
    const file = this.attachment();
    return file ? this.fileInteractionService.isInteractable(file) : false;
  });

  async onAttachmentClick(): Promise<void> {
    const file = this.attachment();
    if (file && this.isInteractable()) {
      await this.fileInteractionService.handleFile({ attachment: file });
    }
  }

  onRemoveClick(event: Event): void {
    event.stopPropagation(); // Prevent triggering the file interaction when clicking remove
    this.remove.emit();
  }
}
