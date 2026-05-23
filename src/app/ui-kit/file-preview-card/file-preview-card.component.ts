import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { faFile } from '@fortawesome/pro-regular-svg-icons';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';
import { openPdfInNewTab } from '@shared/utils/open-pdf-in-new-tab.util';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-file-preview-card',
  templateUrl: './file-preview-card.component.html',
  standalone: true,
  imports: [HesIconComponent, CommonModule],
})
export class FilePreviewCardComponent {
  file = input.required<IAttachmentControlValue>();

  previewFile = computed(() => {
    const file = this.file();
    if (file instanceof File) {
      return file.name;
    } else {
      return (
        file?.key?.split('/')?.pop()?.split('-')?.shift() + `.${file.extension}`
      );
    }
  });

  readonly faFile: FaIconComponentsProps = {
    icon: faFile,
  };

  async openFile() {
    const file = this.file();
    if (file instanceof File) {
      openPdfInNewTab(file);
    } else {
      if (Capacitor.isNativePlatform()) {
        const isIpad =
          window.innerWidth > 768 && Capacitor.getPlatform() === 'ios';
        await Browser.open({
          url: file.url,
          presentationStyle: isIpad ? 'fullscreen' : 'popover',
        });
      } else {
        window.open(file.url, '_blank');
      }
    }
  }
}
