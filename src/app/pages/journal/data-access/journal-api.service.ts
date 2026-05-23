import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FetchJournalsParams, JournalsResponseDTO } from './journal.dto';
import { ObjId } from '@shared/interfaces/common.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { IPaginatedResponse } from '@shared/interfaces';
import { Journal } from './journal.interface';
import { JOURNAL_MAP_FROM_DTO } from './journal-dto-transform';
import { mapLocalizedSortFullName } from '@shared/utils/map-localized-sort-full-name.util';

@Injectable({
  providedIn: 'root',
})
export class JournalApiService {
  http = inject(HttpClient);

  getPersonnelJournals(
    params: FetchJournalsParams,
  ): Observable<IPaginatedResponse<Journal[]>> {
    const queryParams = mapLocalizedSortFullName(params);
    return this.http
      .get<JournalsResponseDTO>(`${ApiUrl.v1BE}/journals/personnel`, {
        params: {
          ...queryParams,
        },
      })
      .pipe(
        map((response) => ({
          ...response,
          data: JOURNAL_MAP_FROM_DTO.journals(response.data),
        })),
      );
  }

  getGuaridanJournals(
    params: FetchJournalsParams,
  ): Observable<IPaginatedResponse<Journal[]>> {
    return this.http
      .get<JournalsResponseDTO>(`${ApiUrl.v1BE}/journals/student-guardian`, {
        params: {
          ...params,
        },
      })
      .pipe(
        map((response) => ({
          ...response,
          data: JOURNAL_MAP_FROM_DTO.journals(response.data),
        })),
      );
  }

  deleteJournal(id: ObjId): Observable<void> {
    return this.http.delete<void>(`${ApiUrl.v1BE}/journals/${id}`);
  }
}
