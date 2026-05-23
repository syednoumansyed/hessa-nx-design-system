import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, input, signal } from '@angular/core';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
@Component({
  selector: 'app-attachment-preview',
  templateUrl: './attachment-preview.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class AttachmentPreviewComponent implements OnInit {
  attachment = input.required<IAttachmentControlValue>();

  previewImage = signal<string | null>(null);
  constructor() {}

  ngOnInit() {
    const img = this.attachment();
    if (img instanceof File) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.previewImage.set(event?.target?.result as string);
      };
      reader.readAsDataURL(img);
    } else {
      this.previewImage.set(img.url);
    }
  }
}
