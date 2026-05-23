import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ISchool, ISchoolPayload } from '@shared/interfaces/school.interface';
import { ICampus, IResponse } from '@shared/interfaces';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { findSchoolStructureEntity } from '@shared/utils/school-structure';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  Campus,
  ORGANIZATION_MAP_FORM_DTO,
  Stage,
} from '@shared/dto-transformation/organization';
import {
  CampusDTO,
  StageDTO,
} from '@shared/dto-transformation/organization/organization.dto';
import { FileUploadService } from '@shared/services/file-upload.service';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

@Injectable({
  providedIn: 'root',
})
export class CampusService {
  private schoolStructureScopeService = inject(SchoolStructureScopeService);
  private fileUploadService = inject(FileUploadService);
  private http = inject(HttpClient);

  createSchool(school: ISchoolPayload): Observable<IResponse<ISchool>> {
    return this.http.post<IResponse<ISchool>>(`${ApiUrl.v1BE}/schools`, school);
  }

  getCampusById(id: number): Observable<Campus> {
    const obs1 = this.schoolStructureScopeService.populateDefaultScope();
    const obs2 = this.http
      .get<IResponse<CampusDTO>>(`${ApiUrl.v1BE}/campuses/${id}`)
      .pipe(
        map((res) => {
          const campusMap = ORGANIZATION_MAP_FORM_DTO.campus(res.data);
          const modifiedSchools = campusMap.schools.map((school) => {
            const schoolFromScope = findSchoolStructureEntity(
              this.schoolStructureScopeService.userScopedSchoolStructure(),
              'school',
              school.id,
            );
            return {
              ...school,
              hasAccess: schoolFromScope?.hasAccess ?? false,
            };
          });
          return {
            ...campusMap,
            schools: modifiedSchools,
          };
        }),
      );
    return obs1.pipe(
      switchMap(() => {
        return obs2;
      }),
    );
  }

  deleteSchool(id: number): Observable<any> {
    return this.http.delete(`${ApiUrl.v1BE}/schools/${id}`);
  }

  updateSchool(id: number, campus: ISchoolPayload): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/schools/${id}`, campus);
  }

  getStages(): Observable<Stage[]> {
    return this.http.get<IResponse<StageDTO[]>>(`${ApiUrl.v1BE}/stages/`).pipe(
      map((res) => {
        return ORGANIZATION_MAP_FORM_DTO.stages(res.data);
      }),
    );
  }

  uploadSchoolLogo(attachments: IAttachmentControlValue[]) {
    return this.fileUploadService.uploadMediaFiles({
      uploadUrlConfig: {
        file: {
          url: `${ApiUrl.v2BE}/schools/file/upload`,
          uploadAsFormData: true,
        },
      },
      attachments: attachments,
    });
  }
}
