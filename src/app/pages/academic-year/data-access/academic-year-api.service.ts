import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiParam } from '@core/api-services/role-api/dto/role.dto';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Observable, map } from 'rxjs';
import {
  AcademicYearDTO,
  AcademicYearResponseDTO,
  AcademicYearsResponseDTO,
  CreateAcademicYearPayloadDTO,
  GlobalHolidayDTO,
  GlobalHolidaysResponseDTO,
  HolidayDTO,
  HolidayPayloadDTO,
  HolidayResponseDTO,
  SemesterDTO,
  SemesterPayloadDTO,
  SemesterResponseDTO,
} from './academic-year.dto';

@Injectable({
  providedIn: 'root',
})
export class AcademicYearApiService {
  private readonly http = inject(HttpClient);

  fetchAcademicYearById(id: string): Observable<AcademicYearDTO> {
    return this.http
      .get<AcademicYearResponseDTO>(`${ApiUrl.v2BE}/academic-years/${id}`)
      .pipe(map((data) => data.data));
  }

  // fetchAcademicYears(
  //   params: Partial<ApiParam>,
  // ): Observable<AcademicYearsResponseDTO> {
  //   return this.http.get<AcademicYearsResponseDTO>(
  //     `${ApiUrl.v2BE}/academic-years`,
  //     { params },
  //   );
  // }

  addAcademicYear(
    payload: CreateAcademicYearPayloadDTO,
  ): Observable<AcademicYearResponseDTO> {
    return this.http.post<AcademicYearResponseDTO>(
      `${ApiUrl.v2BE}/academic-years`,
      payload,
    );
  }

  updateAcademicYear(
    academicId: string,
    payload: CreateAcademicYearPayloadDTO,
  ): Observable<AcademicYearResponseDTO> {
    return this.http.put<AcademicYearResponseDTO>(
      `${ApiUrl.v2BE}/academic-years/${academicId}`,
      payload,
    );
  }

  addSemester(payload: SemesterPayloadDTO): Observable<SemesterResponseDTO> {
    return this.http.post<SemesterResponseDTO>(
      `${ApiUrl.v2BE}/semesters`,
      payload,
    );
  }

  updateSemester(
    semesterId: string,
    payload: SemesterPayloadDTO,
  ): Observable<SemesterResponseDTO> {
    return this.http.put<SemesterResponseDTO>(
      `${ApiUrl.v2BE}/semesters/${semesterId}`,
      payload,
    );
  }

  deleteSemester(semesterId: number) {
    return this.http.delete(`${ApiUrl.v2BE}/semesters/${semesterId}`);
  }

  fetchSemesterById(semesterId: number) {
    return this.http
      .get<SemesterResponseDTO>(`${ApiUrl.v2BE}/semesters/${semesterId}`)
      .pipe(map((resp) => resp.data));
  }

  getAllAcademicYears(
    onlyPast: boolean = true,
  ): Observable<AcademicYearsResponseDTO> {
    return this.http.get<AcademicYearsResponseDTO>(
      `${ApiUrl.v2BE}/academic-years/all`,
      { params: { onlyPast } },
    );
  }

  getAllGlobalHolidays(): Observable<GlobalHolidayDTO[]> {
    return this.http
      .get<GlobalHolidaysResponseDTO>(`${ApiUrl.v2BE}/global-holidays`)
      .pipe(map((response) => response.data));
  }

  addHoliday(payload: HolidayPayloadDTO): Observable<HolidayResponseDTO> {
    return this.http.post<HolidayResponseDTO>(
      `${ApiUrl.v2BE}/holidays`,
      payload,
    );
  }

  updateHoliday(
    holidayId: string,
    payload: HolidayPayloadDTO,
  ): Observable<HolidayResponseDTO> {
    return this.http.put<HolidayResponseDTO>(
      `${ApiUrl.v2BE}/holidays/${holidayId}`,
      payload,
    );
  }

  deleteHoliday(holidayId: number) {
    return this.http.delete(`${ApiUrl.v2BE}/holidays/${holidayId}`);
  }
}
