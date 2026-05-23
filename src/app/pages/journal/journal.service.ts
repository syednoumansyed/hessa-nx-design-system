import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { JournalFieldDTO } from '@pages/journal/data-access/journal-field.dto';
import { IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { JournalDTO, JournalPayload } from './data-access/journal.dto';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Journal } from './data-access/journal.interface';
import { JOURNAL_MAP_FROM_DTO } from './data-access/journal-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  http = inject(HttpClient);

  getJournal(id: string): Observable<Journal> {
    return this.http
      .get<IResponse<JournalDTO>>(`${ApiUrl.v1BE}/journals/${id}`)
      .pipe(map((response) => JOURNAL_MAP_FROM_DTO.journal(response.data)));
  }

  deleteJournal(id: string): Observable<IResponse<JournalDTO>> {
    return this.http.delete<IResponse<JournalDTO>>(
      `${ApiUrl.v1BE}/journals/${id}`,
    );
  }

  getPersonnelJournals(
    type: 'DAILY' | 'WEEKLY',
    studentId: ObjId,
    date: number,
  ): Observable<Journal[]> {
    return this.http
      .get<
        IResponse<JournalDTO[]>
      >(`${ApiUrl.v1BE}/journals/personnel`, { params: { type, date, studentId } })
      .pipe(map((response) => response.data.map(JOURNAL_MAP_FROM_DTO.journal)));
  }

  createJournal(
    journal: JournalPayload,
  ): Observable<IResponse<{ id: string }>> {
    return this.http.post<IResponse<{ id: string }>>(
      `${ApiUrl.v1BE}/journals`,
      journal,
    );
  }

  updateJournal(
    id: ObjId,
    journal: Partial<JournalDTO>,
  ): Observable<JournalDTO> {
    return this.http.put<JournalDTO>(`${ApiUrl.v1BE}/journals/${id}`, journal);
  }

  getJournalFields(): Observable<IResponse<JournalFieldDTO>> {
    return this.http.get<IResponse<JournalFieldDTO>>(
      `${ApiUrl.v1BE}/journals/data`,
    );
  }

  acknowledgeJournal(
    id: string,
    acknowledgementComment: string,
  ): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/journals/${id}/acknowledge`, {
      acknowledgementComment,
    });
  }

  publishJournal(id: string) {
    return this.http.put(`${ApiUrl.v1BE}/journals/${id}/publish`, {
      publish: true,
    });
  }
}
