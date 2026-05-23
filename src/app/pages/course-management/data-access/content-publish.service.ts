import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContentPublishDTO } from '@pages/course-management/data-access/content-publish.dto';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map, Observable } from 'rxjs';
import { ContentPublish } from './content-publish.interface';
import { CONTENT_PUBLISH_MAP_FROM_DTO } from './content-publish-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class ContentPublishService {
  constructor(private http: HttpClient) {}

  getExamPublishData(
    id: number,
    classIds: number[] = [],
  ): Observable<ContentPublish> {
    const params: any = {};
    if (classIds.length > 0) {
      params.classIds = classIds.join(',');
    }
    return this.http
      .get<
        IResponse<ContentPublishDTO>
      >(`${ApiUrl.v1BE}/courses/cms/exams/${id}/publish`, { params })
      .pipe(
        map((res) => {
          return CONTENT_PUBLISH_MAP_FROM_DTO.contentPublish(res.data);
        }),
      );
  }

  public putExamPublishData(id: number, payload: any) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/cms/exams/${id}/publish`,
      payload,
    );
  }

  getAssignmentPublishData(
    id: number,
    classIds: number[] = [],
  ): Observable<ContentPublish> {
    const params: any = {};
    if (classIds.length > 0) {
      params.classIds = classIds.join(',');
    }
    return this.http
      .get<
        IResponse<ContentPublishDTO>
      >(`${ApiUrl.v1BE}/courses/cms/assignments/${id}/publish`, { params })
      .pipe(
        map((res) => {
          return CONTENT_PUBLISH_MAP_FROM_DTO.contentPublish(res.data);
        }),
      );
  }

  public putAssignmentPublishData(id: number, payload: any) {
    return this.http.put(
      `${ApiUrl.v1BE}/courses/cms/assignments/${id}/publish`,
      payload,
    );
  }

  getAttachmentPublishData(
    id: number,
    classIds: number[] = [],
  ): Observable<ContentPublish> {
    const params: any = {};
    if (classIds.length > 0) {
      params.classIds = classIds.join(',');
    }
    return this.http
      .get<
        IResponse<ContentPublishDTO>
      >(`${ApiUrl.v1BE}/attachments/${id}/publish`, { params })
      .pipe(
        map((res) => {
          return CONTENT_PUBLISH_MAP_FROM_DTO.contentPublish(res.data);
        }),
      );
  }

  public putAttachmentPublishData(id: number, payload: any) {
    return this.http.put(`${ApiUrl.v1BE}/attachments/${id}/publish`, payload);
  }
}
