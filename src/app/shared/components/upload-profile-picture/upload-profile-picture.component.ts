import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  HostListener,
  inject,
} from '@angular/core';
import { StudentsService } from '@pages/user-management/students/students.service';
import {
  ImageCroppedEvent,
  ImageCropperComponent,
  ImageTransform,
} from 'ngx-image-cropper';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'app-upload-profile-picture',
  standalone: true,
  templateUrl: './upload-profile-picture.component.html',
  styleUrl: './upload-profile-picture.component.scss',
  imports: [CommonModule, ImageCropperComponent],
})
export class UploadProfilePictureComponent {
  @Input() studentId: number;
  @Input() profilePicture: string;
  @Input() hasExistingImage = false;

  // Function provided by DsModalWrapperComponent to dismiss the modal
  closeModal: (data?: unknown, role?: string) => void;

  croppedImage: ImageCroppedEvent;
  transform: ImageTransform = { scale: 1 };

  private readonly studentService = inject(StudentsService);
  private readonly toasterService = inject(HesToasterService);
  private readonly translocoService = inject(HesTranslateService);

  scale = 1;
  readonly MIN_SCALE = 1;
  readonly MAX_SCALE = 3;
  readonly SCALE_FACTOR = 0.01;

  @ViewChild('cropper') cropperContainer!: ElementRef<HTMLDivElement>;

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = -event.deltaY * this.SCALE_FACTOR;
      const newScale = Math.max(
        this.MIN_SCALE,
        Math.min(this.MAX_SCALE, this.scale + delta),
      );

      if (newScale !== this.scale) {
        this.scale = newScale;
        this.transform = {
          ...this.transform,
          scale: this.scale,
        };
      }
    }
  }

  onImageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event;
  }

  // Called by modal wrapper when secondary (Cancel) button is clicked
  onSecondaryClick() {
    this.closeModal?.(undefined, 'cancel');
  }

  // Called by modal wrapper when primary (Upload) button is clicked
  onPrimaryClick() {
    if (this.croppedImage?.blob) {
      const fileName = `profile-${new Date().getTime()}.png`;
      const file = new File([this.croppedImage.blob], fileName, {
        type: 'image/png',
      });

      this.studentService.uploadProfilePicture(this.studentId, file).subscribe({
        next: (res) => {
          this.toasterService.success(
            this.translocoService.t(
              this.hasExistingImage
                ? 'profile.pic_changed_successfully.txt'
                : 'profile.pic_added_successfully.txt',
            ),
          );
          this.closeModal?.(res.imageUrl, 'confirm');
        },
        error: (err) => {
          this.toasterService.showBackendError(err);
        },
      });
    }
  }
}
