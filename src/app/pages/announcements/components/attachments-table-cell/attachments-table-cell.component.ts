import { Component, computed, inject, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { IonImg } from '@ionic/angular/standalone';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { IAnnouncementListItem } from '@shared/interfaces/announcements.interface';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { openVideoDialog } from '@ui-kit/hes-video-dialog/hes-video-dialog';
import { ModalController } from '@ionic/angular/standalone';
import { IAttachment } from '@shared/interfaces/attachment';
import {
  IMAGE_TYPES_PREVIEW_EXTENSTIONS,
  PDF_TYPES_PREVIEW_EXTENSTIONS,
  PPT_TYPES_PREVIEW_EXTENSTIONS,
  VIDEO_TYPES_PREVIEW_EXTENSTIONS,
} from '@ui-kit/hes-attachment-form-control/attachment-type.constant';
@Component({
  selector: 'app-attachments-table-cell',
  templateUrl: './attachments-table-cell.component.html',
  standalone: true,
  imports: [IonImg, HesIconComponent],
})
export class AttachmentsTableCellComponent implements ICellRendererAngularComp {
  private readonly modalCtrl = inject(ModalController);
  imageSlider = inject(ImageSliderService);
  attachments = signal<IAnnouncementListItem['attachments']>([]);
  pdfAttachments = computed(() => {
    return this.attachments().filter((file) =>
      PDF_TYPES_PREVIEW_EXTENSTIONS.includes(file.extension),
    );
  });

  pptAttachments = computed(() => {
    return this.attachments().filter((file) =>
      PPT_TYPES_PREVIEW_EXTENSTIONS.includes(file.extension),
    );
  });

  imagesAttachment = computed(() => {
    const attchment = this.attachments().filter((file) =>
      IMAGE_TYPES_PREVIEW_EXTENSTIONS.includes(file.extension),
    );
    return attchment;
  });

  videoAttachments = computed(() => {
    return this.attachments().filter((file) =>
      VIDEO_TYPES_PREVIEW_EXTENSTIONS.includes(file.extension),
    );
  });

  nonImages = computed(() => {
    return [
      ...this.pdfAttachments(),
      ...this.pptAttachments(),
      ...this.videoAttachments(),
    ];
  });

  agInit(params: ICellRendererParams<any, any, any>): void {
    const attachments: IAnnouncementListItem['attachments'] =
      params.data?.attachments || [];
    if (attachments.length) {
      const pdfs = attachments.filter((file) =>
        PDF_TYPES_PREVIEW_EXTENSTIONS.includes(file.extension),
      );
      const ppts = attachments.filter((file) =>
        PPT_TYPES_PREVIEW_EXTENSTIONS.includes(file.extension),
      );
      const images = attachments.filter((file) =>
        IMAGE_TYPES_PREVIEW_EXTENSTIONS.includes(file.extension),
      );
      const videos = attachments.filter((file) =>
        VIDEO_TYPES_PREVIEW_EXTENSTIONS.includes(file.extension),
      );
      this.attachments.set([...videos, ...pdfs, ...ppts, ...images]);
    }
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  onViewImg(index: number) {
    this.imageSlider.show(
      this.imagesAttachment().map((attachment) => attachment.url),
      index,
    );
  }

  onViewPdf(index: number) {
    window.open(this.pdfAttachments()[index].url, '_blank');
  }

  onViewPpt(pptAttachment: IAttachment) {
    window.open(pptAttachment.url, '_blank');
  }

  openVideoDialog(src: string) {
    openVideoDialog({
      modalCtrl: this.modalCtrl,
      src,
      title: '',
    });
  }
}
