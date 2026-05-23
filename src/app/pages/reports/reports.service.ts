import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RoleApiService } from '@core/api-services/role-api/role.api-service';
import { AnnouncementUserResponseDTO } from '@pages/announcements/data-access/post.dto';
import { HelpCenterSupportTicketsService } from '@pages/help-center/data-access/support-tickets.service';
import { DefaultRoles } from '@shared/enums';
import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { HesFileService } from '@shared/services/hes-file.service';
import { map, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ReportItemDTO, ReportParamsDTO } from './reports';
import { buildIndexedParams } from '@shared/utils/build-indexed-params.util';
import { ApiUrl } from '@shared/utils/api-url.util';
import { getLocalizedFullName } from '@shared/utils/localization.util';
import { AnnouncementUserResponse } from '@pages/announcements/data-access/post.interface';
import { ANOUNCEMENT_POST_MAP_FROM_DTO } from '@pages/announcements/data-access/post-dto-transform';
@Injectable()
export class ReportsService {
  private http = inject(HttpClient);
  private supportTicketsService = inject(HelpCenterSupportTicketsService);
  private readonly roleApiService = inject(RoleApiService);
  private readonly fileService = inject(HesFileService);

  constructor() {}

  generateReport(payload: any, endpoint: string) {
    const url = `${ApiUrl.v1BE}/reports/${endpoint}`;
    return this.http.post<IResponse<string>>(url, { ...payload });
  }

  fetchReportHistory(
    params: ReportParamsDTO,
  ): Observable<IPaginatedResponse<ReportItemDTO[]>> {
    return this.http.get<IPaginatedResponse<ReportItemDTO[]>>(
      `${ApiUrl.v1BE}/reports`,
      {
        params: buildIndexedParams(params),
      },
    );
  }

  loadRoles() {
    return this.roleApiService.fetchRolesForDropDown().pipe(
      map((resp) => {
        return resp.filter(
          (v) =>
            v.displayedValue !== DefaultRoles.STUDENT &&
            v.displayedValue !== DefaultRoles.GUARDIAN,
        );
      }),
    );
  }

  getTicketAssigneesByTarget(params: {
    targets: { entityId: number; type: string; name: string }[];
  }) {
    return this.supportTicketsService.getTicketAssigneesByTarget(params).pipe(
      map((res) => {
        return res.map(
          (item: { id: number; arFullName: string; enFullName: string }) => {
            return {
              value: item,
              displayedValue: getLocalizedFullName(item),
            };
          },
        );
      }),
    );
  }

  getTicketInitiatorsByTarget(params: {
    targets: { entityId: number; type: string; name: string }[];
  }) {
    return this.supportTicketsService.getTicketInitiatorsByTarget(params).pipe(
      map((res) => {
        return res.map(
          (item: { id: number; arFullName: string; enFullName: string }) => {
            return {
              value: item,
              displayedValue: getLocalizedFullName(item),
            };
          },
        );
      }),
    );
  }

  getSmsSendersList() {
    return this.http.get(`${ApiUrl.v1BE}/announcements/senders`).pipe(
      map((res: any) => {
        return res.data.map((item: any) => {
          return {
            value: item,
            displayedValue: getLocalizedFullName(item),
          };
        });
      }),
    );
  }

  getUsers(params: any): Observable<AnnouncementUserResponse> {
    return this.http
      .post<AnnouncementUserResponseDTO>(`${ApiUrl.v1BE}/announcements/users`, {
        ...params,
      })
      .pipe(
        map((res) => {
          return {
            ...res,
            data: ANOUNCEMENT_POST_MAP_FROM_DTO.announcementUsers(res.data),
          };
        }),
      );
  }
}
