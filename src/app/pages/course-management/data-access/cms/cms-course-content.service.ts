import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { IPaginatedResponse, IPagination, IResponse } from '@shared/interfaces';
import { FileUploadService } from '@shared/services/file-upload.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { catchError, map, Observable, of } from 'rxjs';
import {
  CourseTopicDTO,
  CourseTopicPayload,
  CourseTopicsQueryParamsDTO,
} from '../course-content.dto';
import { ObjId } from '@shared/interfaces/common.interface';
import { CMSWeeksListResponseDTO } from './cms-week.dto';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Injectable()
export class CMSCourseContentService {
  private http = inject(HttpClient);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly translationService = inject(HesTranslateService);

  private readonly _courseTopics = signal<CourseTopicDTO[]>([]);
  courseTopics = this._courseTopics.asReadonly();

  private readonly _courseTopicsPagination = signal<IPagination | null>(null);
  courseTopicsPagination = this._courseTopicsPagination.asReadonly();

  constructor() {}

  getCourseTopics(
    params: Partial<CourseTopicsQueryParamsDTO>,
    update = false,
    event?: InfiniteScrollCustomEvent,
  ) {
    return this.http
      .get<IPaginatedResponse<CourseTopicDTO[]>>(
        `${ApiUrl.v1BE}/courses/cms/topics`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(
        map((res) => {
          if (update) {
            this._courseTopics.update((list) => {
              return list.concat(res.data);
            });
            event?.target.complete();
          } else {
            this._courseTopics.set(res.data);
          }
          this._courseTopicsPagination.set(res.paginate);
          return res;
        }),
        catchError((err) => {
          this._courseTopics.set([]);
          this._courseTopicsPagination.set(err.error.paginate);
          return of(null);
        }),
      );
  }

  getCourseTopicById(topicId: number) {
    return this.http
      .get<IResponse<CourseTopicDTO>>(
        `${ApiUrl.v1BE}/courses/cms/topics/${topicId}`,
        {
          params: {
            academicYearId:
              this.academicYearScopeService.selectedAcademicYear()?.id!,
          },
        },
      )
      .pipe(
        map((res) => {
          return res;
        }),
      );
  }

  addCourseTopic(payload: CourseTopicPayload) {
    return this.http.post(`${ApiUrl.v1BE}/courses/cms/topics`, {
      ...payload,
    });
  }

  updateCourseTopic(topicId: number, payload: Partial<CourseTopicPayload>) {
    return this.http.put(`${ApiUrl.v1BE}/courses/cms/topics/${topicId}`, {
      ...payload,
    });
  }

  deleteAttachment(attachmentId: string) {
    return this.http.delete(
      `${ApiUrl.v1BE}/courses/cms/topics/file/${attachmentId}`,
    );
  }

  deleteCourseTopic(topicId: number) {
    return this.http.delete(`${ApiUrl.v1BE}/courses/cms/topics/${topicId}`);
  }

  uploadAttachments(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadMediaFiles({
      uploadUrlConfig: {
        file: {
          url: `${ApiUrl.v1BE}/courses/cms/topics/file/upload`,
          uploadAsFormData: true,
        },
      },
      attachments: attachments,
    });
  }

  uploadVideos(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadMediaFiles({
      uploadUrlConfig: {
        video: {
          url: `${ApiUrl.v1BE}/courses/cms/topics/video/upload`,
          uploadAsFormData: true,
        },
      },

      attachments: attachments,
    });
  }

  updateTopicByIndex(index: number, topic: CourseTopicDTO) {
    this._courseTopics.update((v) => {
      v[index] = topic;
      return [...v];
    });
  }

  getWeeksForTopic(args: {
    topicId?: ObjId;
    courseId: ObjId;
    semesterId: ObjId;
  }) {
    return this.http.get<CMSWeeksListResponseDTO>(
      `${ApiUrl.v2BE}/weeks/topics`,
      {
        params: {
          ...(args.topicId && { topicId: args.topicId }),
          courseId: args.courseId,
          semesterId: args.semesterId,
        },
      },
    );
  }

  getWeeksListForDropdown(args: {
    topicId?: ObjId;
    courseId: ObjId;
    semesterId: ObjId;
  }): Observable<ISelectValue[]> {
    return this.getWeeksForTopic(args).pipe(
      map((resp) => {
        return resp.data
          .filter((week) => week.available)
          .map((week) => ({
            displayedValue:
              this.translationService.t(`week.txt`) + ` ${week.weekNumber}`,
            value: week.id,
          }));
      }),
    );
  }
}
