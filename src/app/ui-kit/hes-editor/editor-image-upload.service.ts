import { inject, Injectable } from '@angular/core';
import { FileUploadService } from '@shared/services/file-upload.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: `root`,
})
export class EditorImageUploadService {
  private uploadImageUrl: string;
  private uploadAsNonBinary: boolean = false;

  set uploadUrl(url: string) {
    this.uploadImageUrl = `${ApiUrl.v1BE}/${url}`;
  }

  private readonly fileUploadService = inject(FileUploadService);
  private readonly toasterService = inject(HesToasterService);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  private uploadedImageUrl: IAttachmentControlUploadedValue[] = [];

  get isLoading(): boolean {
    return this.loading$.getValue();
  }

  save(file: File): Observable<string> {
    const obs$ = this.uploadAsNonBinary
      ? this.saveAsNonBinary(file)
      : this.saveAsBinary(file);
    return obs$.pipe(
      tap((file) => {
        this.uploadedImageUrl.push(file);
      }),
      map((file) => file.url),
      catchError((error) => {
        this.toasterService.showBackendError(error);
        return EMPTY;
      }),
    );
  }

  saveAsNonBinary(file: File): Observable<IAttachmentControlUploadedValue> {
    return this.fileUploadService
      .uploadFiles(this.uploadImageUrl, [file])
      .pipe(map((response) => response[0]));
  }

  saveAsBinary(file: File): Observable<IAttachmentControlUploadedValue> {
    return this.fileUploadService
      .uploadMediaFiles({
        uploadUrlConfig: {
          file: {
            url: this.uploadImageUrl,
            uploadAsFormData: true,
          },
        },
        attachments: [file],
      })
      .pipe(map((response) => response[0]));
  }

  getRestImages(content: string): IAttachmentControlUploadedValue[] {
    const urlRegex = /https:\/\/[^\s"]+/g;
    const extractedUrls = content.match(urlRegex) || [];

    return this.uploadedImageUrl.filter((image) => {
      const baseUrl = image.url.split('?')[0];
      return extractedUrls.some((url) => url.startsWith(baseUrl));
    });
  }

  resetUploadedImages(): void {
    this.uploadedImageUrl = [];
  }

  setImages(images: IAttachmentControlUploadedValue[]): void {
    this.uploadedImageUrl = images;
  }

  setUploadAsNonBinary(): void {
    this.uploadAsNonBinary = true;
  }

  setUploadAsBinary(): void {
    this.uploadAsNonBinary = false;
  }
}
