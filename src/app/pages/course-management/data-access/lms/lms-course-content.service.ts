import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { IPaginatedResponse, IPagination, IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { catchError, map, of } from 'rxjs';
import {
  CourseTopicDTO,
  CourseTopicsQueryParamsDTO,
} from '../course-content.dto';

@Injectable()
export class LMSCourseContentService {
  private http = inject(HttpClient);

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
        `${ApiUrl.v1BE}/courses/lms/topics`,
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

  getCourseTopicById(topicId: string, studentId: number) {
    return this.http.get<IResponse<CourseTopicDTO>>(
      `${ApiUrl.v1BE}/courses/lms/topics/${topicId}/student/${studentId}`,
    );
  }

  updateTopicByIndex(index: number, topic: CourseTopicDTO) {
    this._courseTopics.update((v) => {
      v[index] = topic;
      return v;
    });
  }
}
