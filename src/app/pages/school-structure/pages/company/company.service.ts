import { inject, Injectable, signal } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { ICampusPayload, IResponse } from '@shared/interfaces';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import {
  ICity,
  ICompany,
  IDistrict,
} from '@shared/interfaces/company.interface';
import { findSchoolStructureEntity } from '@shared/utils/school-structure';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { CompanyDTO } from '@shared/dto-transformation/organization/organization.dto';
import {
  Company,
  ORGANIZATION_MAP_FORM_DTO,
} from '@shared/dto-transformation/organization';
import { FileUploadService } from '@shared/services/file-upload.service';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private schoolStructureScopeService = inject(SchoolStructureScopeService);
  private fileUploadService = inject(FileUploadService);

  private http = inject(HttpClient);

  private readonly _citiesList = signal<ICity[]>([]);
  citiesList = this._citiesList.asReadonly();
  private readonly _districtsList = signal<IDistrict[]>([]);
  districtsList = this._districtsList.asReadonly();

  getCountries() {
    const citiesUrl = './assets/countries-cities-districts/countries.json';
    return this.http.get<ICity[]>(citiesUrl);
  }

  getCities() {
    const citiesUrl = './assets/countries-cities-districts/cities.json';
    return this.http.get<ICity[]>(citiesUrl).pipe(
      map((data) => {
        this._citiesList.set(data);
        return data;
      }),
    );
  }

  getDistricts() {
    const districtsUrl = './assets/countries-cities-districts/districts.json';
    return this.http.get<IDistrict[]>(districtsUrl).pipe(
      map((data) => {
        this._districtsList.set(data);
        return data;
      }),
    );
  }

  createCampus(campus: ICampusPayload): Observable<any> {
    return this.http.post(`${ApiUrl.v1BE}/campuses`, campus);
  }

  getCompanyById(id: number): Observable<Company> {
    const obs1: Observable<never[] | Company[]> =
      this.schoolStructureScopeService.populateDefaultScope();
    const obs2: Observable<Company> = this.http
      .get<IResponse<CompanyDTO>>(`${ApiUrl.v1BE}/companies/${id}`)
      .pipe(
        map((res) => {
          const company = ORGANIZATION_MAP_FORM_DTO.company(res.data);
          const modifiedSubCompanies = company.subCompanies?.map(
            (subcompany) => {
              const subComapnyFromScope = findSchoolStructureEntity(
                this.schoolStructureScopeService.userScopedSchoolStructure(),
                'sub-company',
                subcompany.id,
              );
              return {
                ...subcompany,
                hasAccess: subComapnyFromScope?.hasAccess ?? false,
              };
            },
          );
          const modifiedCampuses = company.campuses?.map((campus) => {
            const subComapnyFromScope = findSchoolStructureEntity(
              this.schoolStructureScopeService.userScopedSchoolStructure(),
              'campus',
              campus.id,
            );
            return {
              ...campus,
              hasAccess: subComapnyFromScope?.hasAccess ?? false,
            };
          });
          return {
            ...company,
            subCompanies: modifiedSubCompanies,
            campuses: modifiedCampuses,
          };
        }),
      );

    return obs1.pipe(
      switchMap(() => {
        return obs2;
      }),
    );
  }

  deleteCampus(id: number): Observable<any> {
    return this.http.delete(`${ApiUrl.v1BE}/campuses/${id}`);
  }

  updateCampus(id: number, campus: ICampusPayload): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/campuses/${id}`, campus);
  }

  getParentCompanies(): Observable<Company[]> {
    return this.http
      .get<IResponse<CompanyDTO[]>>(`${ApiUrl.v1BE}/companies/parent`)
      .pipe(
        map((res) =>
          res.data.map((company) => ORGANIZATION_MAP_FORM_DTO.company(company)),
        ),
      );
  }
  uploadCompanyLogo(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadMediaFiles({
      uploadUrlConfig: {
        file: {
          url: `${ApiUrl.v2BE}/companies/file/upload`,
          uploadAsFormData: true,
        },
      },
      attachments: attachments,
    });
  }
}
