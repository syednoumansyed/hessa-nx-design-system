import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { faCloudArrowUp, faXmark } from '@fortawesome/pro-regular-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { DS_TRANSLATION_TOKEN } from '../i18n/ds-translation.token';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsAttachmentPreviewComponent } from './ds-attachment-preview.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsAttachmentControlValue } from './attachment-control-value.interface';
import {
  DsAcceptFileType,
  getAcceptedMimeTypes,
  getFileExtensions,
} from './attachment-type.constant';
import { DsTranslatePipe } from '../i18n/ds-translate.pipe';

@Component({
  selector: 'ds-attachment-form-control',
  templateUrl: './ds-attachment-form-control.component.html',
  standalone: true,
  imports: [
    DsIconComponent,
    DsAttachmentPreviewComponent,
    DsButtonComponent,
    NgClass,
    DsTranslatePipe,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsAttachmentFormControlComponent),
      multi: true,
    },
  ],
})
export class DsAttachmentFormControlComponent implements ControlValueAccessor {
  // #region Inputs
  acceptFileTypes = input<DsAcceptFileType>();
  maxSizeInMB = input<number>(1000);
  label = input<string>('');
  subLabel = input<string>('');
  placeholder = input<string>('');
  hint = input<string | null>(null);
  isMultiple = input<boolean>(false);
  isreadonly = input<boolean>(false);
  isReplacePrevious = input<boolean>(false);
  // #endregion

  // #region Properties
  protected isDragOver = signal(false);
  protected readonly uploadIcon = faCloudArrowUp;
  readonly faUpload = {
    icon: faCloudArrowUp,
  };
  readonly faXmark = {
    icon: faXmark,
    size: 'xs',
  };
  attachments: Array<DsAttachmentControlValue> = [];
  onChange: (attachments: DsAttachmentControlValue[]) => void;
  containerEl = viewChild<ElementRef<HTMLElement>>('container');
  // #endregion

  // #region Services
  private readonly translationService = inject(DS_TRANSLATION_TOKEN);
  private readonly toasterService = inject(ToastrService);
  // #endregion

  byFormDisabled = signal<boolean>(false);
  // #region Computed Properties
  acceptFileTypesComputed = computed(() => {
    const acceptFileTypes = this.acceptFileTypes() || [];
    const mimeTypes = getAcceptedMimeTypes(acceptFileTypes);
    return mimeTypes.join(', ');
  });

  uploadPlaceholder = computed(() => {
    if (this.placeholder()) {
      return this.placeholder();
    }
    const types = [...new Set(this.getSimplifiedFileTypes())].join(', ');
    let sizeInGB: string | number = this.maxSizeInMB() / 1024; // Convert MB to GB

    if (sizeInGB < 1) {
      sizeInGB = parseFloat(sizeInGB.toFixed(1));
    }

    if (this.isMultiple()) {
      return this.translationService.translate(
        'global.multiple_attachment_upload.info',
        {
          types,
          size: sizeInGB,
        },
      );
    }
    return this.translationService.translate(
      'global.single_attachment_upload.info',
      {
        types,
        size: sizeInGB,
      },
    );
  });

  isShowRemoveButton = computed(() => {
    if (this.byFormDisabled()) {
      return false;
    }
    return !this.isreadonly();
  });
  // #endregion

  // #region Getters
  get isDisabled() {
    return (
      this.isreadonly() ||
      (!this.isMultiple() && this.attachments.length > 0) ||
      this.byFormDisabled()
    );
  }

  get sizeInBytes(): number {
    return this.maxSizeInMB() * 1024 * 1024; // Convert size from MB to bytes
  }
  // #endregion

  // #region ControlValueAccessor Implementation
  writeValue(value: DsAttachmentControlValue[]): void {
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

  setDisabledState?(isDisabled: boolean): void {
    console.log(`Setting disabled state: ${isDisabled}`);
    this.byFormDisabled.set(isDisabled);
  }
  // #endregion

  // #region Protected Methods
  protected removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, idx) => idx !== index);
    if (this.onChange) {
      this.onChange(this.attachments);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  protected onDragEnd() {
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    if (this.isreadonly()) return;
    const files = event.dataTransfer?.files;
    if (files) {
      const acceptedFiles = Array.from(files).filter((file) => {
        const isAccepted = this.isFileTypeAccepted(file.type);
        if (!isAccepted) {
          this.toasterService.error(
            '',
            this.translationService.translate(
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

  protected resetInput(fileInput: HTMLInputElement) {
    fileInput.value = ''; // Reset the input value
  }

  protected onFileChange(event: Event): void {
    const filesList: FileList | null = (event.target as HTMLInputElement).files;
    if (filesList?.length) {
      const acceptedFiles = Array.from(filesList).filter((file) => {
        const isAccepted = this.isFileTypeAccepted(file.type);
        if (!isAccepted) {
          this.toasterService.error(
            '',
            this.translationService.translate(
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
  // #endregion

  // #region Private Methods
  private setupAttachements(files: File[]) {
    if (files && files.length) {
      const filterFiles = files.filter((file) => {
        const isValidSize = file.size <= this.sizeInBytes;
        if (!isValidSize) {
          this.toasterService.error(
            '',
            this.translationService.translate(
              'global.attachment.max_size.error.msg',
              { name: file.name, size: this.sizeInBytes },
            ),
          );
        }
        return isValidSize;
      });
      if (this.isMultiple() && !this.isReplacePrevious()) {
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

  private getSimplifiedFileTypes(): string[] {
    const acceptTypes = this.acceptFileTypes() || [];
    const extensions = getFileExtensions(acceptTypes);
    return extensions;
  }
  // #endregion
}
