import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { UserType } from '@shared/enums';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Observable, catchError, map, of } from 'rxjs';
import {
  UserDTO,
  UserNationIdInUseResponseDTO,
  UserResponseDTO,
} from './user.dto';

type NationalIdInUseType = 'existForSameType' | 'existForDifferentType';

@Injectable({
  providedIn: 'root',
})
export class NationalIdApiService {
  private readonly http = inject(HttpClient);

  getUserByNationId(nationalId: number): Observable<UserDTO> {
    return this.http
      .get<UserResponseDTO>(`${ApiUrl.v1BE}/users/${nationalId}`)
      .pipe(map((resp) => resp.data));
  }

  isNationalIdInUse(
    nationalId: number,
    type: UserType,
  ): Observable<{
    message: string;
    type: NationalIdInUseType;
  } | null> {
    return this.http
      .post<UserNationIdInUseResponseDTO>(
        `${ApiUrl.v1BE}/users/${nationalId}/validate`,
        {
          type,
        },
      )
      .pipe(
        map((response) => {
          return {
            message: response.message,
            type: 'existForDifferentType' as NationalIdInUseType,
          };
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 409) {
            return of({
              message: error.message,
              type: 'existForSameType' as NationalIdInUseType,
            });
          }
          return of(null);
        }),
      );
  }
}
