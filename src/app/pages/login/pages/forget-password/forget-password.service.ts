import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IGenericResponse, ILoginVerifyResponse } from '@auth/model';
import { ApiUrl } from '@shared/utils/api-url.util';
import { environment } from 'src/environments/environment';
import {
  IForgetPasswordPayload,
  ILoginVerifyPayload,
} from './forget-password.dto';

@Injectable({
  providedIn: 'root',
})
export class ForgetPasswordService {
  FORGET_API_URL = ApiUrl.v1Auth + '/forgot';

  private httpClient = inject(HttpClient);

  initForgetPassword(payload: IForgetPasswordPayload) {
    return this.httpClient.post<IGenericResponse>(
      `${this.FORGET_API_URL}/`,
      payload,
    );
  }

  verifyOtp(payload: ILoginVerifyPayload) {
    return this.httpClient.post<ILoginVerifyResponse>(
      `${this.FORGET_API_URL}/verify`,
      payload,
    );
  }

  setupPassword(payload: {
    studentId: number;
    nationalId: string;
    password: string;
  }) {
    const accessToken = localStorage.getItem('accessToken');
    const { nationalId, password, studentId } = payload;
    return this.httpClient.post<IGenericResponse>(
      `${ApiUrl.v1BE}/students/${studentId}/setup/password`,
      {
        nationalId,
        password,
      },
      {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      },
    );
  }
}
