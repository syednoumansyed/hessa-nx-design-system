import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FileUploadService } from '@shared/services/file-upload.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { map, Observable } from 'rxjs';
import {
  DocumentListResponseDTO,
  DocumentResponseDTO,
  HelpCenterDocumentRequest,
  HelpCenterDocumentType,
} from './documentation-dto';
import {
  HelpCenterDocument,
  HelpCenterDocumentListItem,
} from './documentation.interface';
import { HELP_CENTER_DOCUMENTATION_MAP_FROM_DTO } from './documentation-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class DocumentationService {
  private readonly fileuploadService = inject(FileUploadService);
  constructor(private http: HttpClient) {}

  createDocumentation(data: HelpCenterDocumentRequest) {
    return this.http.post(`${ApiUrl.v1BE}/articles`, data);
  }

  updateDocumentation(docId: number, data: HelpCenterDocumentRequest) {
    return this.http.put(`${ApiUrl.v1BE}/articles/${docId}`, data);
  }

  uploadVideo(attachments: IAttachmentControlValue[]) {
    return this.fileuploadService.uploadMediaFiles({
      uploadUrlConfig: {
        video: {
          url: `${ApiUrl.v1BE}/articles/video/upload`,
          uploadAsFormData: true,
        },
      },

      attachments: attachments,
    });
  }

  fetchDocumentationById(docId: number): Observable<HelpCenterDocument> {
    return this.http
      .get<DocumentResponseDTO>(`${ApiUrl.v1BE}/articles/${docId}`)
      .pipe(
        map((resp) => {
          return HELP_CENTER_DOCUMENTATION_MAP_FROM_DTO.DocumentDetail(
            resp.data,
          );
        }),
      );
  }

  fetchDocuments(
    params: FetchDocumentsParam,
  ): Observable<HelpCenterDocumentListItem[]> {
    return this.http
      .get<DocumentListResponseDTO>(`${ApiUrl.v1BE}/articles`, {
        params: {
          articleType: params.articleType,
          language: params.language,
          ...(params.searchText && { searchText: params.searchText }),
        },
      })
      .pipe(
        map((resp) => {
          return HELP_CENTER_DOCUMENTATION_MAP_FROM_DTO.documentListItem(
            resp.data,
          );
        }),
      );
  }

  deleteDocumentation(docId: number) {
    return this.http.delete(`${ApiUrl.v1BE}/articles/${docId}`);
  }
}

type FetchDocumentsParam = {
  language: string;
  articleType: HelpCenterDocumentType;
  searchText: string;
};
