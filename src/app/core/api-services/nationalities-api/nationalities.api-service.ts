import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Observable, map } from 'rxjs';
import {
  COMMON_MAP_FROM_DTO,
  Nationality,
  NationalityDTO,
} from '@shared/dto-transformation';

@Injectable()
export class NationalitiesApiService {
  private readonly http = inject(HttpClient);

  private readonly _nationalitiesList = signal<ISelectValue[]>([]);
  readonly nationalitiesList = this._nationalitiesList.asReadonly();

  getNationalitiesList(): Observable<Nationality[]> {
    return this.http
      .get<IResponse<NationalityDTO[]>>(`${ApiUrl.v1BE}/nationalities`)
      .pipe(map((resp) => COMMON_MAP_FROM_DTO.nationalities(resp.data)));
  }

  populateNationalitiesList(): Observable<any> {
    return this.getNationalitiesList().pipe(
      map((nationalities) => {
        if (!nationalities) {
          this._nationalitiesList.set([]);
        } else {
          let sortedList = nationalities.sort((a, b) => {
            if (a.displayName === 'سعودي' || a.displayName === 'Saudi')
              return -1;
            else if (b.displayName === 'سعودي' || b.displayName === 'Saudi')
              return 1;
            else return a.displayName.localeCompare(b.displayName, 'ar');
          });
          this._nationalitiesList.set(
            sortedList.map((n) => ({
              value: n.id,
              displayedValue: n.displayName,
            })),
          );
        }
      }),
    );
  }
}
