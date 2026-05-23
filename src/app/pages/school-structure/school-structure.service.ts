import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { IResponse } from '@shared/interfaces';
import { ICompany } from '@shared/interfaces/company.interface';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  Company,
  CreateCompanyPayload,
  ORGANIZATION_MAP_FORM_DTO,
} from '@shared/dto-transformation/organization';
import { CompanyDTO } from '@shared/dto-transformation/organization/organization.dto';

@Injectable({
  providedIn: 'root',
})
export class SchoolStructureService {
  // TODO: remove this
  private _allCompanies = signal<Company[]>([]);
  public allCompanies = this._allCompanies.asReadonly();

  private http = inject(HttpClient);

  fetchParentCompanies(): Observable<Company[]> {
    return this.http
      .get<IResponse<CompanyDTO[]>>(`${ApiUrl.v1BE}/companies/`)
      .pipe(
        map((res) => {
          const mapCompanies = ORGANIZATION_MAP_FORM_DTO.companies(res.data);
          this._allCompanies.set(mapCompanies);
          return mapCompanies;
        }),
      );
  }

  createCompany(company: CreateCompanyPayload): Observable<any> {
    return this.http.post(`${ApiUrl.v1BE}/companies`, company);
  }

  updateCompany(id: string, company: CreateCompanyPayload): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/companies/${id}`, company);
  }

  deleteCompany(id: string): Observable<any> {
    return this.http.delete(`${ApiUrl.v1BE}/companies/${id}`);
  }
}
