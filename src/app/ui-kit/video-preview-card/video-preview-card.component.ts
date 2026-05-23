import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, input } from '@angular/core';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { IonImg, ModalController } from '@ionic/angular/standalone';
import { openVideoDialog } from '@ui-kit/hes-video-dialog/hes-video-dialog';
@Component({
  selector: 'app-video-preview-card',
  templateUrl: './video-preview-card.component.html',
  standalone: true,
  imports: [CommonModule, IonImg],
})
export class VideoPreviewCardComponent {
  file = input.required<IAttachmentControlValue>();
  private readonly ModalCtrl = inject(ModalController);

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

  openFile() {
    const file = this.file();
    openVideoDialog({
      modalCtrl: this.ModalCtrl,
      src: file instanceof File ? file : file.url!,
      title: this.previewFile(),
    });
  }
}
