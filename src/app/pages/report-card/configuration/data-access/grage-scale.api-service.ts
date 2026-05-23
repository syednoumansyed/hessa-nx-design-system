import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ObjId } from '@shared/interfaces/common.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { cleanObject } from '@shared/utils/clean-object.util';
import { Observable } from 'rxjs';
import {
  GradeScaleParams,
  LetterGradeSaclesUpdatePayload,
  LetterGradeScaleListResponseDTO,
  LetterGradeScaleResponseDTO,
  LetterGradeScalesPayload,
} from './grade-scales.model';

@Injectable({
  providedIn: 'root',
})
export class GradeScaleAPIService {
  // #region Private Properties
  private readonly http = inject(HttpClient);
  // #endregion

  // #region Public Methods

  createGradeScales(payload: LetterGradeScalesPayload): Observable<unknown> {
    return this.http.post(`${ApiUrl.v1BE}/grade-scales`, payload);
  }

  getGradeScales(
    params: GradeScaleParams,
  ): Observable<LetterGradeScaleListResponseDTO> {
    return this.http.get<LetterGradeScaleListResponseDTO>(
      `${ApiUrl.v1BE}/grade-scales`,
      {
        params: cleanObject(params),
      },
    );
  }

  getGradeScale(id: ObjId): Observable<LetterGradeScaleResponseDTO> {
    return this.http.get<LetterGradeScaleResponseDTO>(
      `${ApiUrl.v1BE}/grade-scales/${id}`,
    );
  }

  updateGradeScale(
    id: ObjId,
    payload: LetterGradeSaclesUpdatePayload,
  ): Observable<unknown> {
    return this.http.put(`${ApiUrl.v1BE}/grade-scales/${id}`, payload);
  }

  deleteGradeScale(id: ObjId): Observable<unknown> {
    return this.http.delete(`${ApiUrl.v1BE}/grade-scales/${id}`);
  }

  deleteGrade(gradeId: ObjId): Observable<unknown> {
    return this.http.delete(`${ApiUrl.v1BE}/grades/${gradeId}`);
  }
  // #endregion
}
