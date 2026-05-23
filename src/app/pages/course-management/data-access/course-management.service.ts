import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { ApiParam } from '@core/api-services/role-api/dto/role.dto';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map, Observable } from 'rxjs';
import { CourseManagementDTO, CourseSubjectDTO } from './course-management.dto';
import { CourseManagement, CourseSubject } from './course-management.interface';
import { COURSE_MANAGEMENT_MAP_FROM_DTO } from './course-management-dto-transform';
import { ensureArray } from '@shared/utils/array.util';
import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';

@Injectable({
  providedIn: 'root',
})
export class CourseManagementService {
  constructor(private http: HttpClient) {}

  private _teacherAndSubjectList = signal<Array<TeacherSubjectList>>([]);
  teacherAndSubjectList = this._teacherAndSubjectList.asReadonly();

  addCourse(payload: any): Observable<any> {
    return this.http.post(`${ApiUrl.v1BE}/courses`, payload);
  }

  editCourse(id: number, payload: any): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/courses/${id}`, payload);
  }

  getAllSubjects(): Observable<CourseSubject[]> {
    return this.http
      .get<IResponse<CourseSubjectDTO[]>>(`${ApiUrl.v1BE}/subjects`)
      .pipe(map((res) => COURSE_MANAGEMENT_MAP_FROM_DTO.subjects(res.data)));
  }

  getSubjectsByPersonnelId(personnelId: number): Observable<CourseSubject[]> {
    return this.http
      .get<
        IResponse<CourseSubjectDTO[]>
      >(`${ApiUrl.v1BE}/personnels/${personnelId}/subjects`)
      .pipe(map((res) => COURSE_MANAGEMENT_MAP_FROM_DTO.subjects(res.data)));
  }

  getSubjectById(id: number): Observable<CourseSubject> {
    return this.http
      .get<IResponse<CourseSubjectDTO>>(`${ApiUrl.v1BE}/subjects/${id}`)
      .pipe(map((res) => COURSE_MANAGEMENT_MAP_FROM_DTO.subject(res.data)));
  }

  getCourses(
    params: Partial<ApiParam>,
  ): Observable<IPaginatedResponse<CourseManagement[]>> {
    return this.http
      .get<IPaginatedResponse<CourseManagementDTO[]>>(
        `${ApiUrl.v1BE}/courses`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(
        map((res) => {
          return {
            ...res,
            data: COURSE_MANAGEMENT_MAP_FROM_DTO.coursesManagement(res.data),
          };
        }),
      );
  }

  getCourseById(id?: number) {
    return this.http.get<any>(`${ApiUrl.v1BE}/courses/${id}`);
  }

  deleteCourse(id: number, hasContents: boolean) {
    return this.http.delete<any>(
      hasContents
        ? `${ApiUrl.v1BE}/courses/${id}/contents`
        : `${ApiUrl.v1BE}/courses/${id}`,
    );
  }

  getSubjectAndTeacherData(
    params?: Record<string, unknown>,
  ): Observable<TeacherSubject[]> {
    return this.http
      .get<TeacherSubjectResponseDTO>(
        `${ApiUrl.v1BE}/courses/table-filters-data`,
        params && Object.keys(params).length ? { params: params as any } : {},
      )
      .pipe(
        map((res) => {
          return ensureArray(res.data).map((subject) => ({
            id: subject.id,
            displayName: getLocalizedName(subject),
            displayedValue: getLocalizedName(subject),
            value: subject.id,
            courses: ensureArray(subject.courses).map((course) => ({
              id: course.id,
              personnel: {
                id: course.personnel.id,
                displayName: getLocalizedFullName(course.personnel),
                displayedValue: getLocalizedFullName(course.personnel),
                value: course.personnel.id,
              },
            })),
          }));
        }),
      );
  }

  loadSubjectAndTeacherData(): Promise<void> {
    return new Promise((res, rej) => {
      this.getSubjectAndTeacherData().subscribe({
        next: (data) => {
          this._teacherAndSubjectList.set(data);
          res();
        },
        error: (error) => rej(error),
      });
    });
  }
}

// dto
interface TeacherSubjectDTO {
  id: number;
  arName: string;
  enName: string;
  courses: TeacherSubjectCourseDTO[];
}

interface TeacherSubjectCourseDTO {
  id: number;
  personnel: TeacherSubjectPersonnelDTO;
}

interface TeacherSubjectPersonnelDTO {
  id: number;
  arFullName: string;
  enFullName: string;
}

export type TeacherSubjectResponseDTO = IResponse<TeacherSubjectDTO[]>;

export interface TeacherSubjectList extends ISelectValue {}

// map-interface from dto
export interface TeacherSubject {
  id: number;
  displayName: string;
  displayedValue: string;
  value: number;
  courses: TeacherSubjectCourse[];
}

interface TeacherSubjectCourse {
  id: number;
  personnel: TeacherSubjectPersonnel;
}

interface TeacherSubjectPersonnel {
  id: number;
  displayName: string;
  displayedValue: string;
  value: number;
}
