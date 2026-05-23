import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ENGLISH_ARABIC_DIGITS_DOT_ONLY } from '@shared/constants/regex-patterns.constant';
import { IResponse } from '@shared/interfaces';
import {
  IAttachmentControlUploadedValue,
  IAttachmentControlValue,
} from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
interface IUploadUrlConfig {
  url: string;
  uploadAsFormData?: boolean;
}

type UploadUrlConfig =
  | {
      video: IUploadUrlConfig;
      file?: IUploadUrlConfig;
    }
  | {
      video?: IUploadUrlConfig;
      file: IUploadUrlConfig;
    };
interface IUploadOptions {
  uploadUrlConfig: UploadUrlConfig;
  attachments: IAttachmentControlValue[];
}

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  private readonly http = inject(HttpClient);

  uploadMediaFiles(
    args: IUploadOptions,
  ): Observable<IAttachmentControlUploadedValue[]> {
    const {
      uploadUrlConfig: { video, file },
      attachments,
    } = args;

    let observables: Array<Observable<IAttachmentControlUploadedValue>> = [];

    if (Array.isArray(attachments) && attachments.length > 0) {
      observables = attachments
        .filter((i): i is File => i instanceof File)
        .map((attachment) => {
          const isVideoFile = attachment.type.startsWith('video/');
          const uploadUrl = isVideoFile ? video!.url : file!.url;
          const shouldUseFormData = isVideoFile
            ? video?.uploadAsFormData
            : file?.uploadAsFormData;

          if (shouldUseFormData) {
            return this.uploadAsFormData(
              uploadUrl,
              attachment,
              isVideoFile ? 'video' : 'fileName',
            );
          }
          return this.uploadFile(uploadUrl, attachment);
        });
    }

    if (observables.length > 0) {
      return forkJoin(observables).pipe(
        map((resp: Array<IAttachmentControlUploadedValue>) => [
          ...this.getAlreadyUploadedFile(attachments),
          ...resp,
        ]),
      );
    }
    return of(this.getAlreadyUploadedFile(attachments));
  }

  // TODO: will refactor this method to use the `uploadMediaFiles` method
  /**
   * @deprecated Use `uploadFilesWithUrls` instead.
   */
  uploadFiles(
    url: string,
    attachments: IAttachmentControlValue[],
    isVideo = false,
  ): Observable<IAttachmentControlUploadedValue[]> {
    let observables: Array<Observable<IAttachmentControlUploadedValue>> = [];
    if (Array.isArray(attachments) && attachments) {
      observables = attachments
        .filter((i): i is File => {
          return i instanceof File;
        })
        .map((file) => {
          if (isVideo) {
            return this.uploadAsFormData(url, file, 'video');
          } else return this.uploadFile(url, file);
        });
    }
    if (observables.length) {
      return forkJoin(observables).pipe(
        map((resp: Array<IAttachmentControlUploadedValue>) => {
          return [...this.getAlreadyUploadedFile(attachments), ...resp];
        }),
      );
    }
    return of(this.getAlreadyUploadedFile(attachments));
  }

  private getAlreadyUploadedFile(
    attachments: IAttachmentControlValue[],
  ): IAttachmentControlUploadedValue[] {
    return attachments.filter(
      (
        file: IAttachmentControlValue,
      ): file is IAttachmentControlUploadedValue => 'key' in file,
    );
  }

  private uploadFile(
    url: string,
    file: File,
  ): Observable<IAttachmentControlUploadedValue> {
    const subject = new Subject<IAttachmentControlUploadedValue>();
    const reader = new FileReader();
    reader.onload = (event) => {
      this.http
        .post<IResponse<IAttachmentControlUploadedValue>>(url, {
          buffer: this.base64WithoutPrefix(event?.target?.result as string),
          filename: this.getValidName(file.name),
          mimetype: file.type,
        })
        .subscribe((resp) => {
          subject.next(resp.data);
          subject.complete();
        });
    };
    reader.readAsDataURL(file);
    return subject.asObservable();
  }

  uploadAsFormData(
    url: string,
    file: File,
    key: 'video' | 'fileName' = 'video',
  ): Observable<IAttachmentControlUploadedValue> {
    const formData = new FormData();
    formData.append(key, file);

    return this.http
      .post<IResponse<IAttachmentControlUploadedValue>>(url, formData)
      .pipe(
        switchMap((res: IResponse<IAttachmentControlUploadedValue>) => {
          return of(res.data);
        }),
      );
  }

  private base64WithoutPrefix(base64String: string) {
    return base64String.split(',')[1];
  }

  private getValidName(name: string) {
    return name
      ?.replace(ENGLISH_ARABIC_DIGITS_DOT_ONLY, '')
      ?.replace(/(?!.*\.)(\.)/g, '');
  }
}
