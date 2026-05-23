import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ReportCardListParams } from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { ObjId } from '@shared/interfaces/common.interface';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  PublishReportCardParams,
  ReportCardListDTOResponse,
  StudentReportCardDTOResponse,
  StudentReportCardPreviewDTOResponse,
  StudentsReportCardParams,
} from './report-card-processing.dto';
import {
  ReportCardListResponse,
  StudentReportCardPreviewResponse,
  StudentReportCardResponse,
} from './report-card-processing.interface';
import { PROCESSING_REPORT_CARD_MAP_FROM_DTO } from './report-card-processing-dto-transform';
import { buildHttpParams } from '@shared/utils/build-http-params.utils';

@Injectable({
  providedIn: 'root',
})
export class ReportCardProcessingAPIService {
  // #region private properties
  private readonly http = inject(HttpClient);
  // #endregion

  // #region public methods
  fetchReportCardsByClass(
    params: ReportCardListParams,
  ): Observable<ReportCardListResponse> {
    let httpParams = buildHttpParams(params);
    return this.http
      .get<ReportCardListDTOResponse>(`${ApiUrl.v1BE}/report-cards/classes`, {
        params: httpParams,
      })
      .pipe(
        map((resp) => {
          return {
            ...resp,
            data: PROCESSING_REPORT_CARD_MAP_FROM_DTO.reportCardList(resp.data),
          };
        }),
      );
  }

  fetchReportCardByStudents(
    params: StudentsReportCardParams,
  ): Observable<StudentReportCardResponse> {
    return this.http
      .get<StudentReportCardDTOResponse>(
        `${ApiUrl.v1BE}/report-cards/students`,
        {
          params,
        },
      )
      .pipe(
        map((resp) => {
          return {
            ...resp,
            data: PROCESSING_REPORT_CARD_MAP_FROM_DTO.studentReportCards(
              resp.data,
            ),
          };
        }),
      );
  }

  publishReportCard(params: PublishReportCardParams): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/report-cards/students/publish`, {
      ...params,
    });
  }

  fetchStudentReportCardPreview(
    reportCardId: ObjId,
    studentId: ObjId,
  ): Observable<StudentReportCardPreviewResponse> {
    return this.http
      .get<StudentReportCardPreviewDTOResponse>(
        `${ApiUrl.v1BE}/report-cards/${reportCardId}/students/${studentId}/preview`,
      )
      .pipe(
        map((resp) =>
          PROCESSING_REPORT_CARD_MAP_FROM_DTO.studentReportCardPreview(
            resp.data,
          ),
        ),
      );
  }
  // #endregion

  constructor() {}
}
