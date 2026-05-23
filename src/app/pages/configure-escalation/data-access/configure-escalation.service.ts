import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiUrl } from '@shared/utils/api-url.util';
import { map, Observable } from 'rxjs';
import {
  CreateEscalationRequest,
  EscalationTypeDetails,
  UpdateEscalationRequest,
} from './configure-escalation.interface';
import { IResponse } from '@shared/interfaces';
import { EscalationTypeDetailsDTO } from './configure-escalation.dto';
import { CONFIGURE_ESCLATION_MAP_FROM_DTO } from './configure-esclation-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class ConfigureEscalationService {
  constructor(private http: HttpClient) {}

  getSchoolEscalations(schoolId: number): Observable<EscalationTypeDetails[]> {
    return this.http
      .get<
        IResponse<EscalationTypeDetailsDTO[]>
      >(`${ApiUrl.v1BE}/tickets/${schoolId}/settings`)
      .pipe(
        map((res) => {
          return CONFIGURE_ESCLATION_MAP_FROM_DTO.escalationTypeDetails(
            res.data,
          );
        }),
      );
  }

  createEscalationLevel(params: CreateEscalationRequest) {
    return this.http.post(`${ApiUrl.v1BE}/tickets/escalation`, params).pipe(
      map((res) => {
        return res;
      }),
    );
  }

  deleteEscalationLevel(
    escalationId: number,
    schoolId: number,
    supportTypeId: number,
  ) {
    return this.http
      .delete(
        `${ApiUrl.v1BE}/tickets/escalation/${escalationId}/school/${schoolId}/support-type/${supportTypeId}`,
      )
      .pipe(
        map((res) => {
          return res;
        }),
      );
  }

  updateEscalationLevel(escalationId: number, params: UpdateEscalationRequest) {
    return this.http
      .put(`${ApiUrl.v1BE}/tickets/escalation/${escalationId}`, params)
      .pipe(
        map((res) => {
          return res;
        }),
      );
  }
}
