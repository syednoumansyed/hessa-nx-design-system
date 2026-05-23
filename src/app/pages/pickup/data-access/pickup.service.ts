import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import {
  GuardianPickupParams,
  PickupResponse,
  PersonnelPickupParams,
  Timeline,
  DenialReason,
  FetchPickupRequestsParams,
} from '@shared/dto-transformation/pick-up/pickup.interface';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  DenialReasonDTO,
  PICK_UP_MAP_FROM_DTO,
  PickupResponseDTO,
  TimelineDTO,
} from '@shared/dto-transformation';

@Injectable({
  providedIn: 'root',
})
export class PickupService {
  // Cached denial reasons
  private cachedDenialReasons = signal<DenialReason[] | null>(null);

  constructor(private http: HttpClient) {}

  getGuardianPickupRequests(
    params: GuardianPickupParams,
  ): Observable<IPaginatedResponse<PickupResponse[]>> {
    return this.http
      .get<IPaginatedResponse<PickupResponseDTO[]>>(
        `${ApiUrl.v2BE}/pickups/guardian`,
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
            data: PICK_UP_MAP_FROM_DTO.pickups(res.data),
          };
        }),
      );
  }

  getPersonnelPickupRequests(
    params: PersonnelPickupParams,
  ): Observable<PickupResponse[]> {
    return this.http
      .get<IResponse<PickupResponseDTO[]>>(`${ApiUrl.v2BE}/pickups/personnel`, {
        params: {
          ...params,
        },
      })
      .pipe(
        map((res) => {
          return PICK_UP_MAP_FROM_DTO.pickups(res.data);
        }),
      );
  }

  getPickupTimelineById(id: number): Observable<Timeline[]> {
    return this.http
      .get<IResponse<TimelineDTO[]>>(`${ApiUrl.v2BE}/pickups/timeline/${id}`)
      .pipe(
        map((res) => {
          return PICK_UP_MAP_FROM_DTO.timelines(res.data);
        }),
      );
  }

  getDenialReasons(): Observable<DenialReason[]> {
    // Return cached data if available
    const cached = this.cachedDenialReasons();
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<IResponse<DenialReasonDTO[]>>(`${ApiUrl.v2BE}/pickups/denied-option`)
      .pipe(
        map((res) => PICK_UP_MAP_FROM_DTO.denialReasons(res.data)),
        tap((reasons) => this.cachedDenialReasons.set(reasons)),
      );
  }

  getCachedDenialReasons(): DenialReason[] | null {
    return this.cachedDenialReasons();
  }

  getPickupHistoryForAdmin(
    params: FetchPickupRequestsParams,
  ): Observable<IPaginatedResponse<PickupResponse[]>> {
    return this.http
      .get<IPaginatedResponse<PickupResponseDTO[]>>(
        `${ApiUrl.v2BE}/pickups/history`,
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
            data: PICK_UP_MAP_FROM_DTO.pickups(res.data),
          };
        }),
      );
  }
}
