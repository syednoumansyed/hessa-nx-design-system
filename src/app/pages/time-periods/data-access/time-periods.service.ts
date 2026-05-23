import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map, Observable } from 'rxjs';
import {
  ITimePeriodListItem,
  ITimePeriodPayload,
  ITimePeriodQueryParams,
  ITimePeriodUpdatePayload,
  IValidateDaysOfWeek,
  TIME_PERIOD_MAP_FROM_DTO,
  TimePeriod,
  TimePeriodDetail,
  TimePeriodDetailDTO,
  TimePeriodDTO,
} from '@shared/dto-transformation';

@Injectable({
  providedIn: 'root',
})
export class TimePeriodService {
  readonly _timePeriods = signal<ITimePeriodListItem[]>([]);
  readonly timePeriods = this._timePeriods.asReadonly();
  private _schoolLevelsList = signal<ISelectValue[]>([]);
  readonly schoolLevelsList = this._schoolLevelsList.asReadonly();

  constructor(private http: HttpClient) {}

  getTimePeriods(
    params: ITimePeriodQueryParams,
  ): Observable<IPaginatedResponse<TimePeriod[]>> {
    return this.http
      .get<IPaginatedResponse<TimePeriodDTO[]>>(`${ApiUrl.v1BE}/time-periods`, {
        params: {
          ...params,
        },
      })
      .pipe(
        map((res) => {
          return {
            ...res,
            data: TIME_PERIOD_MAP_FROM_DTO.timePeriodList(res.data),
          };
        }),
      );
  }

  validateDays(params: ITimePeriodQueryParams) {
    return this.http
      .get<IResponse<IValidateDaysOfWeek[]>>(
        `${ApiUrl.v1BE}/time-periods/validate-days`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(map((res) => res.data));
  }

  getTimePeriodById(id: number): Observable<TimePeriodDetail> {
    return this.http
      .get<IResponse<TimePeriodDetailDTO>>(`${ApiUrl.v1BE}/time-periods/${id}`)
      .pipe(
        map((res) => {
          return TIME_PERIOD_MAP_FROM_DTO.timePeriod(res.data);
        }),
      );
  }

  deleteTimePeriodWithRelationsById(id: number) {
    return this.http.delete<IResponse<null>>(
      `${ApiUrl.v1BE}/time-periods/${id}/with-relations`,
    );
  }

  postTimePeriod(timePeriod: ITimePeriodPayload) {
    return this.http.post<IResponse<ITimePeriodPayload>>(
      `${ApiUrl.v1BE}/time-periods`,
      timePeriod,
    );
  }

  deletePeriodById(id: number) {
    return this.http.delete<IResponse<null>>(`${ApiUrl.v1BE}/periods/${id}`);
  }

  updateTimePeriodById(
    timePeriodId: number,
    timePeriod: ITimePeriodUpdatePayload,
  ) {
    return this.http.put(
      `${ApiUrl.v1BE}/time-periods/${timePeriodId}`,
      timePeriod,
    );
  }
}
