import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { UserInfo } from '@auth/model';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { TranslocoService } from '@jsverse/transloco';
import {
  Guardian,
  GUARDIAN_MAP_FROM_DTO,
  GuardianDTO,
  Student,
  STUDENT_MAP_FROM_DTO,
  StudentDTO,
} from '@shared/dto-transformation';
import {
  Gender,
  GuardianRelationship,
  UserStatus,
  UserType,
} from '@shared/enums';
import {
  IPaginatedResponse,
  IPagination,
  IPausedPayload,
  IResponse,
  IStudentQueryParams,
  Idropdown,
} from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { FeedbackService } from '@shared/services/feedback.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { deepClean } from '@shared/utils/deep-clean.util';
import { ToastrService } from 'ngx-toastr';
import { Observable, map } from 'rxjs';
import { mapLocalizedSortFullName } from '@shared/utils/map-localized-sort-full-name.util';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  private feedbackService = inject(FeedbackService);
  private http = inject(HttpClient);
  private translocoService = inject(TranslocoService);
  private toaster = inject(ToastrService);
  private authService = inject(AuthService);

  private _guardiansDropdownList = signal<Idropdown[]>([]);
  readonly guardiansDropdownList = this._guardiansDropdownList.asReadonly();
  private _guardiansPagination = signal<IPagination | undefined>(undefined);
  readonly guardiansPagination = this._guardiansPagination.asReadonly();
  private _guardiansListSearchText = signal<string | undefined>(undefined);

  updateGuardiansListSearchText(v: string | undefined) {
    this._guardiansListSearchText.set(v);
  }

  getGuardiansList(
    params?: IStudentQueryParams,
    update = false,
    event?: InfiniteScrollCustomEvent,
  ) {
    const queryParams = mapLocalizedSortFullName(params);

    return this.http
      .get<IPaginatedResponse<GuardianDTO[]>>(`${ApiUrl.v1BE}/guardians`, {
        params: {
          ...queryParams,
          ...(this._guardiansListSearchText() && {
            searchText: this._guardiansListSearchText(),
          }),
        },
      })
      .subscribe({
        next: (res) => {
          const guardians = GUARDIAN_MAP_FROM_DTO.guardians(res.data);
          if (update) {
            const nextList: any = guardians.map((n) => ({
              value: n.id,
              displayedValue: n.displayName,
              ...n,
            }));
            this._guardiansDropdownList.update((list) => {
              return list.concat(nextList);
            });
            event?.target.complete();
          } else {
            const list: any = guardians.map((n) => ({
              value: n.id,
              displayedValue: n.displayName,
              ...n,
            }));
            list.unshift({
              value: -1,
              displayedValue: this.translocoService.translate([
                'action.guardian.new.add',
              ]),
            });
            this._guardiansDropdownList.set(list);
          }
          this._guardiansPagination.set(res.paginate);
        },
        error: (err) => {
          this._guardiansDropdownList.set([
            {
              value: -1,
              displayedValue: this.translocoService.translate([
                'action.guardian.new.add',
              ]),
            },
          ]);
          this._guardiansPagination.set(err.error.paginate);
        },
      });
  }

  /**
   * Creates a new student.
   * @param student - The student payload.
   * @returns An observable that emits the response from the server.
   */
  createStudent(student: StudentRequest): Observable<any> {
    return this.http.post(`${ApiUrl.v1BE}/students`, deepClean(student));
  }

  /**
   * Updates a student with the specified ID.
   * @param studentId - The ID of the student to update.
   * @param student - The partial payload containing the updated student data.
   * @returns An Observable that emits the response from the server.
   */
  updateStudent(
    studentId: string,
    student: Partial<StudentRequest>,
  ): Observable<any> {
    return this.http.put(
      `${ApiUrl.v1BE}/students/${studentId}`,
      deepClean(student),
    );
  }

  /**
   * Retrieves a student by their ID.
   * @param id - The ID of the student to retrieve.
   * @returns An Observable that emits the student data.
   */
  getStudent(id: number | string): Observable<Student> {
    return this.http
      .get<IResponse<StudentDTO>>(`${ApiUrl.v1BE}/students/${id}`)
      .pipe(
        map((res) => {
          return STUDENT_MAP_FROM_DTO.student(res.data);
        }),
      );
  }

  /**
   * Links a guardian to a student.
   *
   * @param studentId - The ID of the student.
   * @param guardianId - The ID of the guardian.
   * @returns An Observable that emits the response from the server.
   */
  linkGuardian(studentId: string, guardianId: string): Observable<any> {
    return this.http.put(
      `${ApiUrl.v1BE}/students/${studentId}/guardians/${guardianId}/link`,
      {},
    );
  }

  /**
   * Unlinks a guardian from a student.
   * @param studentId The ID of the student.
   * @param guardianId The ID of the guardian.
   * @returns An Observable that emits the result of the unlink operation.
   */
  unlinkGuardian(studentId: string, guardianId: string): Observable<any> {
    return this.http.put(
      `${ApiUrl.v1BE}/students/${studentId}/guardians/${guardianId}/unlink`,
      {},
    );
  }

  /**
   * Deactivates a student by updating their status to 'INACTIVE'.
   * @param studentId - The ID of the student to deactivate.
   * @returns An Observable that emits the response from the server.
   */
  deactivateStudent(studentId: ObjId, reason: string): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/students/${studentId}/status`, {
      status: 'INACTIVE',
      reason: reason,
    });
  }

  /**
   * Activates a student by updating their status to 'ACTIVE'.
   * @param studentId - The ID of the student to activate.
   * @returns An Observable that emits the response from the server.
   */
  activateStudent(studentId: ObjId): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/students/${studentId}/status`, {
      status: 'ACTIVE',
    });
  }

  fetchActiveOrPausedStudents(
    additionalParams: IStudentQueryParams | undefined,
    pathSuffix?: string,
  ) {
    const defaultParams: Partial<IStudentQueryParams> = {
      userStatuses: [UserStatus.ACTIVE, UserStatus.PAUSED].join(','),
    };

    const params = {
      ...defaultParams,
      ...additionalParams,
    };

    return this.fetchStudents(params, pathSuffix);
  }

  fetchStudents(
    params: IStudentQueryParams | undefined,
    pathSuffix?: string,
  ): Observable<IPaginatedResponse<Student[]>> {
    const queryParams = mapLocalizedSortFullName(params);

    const endpoint = pathSuffix
      ? `${ApiUrl.v1BE}/${pathSuffix}`
      : `${ApiUrl.v1BE}/students`;
    return this.http
      .get<IPaginatedResponse<StudentDTO[]>>(endpoint, {
        params: {
          ...queryParams,
        },
      })
      .pipe(
        map((resp) => {
          return {
            data: STUDENT_MAP_FROM_DTO.students(resp.data),
            paginate: resp.paginate,
          };
        }),
      );
  }

  /* shared methods between listing and profile pages */
  onDeactivateStudent = async (onConfirm: () => void) => {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'global.deactivate_account.title',
        ),
        modalMessage: this.translocoService.translate(
          'user_management.deactivate_account_alert.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'global.yes_deactivate.btn',
        ),
        secondaryBtnStr: this.translocoService.translate(
          'global.no_cancel.btn',
        ),
      },
      () => onConfirm(),
    );
  };
  async onDeactivateStudentSuccess() {
    this.toaster.success(
      '',
      this.translocoService.translate('global.successfully_deactivated.txt'),
    );
  }
  async onDeactivateStudentError(onConfirm: () => void) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translocoService.translate('global.wrong_msg.title'),
        modalMessage: this.translocoService.translate(
          'user_management.unsuccessfully_deactivating_account.txt',
        ),
        primaryBtnStr: this.translocoService.translate('global.try_again.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => onConfirm(),
    );
  }
  async onActivateStudent(onConfirm: () => void) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'global.activate_account.title',
        ),
        modalMessage: this.translocoService.translate(
          'user_management.activate_account_alert.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'global.yes_activate.btn',
        ),
        secondaryBtnStr: this.translocoService.translate(
          'global.no_cancel.btn',
        ),
      },
      () => onConfirm(),
    );
  }
  async onActivateStudentSuccess() {
    this.toaster.success(
      '',
      this.translocoService.translate('global.successfully_activated.txt'),
    );
  }

  async onActivateStudentError(onConfirm: () => void) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translocoService.translate('global.wrong_msg.title'),
        modalMessage: this.translocoService.translate(
          'user_management.unsuccessfully_activating_account.txt',
        ),
        primaryBtnStr: this.translocoService.translate('global.try_again.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => onConfirm(),
    );
  }

  onPauseStudentSuccess() {
    this.feedbackService.openFeedbackModal({
      type: 'success',
      modalTitle: this.translocoService.translate(
        'deactivation_paused_user.account_paused_successfully.txt',
      ),
      primaryBtnStr: this.translocoService.translate('global.back_to_home.btn'),
    });
  }

  onResumeStudent(endTime: string, onConfirm: () => void) {
    this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.translate(
          'deactivation_paused_user.resume_account_msg.title',
        ),
        modalMessage: this.translocoService.translate(
          'deactivation_paused_user.resume_account_msg.txt',
          { date: endTime },
        ),
        primaryBtnStr: this.translocoService.translate('global.confirm.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => onConfirm(),
    );
  }

  onResumeStudentSuccess() {
    this.toaster.success(
      '',
      this.translocoService.translate('user_management.account.resume.success'),
    );
  }

  getTeachersByStudentId(id: number) {
    const userData: UserInfo = this.authService.user()!;
    const endpoint =
      userData.type == UserType.STUDENT
        ? `${ApiUrl.v1BE}/students/${id}/teachers`
        : `${ApiUrl.v1BE}/students/${userData.userTypeId}/${id}/teachers`;
    return this.http.get<IResponse<any>>(endpoint).pipe(
      map((res) => {
        return res.data;
      }),
    );
  }

  /**
   * Change password for a student
   * @param id Student ID
   * @param payload Password change payload containing new and old password
   */
  changePassword(
    id: string,
    payload: { password: string; oldPassword?: string },
  ) {
    return this.http
      .put<
        IResponse<any>
      >(`${ApiUrl.v1BE}/students/${id}/change-password`, payload)
      .pipe(
        map((res) => {
          return res.data;
        }),
      );
  }

  uploadProfilePicture(studentId: number, file: File) {
    const formData = new FormData();
    formData.append('fileName', file);
    formData.append('studentId', studentId.toString());
    return this.http
      .post<IResponse<any>>(`${ApiUrl.v1BE}/students/file/upload`, formData)
      .pipe(
        map((res) => {
          return res.data;
        }),
      );
  }

  pauseStudent(studentId: ObjId, payload: IPausedPayload): Observable<any> {
    return this.http.put(
      `${ApiUrl.v1BE}/students/${studentId}/status`,
      payload,
    );
  }

  /**
   * Bulk update student status across pages.
   * @param queryParams - Same query params as fetchStudents (filters, search, sort)
   * @param body - Optional body with studentIds/excludeStudentIds + status + reason + startTime + endTime
   */
  bulkUpdateStudentStatus(
    queryParams: Record<string, any>,
    body: {
      studentIds?: number[];
      excludeStudentIds?: number[];
      status: string;
      reason?: string;
      startTime?: number;
      endTime?: number;
    },
  ): Observable<any> {
    const cleanParams = mapLocalizedSortFullName(queryParams);
    return this.http.put(`${ApiUrl.v1BE}/students/bulk/status`, body, {
      params: { ...cleanParams },
    });
  }

  /**
   * Export students to CSV.
   * @param queryParams - Same query params as fetchStudents
   * @param body - Optional body with studentIds/excludeStudentIds + fieldsToExtract
   */
  exportStudentsCsv(
    queryParams: Record<string, any>,
    body: {
      studentIds?: number[];
      excludeStudentIds?: number[];
      fieldsToExtract: string[];
    },
  ): Observable<{ success: boolean; message: string; data: string }> {
    const cleanParams = mapLocalizedSortFullName(queryParams);
    return this.http.post<{
      success: boolean;
      message: string;
      data: string;
    }>(`${ApiUrl.v1BE}/students/export/csv`, body, {
      params: { ...cleanParams },
    });
  }
}

export interface StudentRequest {
  arFullName: string;
  enFullName: string;
  nationalId: string;
  nationalityId: number;
  dateOfBirth: number;
  gender: Gender;
  countryCode?: string;
  phoneNumber?: string;
  passportNumber?: string;
  passportExpiryDate?: number;
  pioneerId?: string;
  registrationDate: number;
  schoolId?: number;
  levelId?: number;
  classId?: number | null;
  guardianIdsAndRelationships: {
    id: number;
    guardianRelationship: GuardianRelationship;
  }[];
  guardians: StudentGuardianRequest[];
  academicYearId?: number;
}

export interface StudentGuardianRequest {
  arFullName: string;
  enFullName: string;
  nationalId: string;
  guardianRelationship: string;
  countryCode: string;
  phoneNumber: string;
  gender: Gender;
}
