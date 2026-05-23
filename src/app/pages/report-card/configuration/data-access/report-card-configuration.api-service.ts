import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ObjId } from '@shared/interfaces/common.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { buildHttpParams } from '@shared/utils/build-http-params.utils';
import { cleanObject } from '@shared/utils/clean-object.util';
import { map, Observable } from 'rxjs';
import {
  ExistingColumnDTO,
  ExistingColumnDTOResponse,
  IUpdateColumnSequenceParam,
  ManageReportCardListDTOResponse,
  ReportCardColumnFormPayload,
  ReportCardDetailDTOResponse,
  ReportCardExistingColumnPayloadDTO,
  ReportCardFormPayload,
  ReportCardListParams,
  ReportCardSubjectDTOResponse,
  ReportCardSubjectParams,
} from './report-card-configuration.model';
import {
  ReportCardCalculatedRestPayload,
  ReportCardHorizontalRestPayload,
  ReportCardSignalEntryRestPayload,
} from '../components/manage-columns/add-column/report-card-column-form-base.interface';
import { ReportCardPreviewDTO } from '@pages/report-card/configuration/data-access/report-card-preview.dto';
import { IResponse } from '@shared/interfaces';
import {
  ManageReportCardListResponse,
  ReportCardDetail,
  ReportCardSubjectResponse,
} from './report-card-configuration.interface';
import { REPORT_CARD_CONFIGURATION_MAP_FROM_DTO } from './report-card-configuration-dto-transform';
import { ReportCardPreview } from './report-card-preview.interface';

@Injectable({
  providedIn: 'root',
})
export class ReportCardConfigurationAPIService {
  // #region Private Properties
  private readonly http = inject(HttpClient);
  // #endregion

  // #region Public Methods

  fetchReportCards(
    params: ReportCardListParams,
  ): Observable<ManageReportCardListResponse> {
    let httpParams = buildHttpParams(params);

    return this.http
      .get<ManageReportCardListDTOResponse>(`${ApiUrl.v1BE}/report-cards`, {
        params: httpParams,
      })
      .pipe(
        map((res) => ({
          ...res,
          data: REPORT_CARD_CONFIGURATION_MAP_FROM_DTO.manageReportCardList(
            res.data,
          ),
        })),
      );
  }

  deleteReportCard(id: ObjId): Observable<void> {
    return this.http.delete<void>(`${ApiUrl.v1BE}/report-cards/${id}`);
  }

  createReportCard(payload: ReportCardFormPayload): Observable<{ id: ObjId }> {
    return this.http
      .post<ReportCardDetailDTOResponse>(
        `${ApiUrl.v1BE}/report-cards`,
        cleanObject(payload),
      )
      .pipe(
        map((resp) => {
          return { id: resp.data.id };
        }),
      );
  }

  updateReportCard(id: ObjId, payload: ReportCardFormPayload) {
    return this.http.put(
      `${ApiUrl.v1BE}/report-cards/${id}`,
      cleanObject(payload),
    );
  }

  getReportCardById(id: ObjId): Observable<ReportCardDetail> {
    return this.http
      .get<ReportCardDetailDTOResponse>(`${ApiUrl.v1BE}/report-cards/${id}`)
      .pipe(
        map((resp) => {
          return REPORT_CARD_CONFIGURATION_MAP_FROM_DTO.reportCardDetail(
            resp.data,
          );
        }),
      );
  }

  fetchSubjects(
    params: ReportCardSubjectParams,
  ): Observable<ReportCardSubjectResponse> {
    // Create an HttpParams instance and set the non-array params
    let httpParams = buildHttpParams(params);
    return this.http
      .get<ReportCardSubjectDTOResponse>(
        `${ApiUrl.v1BE}/report-cards/subjects`,
        {
          params: httpParams,
        },
      )
      .pipe(
        map((res) => REPORT_CARD_CONFIGURATION_MAP_FROM_DTO.subjects(res.data)),
      );
  }
  // #endregion

  // #region Column api

  createSingleEntryColumn(payload: ReportCardSignalEntryRestPayload) {
    return this.addReportCardColumn(payload);
  }

  updateSingleEntryColumn(
    columnId: ObjId,
    payload: ReportCardSignalEntryRestPayload,
  ) {
    return this.updateReportCardColumn(columnId, payload);
  }

  createHorizontalColumn(payload: ReportCardHorizontalRestPayload) {
    return this.addReportCardColumn(payload);
  }

  updateHorizontalColumn(
    columnId: ObjId,
    payload: ReportCardHorizontalRestPayload,
  ) {
    return this.updateReportCardColumn(columnId, payload);
  }

  createCalculatedColumn(payload: ReportCardCalculatedRestPayload) {
    return this.addReportCardColumn(payload);
  }

  updateCalculatedColumn(
    columnId: ObjId,
    payload: ReportCardCalculatedRestPayload,
  ) {
    return this.updateReportCardColumn(columnId, payload);
  }

  deleteReportCardColumn(id: ObjId): Observable<void> {
    return this.http.delete<void>(`${ApiUrl.v1BE}/report-cards/columns/${id}`);
  }

  createExistingColumn(payload: ReportCardExistingColumnPayloadDTO) {
    return this.http.post(
      `${ApiUrl.v1BE}/report-cards/columns/existing`,
      cleanObject(payload),
    );
  }

  getExistingColumns(id: ObjId): Observable<ExistingColumnDTO> {
    return this.http
      .get<ExistingColumnDTOResponse>(
        `${ApiUrl.v1BE}/report-cards/columns/${id}/existing`,
      )
      .pipe(map((res) => res.data));
  }

  updateExistingColumn(id: ObjId, payload: ReportCardExistingColumnPayloadDTO) {
    return this.http.put(
      `${ApiUrl.v1BE}/report-cards/columns/${id}/existing`,
      cleanObject(payload),
    );
  }

  deleteExistingColumn(id: number): Observable<void> {
    return this.http.delete<void>(
      `${ApiUrl.v1BE}/report-cards/columns/${id}/existing`,
    );
  }

  hideColumn(id: ObjId, isHide: boolean): Observable<void> {
    return this.http.put<void>(
      `${ApiUrl.v1BE}/report-cards/columns/${id}/hide`,
      {
        isHide,
      },
    );
  }

  getReportCardPreview(id: ObjId): Observable<ReportCardPreview> {
    return this.http
      .get<
        IResponse<ReportCardPreviewDTO>
      >(`${ApiUrl.v1BE}/report-cards/${id}/preview`)
      .pipe(
        map((resp) =>
          REPORT_CARD_CONFIGURATION_MAP_FROM_DTO.reportCardPreview(resp.data),
        ),
      );
  }

  updateColumnSequence(params: IUpdateColumnSequenceParam) {
    return this.http.put(
      `${ApiUrl.v1BE}/report-cards/columns/sequences`,
      params,
    );
  }

  private addReportCardColumn(
    payload:
      | ReportCardColumnFormPayload
      | ReportCardCalculatedRestPayload
      | ReportCardHorizontalRestPayload
      | ReportCardSignalEntryRestPayload,
  ) {
    return this.http.post(
      `${ApiUrl.v1BE}/report-cards/columns`,
      cleanObject(payload),
    );
  }

  private updateReportCardColumn(
    columnId: ObjId,
    payload:
      | ReportCardColumnFormPayload
      | ReportCardCalculatedRestPayload
      | ReportCardHorizontalRestPayload
      | ReportCardSignalEntryRestPayload,
  ) {
    return this.http.put(
      `${ApiUrl.v1BE}/report-cards/columns/${columnId}`,
      cleanObject(payload),
    );
  }
  // #endregion
}
