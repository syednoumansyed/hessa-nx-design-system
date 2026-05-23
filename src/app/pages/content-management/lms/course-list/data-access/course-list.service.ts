import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  StudentCourseResponseDTO,
  StudentCoursesListParams,
  StudentCourseTodoResponseDTO,
} from './course-list.dto';
import { ApiUrl } from '@shared/utils/api-url.util';
import { StudentCourse, StudentCourseTodo } from './course-list.interface';
import { LMS_COURSE_LIST_MAP_FROM_DTO } from './course-list-dto-transform';
import { ensureArray } from '@shared/utils/array.util';

@Injectable({
  providedIn: 'root',
})
export class CourseListService {
  http = inject(HttpClient);

  getStudentCoursesList(
    params: StudentCoursesListParams,
  ): Observable<StudentCourse[]> {
    return this.http
      .get<StudentCourseResponseDTO>(
        `${ApiUrl.v2BE}/courses/subjects/students`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(
        map((response) => {
          return LMS_COURSE_LIST_MAP_FROM_DTO.studentCourses(response.data);
        }),
      );
  }

  getStudentTodoWorkList(
    params: StudentCoursesListParams,
  ): Observable<StudentCourseTodo[]> {
    return this.http
      .get<StudentCourseTodoResponseDTO>(
        `${ApiUrl.v2BE}/courses/subjects/students/todo`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(
        map((response) => {
          return LMS_COURSE_LIST_MAP_FROM_DTO.studentCoursesTodo(
            ensureArray(response.data.todos),
          );
        }),
      );
  }
}
