import { inject, Injectable } from '@angular/core';
import {
  CourseDetailTodoItem,
  CourseDetailTodoResponseDto,
  FetchCourseDetailParams,
  StudentCourseDetailDTO,
} from './course-detail.dto';
import { HttpClient } from '@angular/common/http';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map } from 'rxjs/internal/operators/map';
import { Observable } from 'rxjs';
import { IResponse } from '@shared/interfaces';
import { CourseDetailForStudent } from './course-detail.interface';
import { LMS_COURSE_DETAIL_MAP_FROM_DTO } from './course-detail-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class CourseDetailApiService {
  private readonly http = inject(HttpClient);

  fetchCourseContents(
    params: FetchCourseDetailParams,
  ): Observable<CourseDetailForStudent[]> {
    return this.http
      .get<StudentCourseDetailDTO>(
        ApiUrl.v2BE + '/courses/subjects/students/contents',
        {
          params,
        },
      )
      .pipe(
        map((response) =>
          LMS_COURSE_DETAIL_MAP_FROM_DTO.coursesDetailForStudent(response.data),
        ),
      );
  }

  fetchCourseDetailTodo(
    params: FetchCourseDetailParams,
  ): Observable<CourseDetailTodoItem[]> {
    return this.http
      .get<CourseDetailTodoResponseDto>(
        ApiUrl.v2BE + '/courses/subjects/students/contents/todo',
        {
          params,
        },
      )
      .pipe(map((response) => response.data?.todos || []));
  }
}
