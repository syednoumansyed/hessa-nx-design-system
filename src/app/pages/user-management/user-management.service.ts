import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IGenericResponse } from '@auth/model';
import { UserType } from '@shared/enums';
import { ApiUrl } from '@shared/utils/api-url.util';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private http = inject(HttpClient);

  sendChangeNumberReq(
    userType: UserType,
    userId: string,
    newPhoneNumber: string,
  ) {
    return this.http.post<IGenericResponse>(
      `${ApiUrl.v1BE}/${userType.toLowerCase()}s/${userId}/phone-number/send-otp`,
      {
        phoneNumber: newPhoneNumber,
        userType,
      },
    );
  }

  verifyOtp(
    userType: UserType,
    userId: string,
    otp: string,
    newPhoneNumber: string,
  ) {
    return this.http.put<IGenericResponse>(
      `${ApiUrl.v1BE}/${userType.toLowerCase()}s/${userId}/phone-number/verify-otp`,
      {
        otp,
        phoneNumber: newPhoneNumber,
        userType,
      },
    );
  }
}
