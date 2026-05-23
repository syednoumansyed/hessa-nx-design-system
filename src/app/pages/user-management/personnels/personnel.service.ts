import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { ApiUrl } from '@shared/utils/api-url.util';
import { SchoolStructureControlValue } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { Observable, map } from 'rxjs';
import {
  IPaginatedResponse,
  IPagination,
  IResponse,
  Idropdown,
} from '@shared/interfaces';
import {
  AssociatePersonnelData,
  AssociatePersonnelDataDTO,
  Personnel,
  PERSONNEL_MAP_FROM_DTO,
  PersonnelDTO,
  SubjectAssociation,
  SubjectAssociationDTO,
} from '@shared/dto-transformation';
import { Gender } from '@shared/enums';
import { deepClean } from '@shared/utils/deep-clean.util';
import { mapLocalizedSortFullName } from '@shared/utils/map-localized-sort-full-name.util';
import { getLocalizedName } from '@shared/utils/localization.util';
export type ApiParam = {
  sortByColumn?: string;
  order?: string;
  pageNumber?: number;
  itemsPerPage?: number;
  campusId?: string;
  schoolId?: string;
  companyId?: string;
  fullName?: string;
  searchText?: string;
  personnelId?: string | number;
};

@Injectable({
  providedIn: 'root',
})
export class PersonnelService {
  private nationalitiesSignal = signal<Idropdown[]>([]);
  readonly nationalitiesDropdown = this.nationalitiesSignal.asReadonly();

  private _personnelsDropdownList = signal<Idropdown[]>([]);
  readonly personnelsDropdownList = this._personnelsDropdownList.asReadonly();
  private _personnelsPagination = signal<IPagination | undefined>(undefined);
  readonly personnelsPagination = this._personnelsPagination.asReadonly();
  private _personnelsListSearchText = signal<string | undefined>(undefined);

  constructor(private http: HttpClient) {}

  getPersonnelsList(
    schoolId: number,
    params?: any,
    update = false,
    forReassign = false,
    event?: InfiniteScrollCustomEvent,
  ) {
    const endpoint = forReassign
      ? `${ApiUrl.v1BE}/tickets/re-assign/personnels/${schoolId}`
      : `${ApiUrl.v1BE}/tickets/personnels/${schoolId}`;
    const queryParams = mapLocalizedSortFullName(params);

    return this.http
      .get<IPaginatedResponse<PersonnelDTO[]>>(endpoint, {
        params: {
          ...queryParams,
          ...(this._personnelsListSearchText() && {
            searchText: this._personnelsListSearchText(),
          }),
        },
      })
      .subscribe({
        next: (res) => {
          const personnels = PERSONNEL_MAP_FROM_DTO.personnels(res.data);
          const list: any = personnels.map((n) => ({
            value: n.id,
            displayedValue: n.displayName,
            ...n,
          }));
          if (update) {
            this._personnelsDropdownList.update((oldList) => {
              return oldList.concat(list);
            });
            event?.target.complete();
          } else {
            this._personnelsDropdownList.set(list);
          }
          this._personnelsPagination.set(res.paginate);
        },
        error: (err) => {
          this._personnelsDropdownList.set([]);
          this._personnelsPagination.set(err.error.paginate);
        },
      });
  }

  updatePersonnelsListSearchText(v: string | undefined) {
    this._personnelsListSearchText.set(v);
  }

  /**
   * Creates a new personnel.
   * @param personnel - The personnel payload.
   * @returns An observable that emits the response from the server.
   */
  createPersonnel(personnel: PersonnelRequest): Observable<{ id: number }> {
    return this.http
      .post<
        IResponse<{ id: number }>
      >(`${ApiUrl.v1BE}/personnels`, deepClean(personnel))
      .pipe(map((res) => res.data));
  }

  /**
   * Updates a personnel with the specified ID.
   * @param personnelId - The ID of the personnel to update.
   * @param personnel - The partial payload containing the updated personnel data.
   * @returns An Observable that emits the response from the server.
   */
  updatePersonnel(
    personnelId: string,
    personnel: Partial<PersonnelRequest>,
  ): Observable<any> {
    return this.http.put(
      `${ApiUrl.v1BE}/personnels/${personnelId}`,
      deepClean(personnel),
    );
  }

  associatePersonnelWithSchoolsStructure(
    personnelId: string | number,
    param: SchoolStructureControlValue[],
  ): Observable<any> {
    const targets = param?.map((item) => ({
      id: item.id,
      type: item.type,
    }));
    return this.http.post(
      `${ApiUrl.v1BE}/personnels/${personnelId}/school-structure`,
      {
        targets,
      },
    );
  }

  getAssociatePersonnel(
    personnelId: string | number,
  ): Observable<AssociatePersonnelData> {
    return this.http
      .get<
        IResponse<AssociatePersonnelDataDTO>
      >(`${ApiUrl.v1BE}/personnels/${personnelId}/school-structure`)
      .pipe(
        map((resp) => PERSONNEL_MAP_FROM_DTO.associatePersonnel(resp.data)),
      );
  }

  /**
   * Retrieves a personnel by their ID.
   * @param id - The ID of the personnel to retrieve.
   * @returns An Observable that emits the personnel data.
   */
  getPersonnel(id: number | string) {
    return this.http
      .get<IResponse<PersonnelDTO>>(`${ApiUrl.v1BE}/personnels/${id}`)
      .pipe(
        map((res) => {
          return PERSONNEL_MAP_FROM_DTO.personnel(res.data);
        }),
      );
  }

  /**
   * Deactivates a personnel by updating their status to 'INACTIVE'.
   * @param personnelId - The ID of the personnel to deactivate.
   * @returns An Observable that emits the response from the server.
   */
  deactivatePersonnel(personnelId: string): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/personnels/${personnelId}/status`, {
      status: 'INACTIVE',
    });
  }

  /**
   * Activates a personnel by updating their status to 'ACTIVE'.
   * @param personnelId - The ID of the personnel to activate.
   * @returns An Observable that emits the response from the server.
   */
  activatePersonnel(personnelId: string): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/personnels/${personnelId}/status`, {
      status: 'ACTIVE',
    });
  }

  getSubjects(): Observable<Array<{ id: number; displayName: string }>> {
    return this.http
      .get<
        IResponse<Array<{ id: number; arName: string; enName: string }>>
      >(`${ApiUrl.v1BE}/subjects`)
      .pipe(
        map((res) =>
          res.data.map((s: { id: number; arName: string; enName: string }) => ({
            id: s.id,
            displayName: getLocalizedName(s),
          })),
        ),
      );
  }

  getPersonnelSubjectAssociation(
    personnelId: string | number,
  ): Observable<SubjectAssociation[]> {
    return this.http
      .get<
        IResponse<SubjectAssociationDTO[]>
      >(`${ApiUrl.v1BE}/personnels/${personnelId}/subject-association`)
      .pipe(map((res) => PERSONNEL_MAP_FROM_DTO.subjectAssociations(res.data)));
  }

  associatePersonnelWithSubjects(
    personnelId: string | number,
    subjectIds: number[],
  ): Observable<any> {
    return this.http.post(
      `${ApiUrl.v1BE}/personnels/${personnelId}/subject-association`,
      { subjectIds },
    );
  }

  fetchPersonnels(
    params: Partial<ApiParam>,
  ): Observable<IPaginatedResponse<Personnel[]>> {
    const queryParams = mapLocalizedSortFullName(params);

    return this.http
      .get<
        IPaginatedResponse<PersonnelDTO[]>
      >(`${ApiUrl.v1BE}/personnels`, { params: queryParams })
      .pipe(
        map((resp) => {
          return {
            ...resp,
            data: PERSONNEL_MAP_FROM_DTO.personnels(resp.data),
          };
        }),
      );
  }
  /**
   * Bulk update personnel status across pages.
   */
  bulkUpdatePersonnelStatus(
    queryParams: Record<string, any>,
    body: {
      personnelIds?: number[];
      excludePersonnelIds?: number[];
      status: string;
      reason?: string;
      startTime?: number;
      endTime?: number;
    },
  ): Observable<any> {
    const cleanParams = mapLocalizedSortFullName(queryParams);
    return this.http.put(`${ApiUrl.v1BE}/personnels/bulk/status`, body, {
      params: { ...cleanParams },
    });
  }

  /**
   * Export personnels to CSV.
   */
  exportPersonnelsCsv(
    queryParams: Record<string, any>,
    body: {
      personnelIds?: number[];
      excludePersonnelIds?: number[];
      fieldsToExtract: string[];
    },
  ): Observable<{ success: boolean; message: string; data: string }> {
    const cleanParams = mapLocalizedSortFullName(queryParams);
    return this.http.post<{
      success: boolean;
      message: string;
      data: string;
    }>(`${ApiUrl.v1BE}/personnels/export/csv`, body, {
      params: { ...cleanParams },
    });
  }
}

export interface PersonnelRequest {
  id?: number;
  nationalId: string;
  arFullName: string;
  enFullName: string;
  countryCode: string;
  phoneNumber: string;
  employeeId: string;
  nationalityId: number;
  gender: Gender;
  email: string;
  dateOfBirth?: number;
  passportNumber?: string;
  passportExpiryDate?: number;
  startDate?: number;
  roleIds: number[];
}
