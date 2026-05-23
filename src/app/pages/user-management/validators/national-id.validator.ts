import { Injectable, WritableSignal, inject } from '@angular/core';
import { NationalIdApiService } from '../services/national-id.api-service';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { Gender, UserType } from '@shared/enums';
import { Observable, delay, map, of, switchMap, tap } from 'rxjs';

export enum NationalIdValidatorLengthType {
  SAUDI = 'SAUDI',
  OTHER = 'OTHER',
}

@Injectable({
  providedIn: 'root',
})
export class NationalIdValidatorService {
  private readonly nationalIdApiService = inject(NationalIdApiService);

  createValidator(
    userType: UserType,
    nationIdExistForTypeMsg: WritableSignal<string>,
    updateId?: string,
    lengthType: NationalIdValidatorLengthType = NationalIdValidatorLengthType.SAUDI,
  ) {
    return (control: AbstractControl): Observable<ValidationErrors | null> =>
      of(control.value).pipe(
        delay(500),
        tap(() => {
          nationIdExistForTypeMsg?.set('');
        }),
        switchMap((nationalId) => {
          const valueStr = nationalId?.toString() || '';
          let validLength = false;
          if (lengthType === NationalIdValidatorLengthType.SAUDI) {
            validLength = valueStr.length === 10;
          } else {
            validLength = valueStr.length >= 8 && valueStr.length <= 18;
          }
          if (
            !nationalId ||
            isNaN(+nationalId) ||
            !validLength ||
            (updateId && updateId === valueStr)
          )
            return of(null);

          return this.nationalIdApiService
            .isNationalIdInUse(+nationalId, userType)
            .pipe(
              switchMap((inUseResp) => {
                if (inUseResp?.type === 'existForDifferentType') {
                  return this.nationalIdApiService
                    .getUserByNationId(+nationalId)
                    .pipe(
                      tap((userResponse) => {
                        nationIdExistForTypeMsg.set(inUseResp.message);
                        (control.parent as FormGroup).patchValue({
                          fullName: userResponse.fullName,
                          phoneNumber: userResponse.phoneNumber,
                          gender: userResponse.gender as Gender,
                        });
                      }),
                      map(() => null),
                    );
                } else if (inUseResp?.type === 'existForSameType') {
                  return of({ existForSameType: true });
                }
                return of(null);
              }),
            );
        }),
      );
  }
}
