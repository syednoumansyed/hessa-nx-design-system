import { computed, inject, Injectable, signal } from '@angular/core';
import {
  IGenericResponse,
  ILoginVerifyResponse,
  LOGIN_CHANNEL,
  UserInfo,
  UserProfile,
} from '@auth/model';
import { map, Observable } from 'rxjs';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@utils/api-url.util';
import { HttpClient } from '@angular/common/http';
import { UserType } from '@shared/enums';
import {
  AuthFlowService,
  FlowType,
} from '@pages/login/services/auth-flow.service';
import {
  Guardian,
  GUARDIAN_MAP_FROM_DTO,
  GuardianDTO,
  Personnel,
  PERSONNEL_MAP_FROM_DTO,
  PersonnelDTO,
  Student,
  STUDENT_MAP_FROM_DTO,
  StudentDTO,
} from '@shared/dto-transformation';
import { DsActionListConfig } from '@ds/action-list';

@Injectable({
  providedIn: 'root',
})
export class LoginDataService {
  private http = inject(HttpClient);
  private authFlowService = inject(AuthFlowService);
  loginRes = signal<ILoginVerifyResponse | null>(null);
  otpChannel = signal<LOGIN_CHANNEL>('sms');
  otp = signal('');
  mobileNumber = signal('');
  isPasswordSetup = computed(
    () => this.loginRes()?.data.userInfo.isPasswordSetup ?? false,
  );
  showButtonLoading = signal(false);
  isNameSetupRequired = signal(true);
  users = signal<Array<UserProfile>>([]);
  nationalId = signal('');
  user = signal<UserProfile | null>(null);
  tempAuthHeaders = signal<{ [key: string]: string } | null>(null);
  authHeaders = computed(() => {
    const loginRes = this.loginRes();
    if (!loginRes) return null;
    return {
      authorization: `Bearer ${loginRes?.data.token.accessToken}`,
      refreshToken: loginRes?.data.token.refreshToken,
    };
  });

  constructor() {}

  /**
   * Retrieves a student by their ID.
   * @param id - The ID of the student to retrieve.
   * @returns An Observable that emits the student data.
   */
  getStudent(id: number | string): Observable<Student> {
    const headers = this.authHeaders() ?? this.tempAuthHeaders() ?? null;
    return this.http
      .get<
        IResponse<StudentDTO>
      >(`${ApiUrl.v1BE}/students/${id}`, headers ? { headers } : undefined)
      .pipe(map((res) => STUDENT_MAP_FROM_DTO.student(res.data)));
  }

  /**
   * Retrieves a personnel by their ID.
   * @param id - The ID of the personnel to retrieve.
   * @returns An Observable that emits the personnel data.
   */
  getPersonnel(id: number | string): Observable<Personnel> {
    const headers = this.authHeaders() ?? this.tempAuthHeaders() ?? null;
    return this.http
      .get<
        IResponse<PersonnelDTO>
      >(`${ApiUrl.v1BE}/personnels/${id}`, headers ? { headers } : undefined)
      .pipe(map((res) => PERSONNEL_MAP_FROM_DTO.personnel(res.data)));
  }

  /**
   * Retrieves a guardian by their ID.
   * @param id - The ID of the guardian to retrieve.
   * @returns An Observable that emits the guardian data.
   */
  getGuardian(id: number | string): Observable<Guardian> {
    const headers = this.authHeaders() ?? this.tempAuthHeaders() ?? null;
    return this.http
      .get<
        IResponse<GuardianDTO>
      >(`${ApiUrl.v1BE}/guardians/${id}`, headers ? { headers } : undefined)
      .pipe(map((res) => GUARDIAN_MAP_FROM_DTO.guardian(res.data)));
  }

  setPreferredName(id: number, preferredName: string) {
    const headers = this.authHeaders() ?? null;
    return this.http.put<IResponse<UserInfo>>(
      `${ApiUrl.v2BE}/users/${id}/preferred-name`,
      { preferredName },
      headers ? { headers } : undefined,
    );
  }

  loadAccountDetails() {
    const selected = this.authFlowService.selectedAccount();
    if (!selected) return;

    const id = selected.userTypeId;

    switch (selected.type) {
      case UserType.STUDENT:
        return this.getStudent(id).pipe(
          map((d) => this.mapUserDetailsToProfile(d, UserType.STUDENT)),
        );
      case UserType.GUARDIAN:
        return this.getGuardian(id).pipe(
          map((d) => this.mapUserDetailsToProfile(d, UserType.STUDENT)),
        );
      case UserType.PERSONNEL:
        return this.getPersonnel(id).pipe(
          map((d) => this.mapUserDetailsToProfile(d, UserType.STUDENT)),
        );
      default:
        return this.mapUserDetailsToProfile(null);
    }
  }

  isPasswordSetupRequired(): boolean {
    const flowType = this.authFlowService.getCurrentState().flowType;
    const isPassRequired =
      this.loginRes()?.data.userInfo.type === UserType.STUDENT &&
      !this.isPasswordSetup();
    return (
      (flowType === FlowType.ONBOARDING ||
        flowType === FlowType.FORGOT_PASSWORD ||
        isPassRequired) &&
      this.loginRes()?.data.userInfo.type === UserType.STUDENT
    );
  }

  private mapUserDetailsToProfile(
    details: Student | Guardian | Personnel | null,
    type?: UserType,
  ) {
    if (!details) return;

    const preferred = details.preferredName;
    this.nationalId.set(details.nationalId);
    this.isNameSetupRequired.set(!details.preferredName);
    this.authFlowService.givenName.set(preferred ?? null);
  }

  setupPassword(payload: {
    studentId: number;
    nationalId: string;
    password: string;
  }) {
    const headers = this.authHeaders() ?? this.tempAuthHeaders() ?? null;
    const { nationalId, password, studentId } = payload;
    return this.http.post<IGenericResponse>(
      `${ApiUrl.v2BE}/students/${studentId}/setup/password`,
      {
        nationalId,
        password,
      },
      headers ? { headers } : undefined,
    );
  }
}
