import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IClassPayload } from '@shared/interfaces/class.interface';
import {
  IPaginatedResponse,
  IResponse,
  IStudentQueryParams,
} from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { ClassDTO } from '@shared/dto-transformation/organization/organization.dto';
import {
  Class,
  ORGANIZATION_MAP_FORM_DTO,
  Student,
  STUDENT_MAP_FROM_DTO,
  StudentDTO,
} from '@shared/dto-transformation';

@Injectable({
  providedIn: 'root',
})
export class LevelsService {
  private http = inject(HttpClient);
  addClass(classPayload: IClassPayload): Observable<unknown> {
    return this.http.post(`${ApiUrl.v1BE}/classes`, classPayload);
  }

  editClass(classPayload: IClassPayload, id: number): Observable<unknown> {
    return this.http.put(`${ApiUrl.v1BE}/classes/${id}`, classPayload);
  }

  deleteClass(id: number): Observable<unknown> {
    return this.http.delete(`${ApiUrl.v1BE}/classes/${id}`);
  }

  assginStudentToClass(
    classId: number,
    studentIds: number[],
    academicYearId: number,
  ) {
    return this.http.post(`${ApiUrl.v1BE}/classes/student/assign`, {
      classId,
      studentIds,
      academicYearId,
    });
  }

  unAssignStudentFromClass(
    classId: number,
    studentIds: number[],
    academicYearId: number,
  ): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/classes/student/unassign`, {
      classId,
      studentIds,
      academicYearId: +academicYearId,
    });
  }

  getClassDetail(classId: number): Observable<Class> {
    return this.http
      .get<IResponse<ClassDTO>>(`${ApiUrl.v1BE}/classes/${classId}`)
      .pipe(map((response) => ORGANIZATION_MAP_FORM_DTO.class(response.data)));
  }

  getStudentsList(
    params?: IStudentQueryParams,
  ): Observable<IPaginatedResponse<Student[]>> {
    return this.http
      .get<IPaginatedResponse<StudentDTO[]>>(`${ApiUrl.v1BE}/students`, {
        params: {
          ...params,
        },
      })
      .pipe(
        map((response) => ({
          ...response,
          data: STUDENT_MAP_FROM_DTO.students(response.data),
        })),
      );
  }
}
