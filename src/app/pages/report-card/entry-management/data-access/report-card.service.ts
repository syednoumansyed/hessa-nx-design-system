import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CourseListParams } from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import {
  ColumnSubjectEntryByIdResponseDTO,
  ColumnSubjectEntryDTO,
  ICreateColumnSubjectEntry,
  IReportCardColumn,
  IStudentMarksParam,
  ITeacherColumnParams,
  ReportCardCourseDTO,
} from '@pages/report-card/entry-management/data-access/report-card-course.dto';
import { ReportCardDetail } from '@pages/report-card/configuration/data-access/report-card-configuration.interface';
import { ReportCardDetailDTOResponse } from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { REPORT_CARD_CONFIGURATION_MAP_FROM_DTO } from '@pages/report-card/configuration/data-access/report-card-configuration-dto-transform';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map, Observable } from 'rxjs';
import { REPORT_CARD_ENTRY_MAP_FROM_DTO } from './report-card-course-dto-transform';
import {
  ColumnSubjectEntry,
  ColumnSubjectEntryByIdResponse,
  ReportCardCourse,
} from './report-card-course.interface';
import { Class, ORGANIZATION_MAP_FORM_DTO } from '@shared/dto-transformation';
import { ClassDTO } from '@shared/dto-transformation/organization/organization.dto';

@Injectable({
  providedIn: 'root',
})
export class ReportCardService {
  constructor() {}

  // #region Private Properties
  private readonly http = inject(HttpClient);
  // #endregion

  // #region Public Methods

  getCourseList(params: CourseListParams): Observable<ReportCardCourse[]> {
    return this.http
      .get<IResponse<ReportCardCourseDTO[]>>(
        `${ApiUrl.v1BE}/report-cards/courses`,
        {
          params,
        },
      )
      .pipe(
        map((res) => {
          return REPORT_CARD_ENTRY_MAP_FROM_DTO.reportCardCourses(res.data);
        }),
      );
  }

  getTeacherColumns(params: ITeacherColumnParams) {
    return this.http
      .get<IResponse<IReportCardColumn[]>>(
        `${ApiUrl.v1BE}/report-cards/columns/teacher`,
        {
          params: {
            reportCardId: params.reportCardId,
            classId: params.classId,
            subjectId: params.subjectId,
          },
        },
      )
      .pipe(
        map((res) => {
          return res.data;
        }),
      );
  }

  getReportCardDetailForTeacher(
    reportCardId: number,
  ): Observable<ReportCardDetail> {
    return this.http
      .get<ReportCardDetailDTOResponse>(
        `${ApiUrl.v1BE}/report-cards/${reportCardId}/teacher`,
      )
      .pipe(
        map((res) =>
          REPORT_CARD_CONFIGURATION_MAP_FROM_DTO.reportCardDetail(res.data),
        ),
      );
  }

  createColumnSubjectEntry(params: ICreateColumnSubjectEntry) {
    return this.http.post(
      `${ApiUrl.v1BE}/report-cards/columns/subject-entry`,
      params,
    );
  }

  updateColumnSubjectEntry(id: number, entryTitle: string) {
    return this.http.put(
      `${ApiUrl.v1BE}/report-cards/columns/subject-entry/${id}`,
      {
        title: entryTitle,
      },
    );
  }

  getColumnSubjectEntries(params: {
    reportCardColumnSubjectId: number;
  }): Observable<ColumnSubjectEntry[]> {
    return this.http
      .get<IResponse<ColumnSubjectEntryDTO[]>>(
        `${ApiUrl.v1BE}/report-cards/columns/subject-entry`,
        {
          params,
        },
      )
      .pipe(
        map((res) => {
          return REPORT_CARD_ENTRY_MAP_FROM_DTO.columnSubjectEntries(res.data);
        }),
      );
  }

  getColumnSubjectEntryById(
    id: number,
    params: { classId: number; reportCardId: number },
  ): Observable<ColumnSubjectEntryByIdResponse> {
    return this.http
      .get<IResponse<ColumnSubjectEntryByIdResponseDTO>>(
        `${ApiUrl.v1BE}/report-cards/columns/subject-entry/${id}`,
        {
          params,
        },
      )
      .pipe(
        map((res) => {
          return REPORT_CARD_ENTRY_MAP_FROM_DTO.columnSubjectEntryById(
            res.data,
          );
        }),
      );
  }

  deleteColumnSubjectEntryById(
    id: number,
    reportCardColumnId: number,
    params: { classId: number },
  ) {
    return this.http.delete(
      `${ApiUrl.v1BE}/report-cards/columns/${reportCardColumnId}/subject-entry/${id}`,
      {
        params,
      },
    );
  }

  createSubjectEntryMarks(
    subjectEntryId: number,
    reportCardColumnId: number,
    studentMarks: IStudentMarksParam[],
  ) {
    return this.http.post(
      `${ApiUrl.v1BE}/report-cards/columns/${reportCardColumnId}/subject-entry/${subjectEntryId}/marks`,
      {
        studentMarks,
      },
    );
  }
  getReportClassDetail(classId: number): Observable<Class> {
    return this.http
      .get<
        IResponse<ClassDTO>
      >(`${ApiUrl.v1BE}/report-cards/classes/${classId}`)
      .pipe(map((response) => ORGANIZATION_MAP_FORM_DTO.class(response.data)));
  }

  // #endregion
}
