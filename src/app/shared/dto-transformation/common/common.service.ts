import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { GlobalClassDTO } from './common.dto';
import { COMMON_MAP_FROM_DTO } from './common-dto-transform';
import { map, Observable } from 'rxjs';
import { GlobalClass } from './common.interface';

@Injectable({
  providedIn: 'root',
})
export class CommonApiService {
  private http = inject(HttpClient);

  getClassList(): Observable<GlobalClass[]> {
    return this.http
      .get<IResponse<GlobalClassDTO[]>>(`${ApiUrl.v2BE}/global-classes`)
      .pipe(map((resp) => COMMON_MAP_FROM_DTO.globalClass(resp.data)));
  }
}
