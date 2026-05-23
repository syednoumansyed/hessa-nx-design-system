import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { DsIconComponent } from '@ds/icon/icon.component';
import { HesLogService } from '@shared/services/hes-log.service';
import { faCamera, faPencil } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-delegate-avatar-upload',
  standalone: true,
  templateUrl: './delegate-avatar-upload.component.html',
  imports: [CommonModule, DsIconComponent],
})
export class DelegateAvatarUploadComponent {
  private readonly logService = inject(HesLogService);
  @Input() imageUrl: string | null = null;
  @Input() label: string = 'Upload delegate photo';
  @Output() onImageSelected = new EventEmitter<File>();
  camera = faCamera;
  pencil = faPencil;

  previewUrl = signal<string | null>(null);

  get displayImageUrl(): string | null {
    return this.previewUrl() || this.imageUrl;
  }

  async pickImage() {
    try {
      const result = await FilePicker.pickImages({
        limit: 1,
        readData: true,
      });

      if (result.files && result.files.length > 0) {
        const pickedFile = result.files[0];

        // Create preview from base64
        if (pickedFile.data) {
          const base64 = `data:${pickedFile.mimeType};base64,${pickedFile.data}`;
          this.previewUrl.set(base64);

          // Convert base64 to File object for form submission
          const file = await this.base64ToFile(
            base64,
            pickedFile.name || 'delegate-photo.jpg',
            pickedFile.mimeType || 'image/jpeg',
          );
          this.onImageSelected.emit(file);
        }
      }
    } catch (error) {
      this.logService.error('Error picking image:', error);
    }
  }

  private async base64ToFile(
    base64: string,
    filename: string,
    mimeType: string,
  ): Promise<File> {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: mimeType });
  }
}
