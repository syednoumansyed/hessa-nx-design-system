import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  computed,
  forwardRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { faCloudArrowUp, faXmark } from '@fortawesome/pro-regular-svg-icons';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';
import { ToastrService } from 'ngx-toastr';
import { HesAttachmentPreviewComponent } from './attachment-preview/attachment-preview.component';
import { IAttachmentControlValue } from './attachment-control-value.interface';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AcceptFileType } from './attachment-type.constant';

@Component({
  selector: 'app-hes-attachment-form-control',
  templateUrl: './hes-attachment-form-control.component.html',
  standalone: true,
  imports: [
    CommonModule,
    HesIconComponent,
    HesAttachmentPreviewComponent,
    TranslocoDirective,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HesAttachmentFormControlComponent),
      multi: true,
    },
  ],
})
export class HesAttachmentFormControlComponent implements ControlValueAccessor {
  acceptFileTypes = input<AcceptFileType>();
  @Input() maxSizeInMB: number = 5;
  @Input() label?: string;
  @Input() subLabel?: string;
  @Input() placeholder?: string;
  @Input() isMultiple = false;
  @Input() isreadonly = false;
  @Input() isReplacePrevious = false;
  @Input() required = false;

  acceptFileTypesComputed = computed(() => {
    const acceptFileTypes = this.acceptFileTypes() || [];
    return acceptFileTypes
      .reduce<string[]>((acc, type) => {
        switch (type.trim()) {
          case 'IMAGES':
            return [...acc, ...IMAGE_TYPES];
          case 'COMMON_IMAGES':
            return [...acc, ...COMMON_IMAGES_TYPES];
          case 'FILES':
            return [...acc, ...PDF_AND_PPT_TYPES];
          case 'VIDEOS':
            return [...acc, ...VIDEO_TYPES];
          default:
            return acc;
        }
      }, [])
      ?.join(', ');
  });

  uploadPlaceholder = computed(() => {
    const types = [...new Set(this.getSimplifiedFileTypes())].join(', ');
    let sizeInGB: string | number = this.maxSizeInMB / 1024; // Convert MB to GB

    if (sizeInGB < 1) {
      sizeInGB = parseFloat(sizeInGB.toFixed(1));
    }

    return this.translateService.translate('global.file_upload.info', {
      types,
      size: sizeInGB,
    });
  });

  private readonly translateService = inject(TranslocoService);
  containerEl = viewChild<ElementRef<HTMLElement>>('container');
  readonly faUpload: FaIconComponentsProps = {
    icon: faCloudArrowUp,
  };

  readonly faXmark: FaIconComponentsProps = {
    icon: faXmark,
    size: 'xs',
  };

  attachments: Array<IAttachmentControlValue> = [];

  private readonly toasterService = inject(ToastrService);
  onChange: (attachments: IAttachmentControlValue[]) => void;

  get isDisabled() {
    return (
      this.isreadonly ||
      (this.isMultiple === false && this.attachments.length > 0)
    );
  }

  writeValue(value: IAttachmentControlValue[]): void {
    if (value && Array.isArray(value)) {
      this.attachments = value;
    } else {
      this.attachments = [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {}

  setDisabledState?(isDisabled: boolean): void {}

  removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, idx) => idx !== index);
    if (this.onChange) {
      this.onChange(this.attachments);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const elRef = this.containerEl();
    if (elRef) {
      elRef.nativeElement.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
    }
  }

  onDragEnd() {
    this.resetColor();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isreadonly) return;
    this.resetColor();
    const files = event.dataTransfer?.files;
    if (files) {
      const acceptedFiles = Array.from(files).filter((file) => {
        const isAccepted = this.isFileTypeAccepted(file.type);
        if (!isAccepted) {
          this.toasterService.error(
            '',
            this.translateService.translate(
              'global.attachment.not_supported.error.msg',
              {
                name: file.name,
              },
            ),
          );
        }
        return isAccepted;
      });

      this.setupAttachements(acceptedFiles);
    }
  }

  resetInput(fileInput: HTMLInputElement) {
    fileInput.value = ''; // Reset the input value
  }

  onFileChange(event: Event): void {
    const filesList: FileList | null = (event.target as HTMLInputElement).files;
    if (filesList?.length) {
      const acceptedFiles = Array.from(filesList).filter((file) => {
        const isAccepted = this.isFileTypeAccepted(file.type);
        if (!isAccepted) {
          this.toasterService.error(
            '',
            this.translateService.translate(
              'global.attachment.not_supported.error.msg',
              {
                name: file.name,
              },
            ),
          );
        }
        return isAccepted;
      });
      if (filesList?.length) this.setupAttachements(Array.from(acceptedFiles));
    }
  }

  private setupAttachements(files: File[]) {
    if (files && files.length) {
      const filterFiles = files.filter((file) => {
        const isValidSize = file.size <= this.sizeInBytes;
        if (!isValidSize) {
          this.toasterService.error(
            '',
            this.translateService.translate(
              'global.attachment.max_size.error.msg',
              { name: file.name, size: this.sizeInBytes },
            ),
          );
        }
        return isValidSize;
      });
      if (this.isMultiple && !this.isReplacePrevious) {
        this.attachments = [...this.attachments, ...filterFiles];
      } else {
        this.attachments = [...filterFiles];
      }
      if (this.onChange) {
        this.onChange(this.attachments);
      }
    }
  }

  private isFileTypeAccepted(fileType: string): boolean {
    const fileTypes = this.acceptFileTypesComputed().split(',');
    if (fileTypes.length === 0) {
      return true;
    }
    return fileTypes.some((type) => fileType?.startsWith(type?.trim()));
  }

  private resetColor() {
    const elRef = this.containerEl();
    if (elRef) {
      elRef.nativeElement.style.backgroundColor = '#fff';
    }
  }

  get sizeInBytes(): number {
    return this.maxSizeInMB * 1024 * 1024; // Convert size from MB to bytes
  }

  private getSimplifiedFileTypes(): string[] {
    const types = this.acceptFileTypesComputed().split(',');
    return types.map((type) => getFileTypeName(type.trim()));
  }
}

const IMAGE_TYPES: string[] = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];
const COMMON_IMAGES_TYPES: string[] = ['image/png', 'image/jpeg', 'image/jpg'];
const PDF_TYPE: string[] = ['application/pdf'];
const PPT_TYPES: string[] = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const VIDEO_TYPES: string[] = ['video/mp4', 'video/mov'];
const PDF_AND_PPT_TYPES: string[] = [...PDF_TYPE, ...PPT_TYPES];

function getFileTypeName(type: string): string {
  const typeMapping: { [key: string]: string } = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'ppt',
    'video/mp4': 'mp4',
    'video/mov': 'mov',
  };

  const name = typeMapping[type] || type.split('/').pop() || type;
  return `.${name}`;
}
