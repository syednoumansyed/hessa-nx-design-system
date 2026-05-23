import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  JournalResponseDTO,
  LatestJournalEntryDTO,
} from './student-journals.dto';
import { map, Observable } from 'rxjs';
import { JournalCardData } from './student-journals.interface';
import { STUDENT_JOURNALS_MAP_FROM_DTO } from './student-journals-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class StudentsJournalsService {
  private readonly http = inject(HttpClient);

  private readonly _hasJournals = signal<boolean | null>(null);
  readonly hasJournals = this._hasJournals.asReadonly();

  setHasJournals(value: boolean) {
    this._hasJournals.set(value);
  }

  /**
   * Lightweight check that calls the journal API with a single item
   * and updates hasJournals based on whether any journals exist.
   * Only updates the signal to `true` (never resets to false) to avoid
   * layout thrashing when journals still don't exist.
   */
  checkHasJournals(studentId?: number): void {
    const params: Record<string, string> = {
      pageNumber: '1',
      itemsPerPage: '1',
      startDate: '1750704000',
      sortByColumn: 'updatedAt',
      order: 'desc',
    };
    if (studentId) {
      params['studentId'] = studentId.toString();
    }
    this.http
      .get<JournalResponseDTO>(`${ApiUrl.v1BE}/journals/student-guardian`, {
        params,
      })
      .subscribe({
        next: (response) => {
          if (response.data?.length > 0) {
            this._hasJournals.set(true);
          }
        },
      });
  }

  public getLatestJournalForStudent(
    studentId: number,
  ): Observable<JournalCardData[]> {
    return this.http
      .get<{
        success: boolean;
        message: string;
        data: LatestJournalEntryDTO[];
      }>(`${ApiUrl.v1BE}/journals/student/${studentId}/latest`)
      .pipe(
        map((response) => {
          return STUDENT_JOURNALS_MAP_FROM_DTO.feedLatestJournals(
            response.data,
          );
        }),
      );
  }
}
