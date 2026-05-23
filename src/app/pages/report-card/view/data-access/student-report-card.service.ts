import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Observable, map } from 'rxjs';
import { StudentReportCardResponseDTO } from '@pages/report-card/view/data-access/student-report-card.dto';
import { StudentReportCardEntries } from '@pages/report-card/view/data-access/student-report-card.interface';
import { mapStudentReportCards } from '@pages/report-card/view/data-access/student-report-card.transform';

@Injectable({
  providedIn: 'root',
})
export class StudentReportCardService {
  private readonly http = inject(HttpClient);

  constructor() {}

  getStudentReportCards(
    studentId: number,
  ): Observable<IResponse<StudentReportCardEntries>> {
    return this.http
      .get<
        IResponse<StudentReportCardResponseDTO[]>
      >(`${ApiUrl.v1BE}/report-cards/students/${studentId}`)
      .pipe(map((resp) => this.transformResponse(resp)));
  }

  private transformResponse(
    resp: IResponse<StudentReportCardResponseDTO[]>,
  ): IResponse<StudentReportCardEntries> {
    const data = mapStudentReportCards(resp.data);
    return { ...resp, data };
  }
}
