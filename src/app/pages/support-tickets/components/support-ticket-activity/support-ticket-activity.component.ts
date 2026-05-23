import { Component, OnInit, inject, input, computed } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ITicketDetailActivity } from '@shared/interfaces/support-tickets.interface';
import { HesDatePipe } from '../../../../shared/pipes/hessa-date.pipe';
import { HesTimePipe } from '../../../../shared/pipes/hes-time.pipe';
import { FormsModule } from '@angular/forms';
import { AutosizeModule } from 'ngx-autosize';
import { NgClass } from '@angular/common';
import { IonImg } from '@ionic/angular/standalone';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { IMAGE_TYPES_PREVIEW_EXTENSTIONS } from '@ui-kit/hes-attachment-form-control/attachment-type.constant';
import { IAttachment } from '@shared/interfaces/attachment';
import { FilePreviewCardComponent } from '@ui-kit/file-preview-card/file-preview-card.component';
import { SupportTicketStatus } from '@shared/enums';

@Component({
  selector: 'app-support-ticket-activity',
  templateUrl: './support-ticket-activity.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    HesDatePipe,
    HesTimePipe,
    AutosizeModule,
    NgClass,
    FormsModule,
    IonImg,
    FilePreviewCardComponent,
  ],
})
export class SupportTicketActivityComponent implements OnInit {
  SupportTicketStatus = SupportTicketStatus;
  imageSlider = inject(ImageSliderService);

  activities = input<ITicketDetailActivity[]>([]);
  isAssigneeView = input<boolean>(true);

  imgAttachmentsByLevel = (attachmentId: string) =>
    computed(() => {
      const allAttachments = this.activities()?.flatMap(
        (activity) => activity.attachments || [],
      );
      if (allAttachments?.length) {
        return allAttachments.filter(
          (attachment: IAttachment) =>
            attachment.id === attachmentId &&
            IMAGE_TYPES_PREVIEW_EXTENSTIONS.includes(attachment.extension),
        );
      }
      return [];
    });

  imgAttachments(attachments: IAttachment[] | null | undefined) {
    if (attachments?.length) {
      return attachments.filter((attachment) =>
        IMAGE_TYPES_PREVIEW_EXTENSTIONS.includes(attachment.extension),
      );
    }
    return [];
  }

  pdfAttachments(attachments: IAttachment[] | null | undefined) {
    if (attachments?.length) {
      return attachments.filter((attachment) => attachment.extension === 'pdf');
    }
    return [];
  }

  pptAttachments(attachments: IAttachment[] | null | undefined) {
    if (attachments?.length) {
      return attachments.filter((attachment) => attachment.extension === 'ppt');
    }
    return [];
  }

  constructor() {}

  ngOnInit() {}

  onViewImg(index: number, attachment: IAttachment[]) {
    this.imageSlider.show(
      this.imgAttachments(attachment)!.map((attachment) => attachment.url),
      index,
    );
  }
}
