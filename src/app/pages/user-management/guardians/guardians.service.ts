import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { TranslocoService } from '@jsverse/transloco';
import {
  Guardian,
  GUARDIAN_MAP_FROM_DTO,
  GuardianDTO,
  STUDENT_MAP_FROM_DTO,
  StudentDTO,
} from '@shared/dto-transformation';
import { Gender, StudentRelationship, UserStatus } from '@shared/enums';
import {
  IGuardianListItem,
  IGuardianQueryParams,
  IPaginatedResponse,
  IPagination,
  IResponse,
  IStudentQueryParams,
  Idropdown,
} from '@shared/interfaces';
import { FeedbackService } from '@shared/services/feedback.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { deepClean } from '@shared/utils/deep-clean.util';
import { Observable, map } from 'rxjs';
import { mapLocalizedSortFullName } from '@shared/utils/map-localized-sort-full-name.util';

@Injectable({
  providedIn: 'root',
})
export class GuardianService {
  private feedbackService = inject(FeedbackService);
  private http = inject(HttpClient);
  private translocoService = inject(TranslocoService);

  private studentsSignal = signal<Idropdown[]>([]);
  readonly studentsDropdown = this.studentsSignal.asReadonly();

  private _studentsPagination = signal<IPagination | undefined>(undefined);
  readonly studentsPagination = this._studentsPagination.asReadonly();

  private _studentsListSearchText = signal<string | undefined>(undefined);

  /**
   * Retrieves a guardian by their ID.
   * @param id - The ID of the guardian to retrieve.
   * @param queryParams - Optional query parameters (e.g., { studentClassStatus: 'ACTIVE' })
   * @returns An Observable that emits the guardian data.
   */
  getGuardian(
    id: number | string,
    queryParams?: { studentClassStatus?: string },
  ): Observable<Guardian> {
    return this.http
      .get<IResponse<GuardianDTO>>(`${ApiUrl.v1BE}/guardians/${id}`, {
        params: queryParams ? { ...queryParams } : {},
      })
      .pipe(
        map((res) => {
          return GUARDIAN_MAP_FROM_DTO.guardian(res.data);
        }),
      );
  }
  populateStudents(v: Idropdown[]) {
    this.studentsSignal.set(v);
  }

  getStudentsList(
    params?: IStudentQueryParams,
    update = false,
    event?: InfiniteScrollCustomEvent,
  ) {
    const queryParams = mapLocalizedSortFullName(params);

    return this.http
      .get<IPaginatedResponse<StudentDTO[]>>(`${ApiUrl.v1BE}/students`, {
        params: {
          ...queryParams,
          ...(this._studentsListSearchText() && {
            searchText: this._studentsListSearchText(),
          }),
        },
      })
      .subscribe({
        next: (res) => {
          const students = STUDENT_MAP_FROM_DTO.students(res.data);
          if (update) {
            const nextList: any = students.map((n) => ({
              value: n.id,
              displayedValue: n.displayName,
              ...n,
            }));
            this.studentsSignal.update((list) => {
              return list.concat(nextList);
            });
            event?.target.complete();
          } else {
            const list = students.map((n) => ({
              value: n.id,
              displayedValue: n.displayName,
            }));
            list.unshift({
              value: -1,
              displayedValue: this.translocoService.translate([
                'action.student.new.add',
              ]),
            });
            this.populateStudents(list);
          }
          this._studentsPagination.set(res.paginate);
        },
        error: (err) => {
          this.populateStudents([
            {
              value: -1,
              displayedValue: this.translocoService.translate([
                'action.guardian.new.add',
              ]),
            },
          ]);
          this._studentsPagination.set(err.error.paginate);
        },
      });
  }

  getActiveOrPausedStudents(
    additionalParams?: Partial<IStudentQueryParams>,
    update = false,
    event?: InfiniteScrollCustomEvent,
  ) {
    const defaultParams: Partial<IStudentQueryParams> = {
      userStatuses: [UserStatus.ACTIVE, UserStatus.PAUSED].join(','),
    };

    const params = {
      ...defaultParams,
      ...additionalParams,
    };

    return this.getStudentsList(params, update, event);
  }

  /**
   * Creates a new guardian.
   * @param guardian - The guardian payload.
   * @returns An observable that emits the response from the server.
   */
  createGuardian(guardian: GuardianRequest): Observable<any> {
    return this.http.post(`${ApiUrl.v1BE}/guardians`, deepClean(guardian));
  }

  /**
   * Updates a guardian with the specified ID.
   * @param guardianId - The ID of the guardian to update.
   * @param guardian - The partial payload containing the updated guardian data.
   * @returns An Observable that emits the response from the server.
   */
  updateGuardian(
    guardianId: string,
    guardian: Partial<GuardianRequest>,
  ): Observable<any> {
    return this.http.put(
      `${ApiUrl.v1BE}/guardians/${guardianId}`,
      deepClean(guardian),
    );
  }

  /**
   * Deactivates a guardian by updating their status to 'INACTIVE'.
   * @param guardianId - The ID of the guardian to deactivate.
   * @returns An Observable that emits the response from the server.
   */
  deactivateGuardian(guardianId: string): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/guardians/${guardianId}/status`, {
      status: 'INACTIVE',
    });
  }

  /**
   * Activates a guardian by updating their status to 'ACTIVE'.
   * @param guardianId - The ID of the guardian to activate.
   * @returns An Observable that emits the response from the server.
   */
  activateGuardian(guardianId: string): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/guardians/${guardianId}/status`, {
      status: 'ACTIVE',
    });
  }

  getGuardiansList(
    params?: IGuardianQueryParams,
  ): Observable<IPaginatedResponse<Guardian[]>> {
    const queryParams = mapLocalizedSortFullName(params);

    return this.http
      .get<IPaginatedResponse<GuardianDTO[]>>(`${ApiUrl.v1BE}/guardians`, {
        params: {
          ...queryParams,
        },
      })
      .pipe(
        map((res) => {
          const guardians = GUARDIAN_MAP_FROM_DTO.guardians(res.data);
          return { ...res, data: guardians };
        }),
      );
  }

  mapGuardiansToGuardianListItems(guardians: Guardian[]): IGuardianListItem[] {
    return guardians.map((guardian) => {
      return {
        id: guardian.id,
        displayName: guardian.displayName,
        phoneNumber: guardian.countryCode + guardian.phoneNumber,
        displayPhoneNumber: guardian.displayPhoneNumber,
        gender: guardian.gender,
        nationalId: guardian.nationalId,
        student: guardian.students?.map((s) => s.displayName).join(', ') ?? '',
        linkedStudents: (guardian.students ?? []).map((s) => ({
          name: s.displayName,
          schoolName: s.school?.displayName ?? '',
        })),
        actions: '',
        status: guardian.status,
        userId: guardian.userId,
        campusId: [
          ...new Set(guardian.campuses?.map((s) => s.displayName)),
        ].join(', '),
        schoolId: [
          ...new Set(guardian.schools?.map((s) => s?.displayName)),
        ].join(', '),
        companyId: [
          ...new Set(guardian.companies?.map((s) => s?.displayName)),
        ].join(', '),
        academicYearId: guardian?.academicYears
          ?.map((item) => item.name)
          ?.join(', '),
        lastActive: guardian.userEvent
          ? guardian.userEvent[0]?.createdAt
          : null,
      };
    });
  }

  /* shared methods between listing and profile */
  onDeactivateGuardian = async (onConfirm: () => void) => {
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

  async onActivateGuardian(onConfirm: () => void) {
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

  updateStudentsListSearchText(v: string | undefined) {
    this._studentsListSearchText.set(v);
  }

  /**
   * Bulk update guardian status across pages.
   */
  bulkUpdateGuardianStatus(
    queryParams: Record<string, any>,
    body: {
      guardianIds?: number[];
      excludeGuardianIds?: number[];
      status: string;
      reason?: string;
      startTime?: number;
      endTime?: number;
    },
  ): Observable<any> {
    const cleanParams = mapLocalizedSortFullName(queryParams);
    return this.http.put(`${ApiUrl.v1BE}/guardians/bulk/status`, body, {
      params: { ...cleanParams },
    });
  }

  /**
   * Export guardians to CSV.
   */
  exportGuardiansCsv(
    queryParams: Record<string, any>,
    body: {
      guardianIds?: number[];
      excludeGuardianIds?: number[];
      fieldsToExtract: string[];
    },
  ): Observable<{ success: boolean; message: string; data: string }> {
    const cleanParams = mapLocalizedSortFullName(queryParams);
    return this.http.post<{
      success: boolean;
      message: string;
      data: string;
    }>(`${ApiUrl.v1BE}/guardians/export/csv`, body, {
      params: { ...cleanParams },
    });
  }
}

export interface GuardianRequest {
  arFullName: string;
  enFullName: string;
  nationalId: string;
  gender: Gender;
  countryCode: string;
  phoneNumber: string;
  studentIdsAndRelationships: {
    id: number;
    studentRelationship: StudentRelationship;
  }[];
  students: {
    arFullName: string;
    enFullName: string;
    nationalId: string;
    nationalityId: number;
    dateOfBirth?: number;
    gender: Gender;
    countryCode: string;
    phoneNumber: string;
    passportNumber?: string;
    passportExpiryDate?: number;
    pioneerId?: string;
    academicStatusId: number;
    registrationDate: number;
    classId?: number;
    academicYearId: number;
  }[];
}
