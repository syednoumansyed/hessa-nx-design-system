import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  AttendanceDetailDto,
  StudentAttendanceDetailParams,
  StudentAttendanceDetailsResponseDto,
} from './student-attendance-detail.model';
import { map, Observable } from 'rxjs';
import { cleanObject } from '@shared/utils/clean-object.util';
import { formatDate } from 'date-fns';
import { ApiUrl } from '@shared/utils/api-url.util';
import { STUDENT_ATTENDANCE_DETAIL_MAP_FROM_DTO } from './student-attendance-detail-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class StudentAttendanceDetailService {
  private readonly http = inject(HttpClient);
  fetchStudentAttendanceDetails(
    studentId: ObjId,
    params: StudentAttendanceDetailParams,
  ): Observable<AttendanceDetailDto> {
    const newParam = {
      ...params,
      fromDate: params.fromDate
        ? formatDate(params.fromDate, 'yyyy-MM-dd')
        : undefined,
      toDate: params.toDate
        ? formatDate(params.toDate, 'yyyy-MM-dd')
        : undefined,
    };
    const paramsObj = cleanObject(newParam);

    return this.http
      .get<StudentAttendanceDetailsResponseDto>(
        `${ApiUrl.v2BE}/attendances/students/${studentId}`,
        {
          params: paramsObj,
        },
      )
      .pipe(
        map((res) => {
          return STUDENT_ATTENDANCE_DETAIL_MAP_FROM_DTO.detail(res.data);
        }),
      );
  }
  constructor() {}
}
