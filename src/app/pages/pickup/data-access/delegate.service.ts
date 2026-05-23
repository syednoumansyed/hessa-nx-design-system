import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiUrl } from '@shared/utils/api-url.util';
import { FileUploadService } from '@shared/services/file-upload.service';
import { IResponse } from '@shared/interfaces';
import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import {
  Delegate,
  DelegateStatus,
  CreateDelegatePayload,
  UpdateDelegatePayload,
  FileUploadResponse,
} from './delegate.interface';
import { DelegateDTO } from './delegate-dto';
import { DELEGATE_MAP_FROM_DTO } from './delegate-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class DelegateService {
  private readonly http = inject(HttpClient);
  private readonly fileUploadService = inject(FileUploadService);

  getDelegates(includeQRCode = false): Observable<Delegate[]> {
    const params = includeQRCode ? '?includeQRCode=true' : '';
    return this.http
      .get<
        IResponse<DelegateDTO[]>
      >(`${ApiUrl.v2BE}/pickup-delegators/${params}`)
      .pipe(map((res) => DELEGATE_MAP_FROM_DTO.delegates(res.data)));
  }

  getDelegateById(id: number): Observable<Delegate> {
    return this.http
      .get<IResponse<DelegateDTO>>(`${ApiUrl.v2BE}/pickup-delegators/${id}`)
      .pipe(map((res) => DELEGATE_MAP_FROM_DTO.delegate(res.data)));
  }

  uploadDelegatePhoto(
    file: File,
    pickupDelegatorId?: number,
  ): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    // In edit mode, include pickupDelegatorId in the body payload
    if (pickupDelegatorId) {
      formData.append('pickupDelegatorId', pickupDelegatorId.toString());
    }
    return this.http
      .post<
        IResponse<FileUploadResponse>
      >(`${ApiUrl.v2BE}/pickup-delegators/file/upload`, formData)
      .pipe(map((res) => res.data));
  }

  createDelegate(payload: CreateDelegatePayload): Observable<Delegate> {
    return this.http
      .post<
        IResponse<DelegateDTO>
      >(`${ApiUrl.v2BE}/pickup-delegators/`, payload)
      .pipe(map((res) => DELEGATE_MAP_FROM_DTO.delegate(res.data)));
  }

  updateDelegate(payload: UpdateDelegatePayload): Observable<Delegate> {
    const { id, ...body } = payload;
    return this.http
      .put<
        IResponse<DelegateDTO>
      >(`${ApiUrl.v2BE}/pickup-delegators/${id}`, body)
      .pipe(map((res) => DELEGATE_MAP_FROM_DTO.delegate(res.data)));
  }

  toggleDelegateStatus(
    id: number,
    status: DelegateStatus,
  ): Observable<Delegate> {
    return this.http
      .put<
        IResponse<DelegateDTO>
      >(`${ApiUrl.v2BE}/pickup-delegators/${id}/status`, { status })
      .pipe(map((res) => DELEGATE_MAP_FROM_DTO.delegate(res.data)));
  }

  deleteDelegate(id: number): Observable<void> {
    return this.http
      .delete<IResponse<null>>(`${ApiUrl.v2BE}/pickup-delegators/${id}`)
      .pipe(map(() => undefined));
  }
}
