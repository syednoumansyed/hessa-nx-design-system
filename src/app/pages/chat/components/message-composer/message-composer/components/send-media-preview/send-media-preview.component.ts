import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faPaperPlaneTop } from '@fortawesome/pro-regular-svg-icons';
import { IonSpinner } from '@ionic/angular/standalone';
import { MessageMediaPreviewComponent } from '../message-media-preview/message-media-preview.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { isMobile } from '@shared/utils/platform';
import { DsIconComponent } from '@ds/icon/icon.component';
@Component({
  selector: 'app-send-media-preview',
  templateUrl: './send-media-preview.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DsIconComponent,
    IonSpinner,
    MessageMediaPreviewComponent,
    TranslocoDirective,
  ],
})
export class SendMediaPreviewComponent implements OnInit {
  @Input() media: File;
  @Input() mediaType: 'image' | 'video' | 'file' = 'image';
  @Input() sendMessage: (caption: string | null) => Promise<void>;
  @ViewChild('textareaRef') textareaRef: ElementRef<HTMLTextAreaElement>;

  previewImage = signal<string | null>(null);
  readonly textInput = new FormControl<string | null>(null);
  readonly faPaperPlaneTop = faPaperPlaneTop;

  readonly isLoading = signal<boolean>(false);
  readonly isSendDisabled = signal<boolean>(false);
  readonly isMobile = isMobile();

  constructor() {}

  ngOnInit() {
    // For PDFs, start with send disabled until the PDF successfully loads
    if (this.media?.type?.includes('application/pdf')) {
      this.isSendDisabled.set(true);
    }
  }

  onEnter(event: Event) {
    // On mobile, let default textarea behavior add newline - users should use Send button
    if (this.isMobile) {
      return;
    }

    // On desktop, Enter sends message (Shift+Enter for new line)
    if (!(event as KeyboardEvent).shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  async onSend() {
    if (this.isSendDisabled()) {
      return;
    }
    this.isLoading.set(true);
    await this.sendMessage(this.textInput.value);
    this.isLoading.set(false);
  }

  onPdfLoadSuccess() {
    this.isSendDisabled.set(false);
  }

  adjustTextareaHeight(): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate max height (3 lines * ~20px line height + padding)
    const lineHeight = 20;
    const maxLines = 3;
    const padding = 16; // py-2 = 8px top + 8px bottom
    const maxHeight = lineHeight * maxLines + padding;
    const minHeight = 40;

    // Set height based on content, capped at max
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight,
    );
    textarea.style.height = `${newHeight}px`;

    // Show scrollbar if content exceeds max height
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }
}
