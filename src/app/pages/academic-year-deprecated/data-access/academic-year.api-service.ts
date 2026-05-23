import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiParam } from '@core/api-services/role-api/dto/role.dto';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Observable, map } from 'rxjs';
import {
  AcademicYearResponseDTO,
  AcademicYearsResponseDTO,
  CreateAcademicYearPayloadDTO,
  SemesterPayloadDTO,
  SemesterResponseDTO,
} from './academic-year.dto';

@Injectable({
  providedIn: 'root',
})
export class AcademicYearApiService {
  private readonly http = inject(HttpClient);

  fetchAcademicYearById(id: number) {
    return this.http
      .get<AcademicYearResponseDTO>(`${ApiUrl.v1BE}/academic-years/${id}`)
      .pipe(map((data) => data.data));
  }
  fetchAcademicYears(
    params: Partial<ApiParam>,
  ): Observable<AcademicYearsResponseDTO> {
    return this.http.get<AcademicYearsResponseDTO>(
      `${ApiUrl.v1BE}/academic-years`,
      { params },
    );
  }

  addAcademicYear(payload: CreateAcademicYearPayloadDTO) {
    return this.http.post(`${ApiUrl.v1BE}/academic-years`, payload);
  }

  deleteAcademic(academicId: number) {
    return this.http.delete(`${ApiUrl.v1BE}/academic-years/${academicId}`);
  }

  updateAcademicYear(
    academicId: number,
    payload: CreateAcademicYearPayloadDTO,
  ) {
    return this.http.put(
      `${ApiUrl.v1BE}/academic-years/${academicId}`,
      payload,
    );
  }

  addSemester(payload: SemesterPayloadDTO) {
    return this.http.post(`${ApiUrl.v1BE}/semesters`, payload);
  }

  updateSemester(semesterId: number, payload: SemesterPayloadDTO) {
    return this.http.put(`${ApiUrl.v1BE}/semesters/${semesterId}`, payload);
  }

  deleteSemester(semesterId: number) {
    return this.http.delete(`${ApiUrl.v1BE}/semesters/${semesterId}`);
  }

  fetchSemesterById(semesterId: number) {
    return this.http
      .get<SemesterResponseDTO>(`${ApiUrl.v1BE}/semesters/${semesterId}`)
      .pipe(map((resp) => resp.data));
  }

  getAllAcademicYears(): Observable<AcademicYearsResponseDTO> {
    return this.http.get<AcademicYearsResponseDTO>(
      `${ApiUrl.v1BE}/academic-years/all`,
    );
  }
}
