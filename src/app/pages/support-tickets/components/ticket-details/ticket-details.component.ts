import { Component, OnInit, computed, inject, input } from '@angular/core';
import { FilePreviewCardComponent } from '@ui-kit/file-preview-card/file-preview-card.component';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { IonImg } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgClass } from '@angular/common';
import { IMAGE_TYPES_PREVIEW_EXTENSTIONS } from '@ui-kit/hes-attachment-form-control/attachment-type.constant';
import { SupportTicketStatus } from '@shared/enums';
import { SupportTicketDetail } from '@shared/dto-transformation';

@Component({
  selector: 'app-ticket-details',
  templateUrl: './ticket-details.component.html',
  standalone: true,
  imports: [IonImg, FilePreviewCardComponent, TranslocoDirective, NgClass],
})
export class TicketDetailsComponent implements OnInit {
  imageSlider = inject(ImageSliderService);

  SupportTicketStatus = SupportTicketStatus;

  ticketDetails = input<SupportTicketDetail>();

  imgAttachments = computed(() => {
    const ticketDetails = this.ticketDetails();
    if (ticketDetails!.attachments?.length) {
      return this.ticketDetails()?.attachments?.filter((attch) =>
        IMAGE_TYPES_PREVIEW_EXTENSTIONS.includes(attch.extension),
      );
    }
    return [];
  });

  pdfAttachments = computed(() => {
    const ticketDetails = this.ticketDetails();
    if (ticketDetails!.attachments?.length) {
      return this.ticketDetails()?.attachments?.filter(
        (attachment) => attachment.extension === 'pdf',
      );
    }
    return [];
  });

  pptAttachments = computed(() => {
    const ticketDetails = this.ticketDetails();
    if (ticketDetails!.attachments?.length) {
      return this.ticketDetails()?.attachments?.filter(
        (attachment) => attachment.extension === 'ppt',
      );
    }
    return [];
  });

  constructor() {}

  ngOnInit() {}

  onViewImg(index: number) {
    this.imageSlider.show(
      this.imgAttachments()!.map((attachment) => attachment.url),
      index,
    );
  }
}
