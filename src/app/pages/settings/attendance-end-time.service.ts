import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ObjId } from '@shared/interfaces/common.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { cleanObject } from '@shared/utils/clean-object.util';
import { map, Observable } from 'rxjs';
import {
  ExtendedTimeResponseDTO,
  GlobalEndTimeResponseDTO,
  IExtendTimePayload,
  ISchoolEndTimePayload,
} from './data-access/attendance-end-time.dto';
import { ExtendedTimeResponse } from './data-access/attendance-end-time.interface';
import { ATTENDANCE_END_TIME_MAP_FROM_DTO } from './data-access/attendance-end-time.transform';

@Injectable({
  providedIn: 'root',
})
export class AttendanceEndTimeService {
  // #region Private Properties
  private readonly http = inject(HttpClient);

  // #endregion

  // #region Public Methods

  createGlobalEndTime(endTime: string) {
    return this.http.post(`${ApiUrl.v1BE}/attendances/time`, {
      endTime: endTime,
    });
  }

  fetchGlobalEndTime(): Observable<GlobalEndTimeResponseDTO> {
    return this.http.get<GlobalEndTimeResponseDTO>(
      `${ApiUrl.v1BE}/attendances/time`,
    );
  }

  updateGlobalEndTime(id: ObjId, endTime: string) {
    return this.http.put(`${ApiUrl.v1BE}/attendances/time/${id}`, {
      endTime: endTime,
    });
  }

  createExtendedEndTime(payload: ISchoolEndTimePayload) {
    return this.http.post(`${ApiUrl.v1BE}/attendances/school/time`, payload);
  }

  fetchExtendedEndTime(
    params: Partial<IExtendTimePayload>,
  ): Observable<ExtendedTimeResponse> {
    return this.http
      .get<ExtendedTimeResponseDTO>(`${ApiUrl.v1BE}/attendances/school/time`, {
        params: cleanObject(params),
      })
      .pipe(
        map((dto) => ({
          ...dto,
          data: ATTENDANCE_END_TIME_MAP_FROM_DTO.extendedEndTimeList(dto.data),
        })),
      );
  }

  updateExtendedEndTime(id: ObjId, payload: ISchoolEndTimePayload) {
    return this.http.put(
      `${ApiUrl.v1BE}/attendances/school/time/${id}`,
      payload,
    );
  }

  deleteExtendedEndTime(id: ObjId) {
    return this.http.delete(`${ApiUrl.v1BE}/attendances/school/time/${id}`);
  }
  // #endregion
}
