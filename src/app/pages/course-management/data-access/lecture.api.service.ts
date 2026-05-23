import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { PeriodDTO } from '@pages/course-management/data-access/courses-list.dto';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map } from 'rxjs';
import {
  AddLecturePayloadDTO,
  LectureResponseDTO,
} from './course-management.dto';

@Injectable({
  providedIn: 'root',
})
export class LectureApiService {
  private readonly http = inject(HttpClient);
  timePeriods = signal<PeriodDTO[]>([]);

  constructor() {}

  fetchPeriods(params: {}) {
    this.timePeriods.set([]);
    return this.getTimePeriods(params).pipe(
      map((resp) => {
        this.timePeriods.set(resp.data);
        return resp.data;
      }),
    );
  }
  getTimePeriods(params: {}) {
    return this.http.get<IResponse<PeriodDTO[]>>(`${ApiUrl.v1BE}/periods`, {
      params,
    });
  }

  addLecture(payload: AddLecturePayloadDTO) {
    return this.http.post(`${ApiUrl.v1BE}/lectures`, payload);
  }

  updateLecture(lectureId: number, payload: AddLecturePayloadDTO) {
    return this.http.put(`${ApiUrl.v1BE}/lectures/${lectureId}`, payload);
  }

  fetchLectureById(lectureId: number) {
    return this.http
      .get<LectureResponseDTO>(`${ApiUrl.v1BE}/lectures/${lectureId}`)
      .pipe(map((resp) => resp.data));
  }

  deleteLecture(lectureId: number) {
    return this.http.delete(`${ApiUrl.v1BE}/lectures/${lectureId}`);
  }
  fetchLectureBySubjectIdClassId(
    subjectId: number,
    classId: number,
    academicYearId: number,
  ) {
    return this.http
      .get<LectureResponseDTO>(
        `${ApiUrl.v1BE}/lectures/filter-by-subject-and-class`,
        {
          params: {
            subjectId,
            classId,
            academicYearId,
          },
        },
      )
      .pipe(map((resp) => resp.data));
  }
}
