import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { faFile, faFolder, faXmark } from '@fortawesome/pro-regular-svg-icons';
import { IonImg, ModalController } from '@ionic/angular/standalone';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps, hesIcon } from '@shared/types';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { IAttachmentControlValue } from '../attachment-control-value.interface';
import { openPdfInNewTab } from '@shared/utils/open-pdf-in-new-tab.util';
import { openVideoDialog } from '@ui-kit/hes-video-dialog/hes-video-dialog';
import { getAttachmentCategory } from '@shared/utils/get-attachmentType.util';

@Component({
  selector: 'app-hes-attachment-preview',
  templateUrl: './attachment-preview.component.html',
  standalone: true,
  imports: [IonImg, CommonModule, HesIconComponent],
})
export class HesAttachmentPreviewComponent implements OnInit {
  attachment = input.required<IAttachmentControlValue>();
  fileName = input<string>();
  removable = input<boolean>(true);
  private readonly ModalCtrl = inject(ModalController);
  @Output() removed = new EventEmitter<IAttachmentControlValue>();

  type = computed((): 'image' | 'pdf' | 'video' | 'ppt' | null => {
    const attachment = this.attachment();
    if (attachment instanceof File) {
      return getAttachmentCategory({
        key: '',
        url: '',
        extension: attachment.type,
      });
    }
    if (attachment.key) {
      return getAttachmentCategory(attachment);
    }
    return null;
  });

  fileNameDisplay = computed(() => {
    const attachment = this.attachment();
    if (attachment instanceof File) {
      return attachment.name;
    }
    return this.fileName();
  });
  previewImage = signal<string | null>(null);
  readonly faPDF: hesIcon = {
    src: 'assets/icons/folder-outline.svg',
  };

  readonly faFolder: FaIconComponentsProps = {
    icon: faFolder,
  };

  readonly faFileLarge: FaIconComponentsProps = {
    icon: faFile,
  };

  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'xs',
  };
  private readonly imageSlider = inject(ImageSliderService);

  constructor() {}

  ngOnInit() {
    const attachment = this.attachment();

    if (attachment instanceof File) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.previewImage.set(event?.target?.result as string);
      };
      reader.readAsDataURL(attachment);
    } else if (attachment.url) {
      this.previewImage.set(attachment.url);
    }
  }

  getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop() || '' : '';
  }

  extendImage() {
    const attachment = this.attachment();
    if (this.type() === 'pdf' || (this.type() === 'ppt' && attachment)) {
      if (attachment instanceof File) {
        return openPdfInNewTab(attachment as File);
      }
      return window.open(attachment.url, '_blank');
    } else if (this.type() === 'video' && attachment) {
      this.openVideoModal();
      return;
    }
    const previewImage = this.previewImage();
    if (previewImage) this.imageSlider.show([previewImage]);
  }

  private openVideoModal() {
    const file = this.attachment();
    openVideoDialog({
      modalCtrl: this.ModalCtrl,
      src: file instanceof File ? file : file.url!,
      title: '',
    });
  }

  onRemove(event: Event) {
    event.stopPropagation();
    this.removed.emit(this.attachment());
  }
}
