import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import {
  Level,
  ORGANIZATION_MAP_FORM_DTO,
  School,
} from '@shared/dto-transformation/organization';
import {
  LevelDTO,
  SchoolDTO,
} from '@shared/dto-transformation/organization/organization.dto';
import { IResponse } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { ILevel } from '@shared/interfaces/level.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import { ensureArray } from '@shared/utils/array.util';
import { getLocalizedFullName } from '@shared/utils/localization.util';
import { findSchoolStructureEntity } from '@shared/utils/school-structure';
import { map, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SchoolService {
  private schoolStructureScopeService = inject(SchoolStructureScopeService);
  private http = inject(HttpClient);

  getLevels(): Observable<Level[]> {
    return this.http
      .get<IResponse<LevelDTO[]>>(`${ApiUrl.v1BE}/levels`)
      .pipe(
        map((res) =>
          res.data.map((level) => ORGANIZATION_MAP_FORM_DTO.level(level)),
        ),
      );
  }

  getSchoolById(id: number): Observable<School> {
    const obs1 = this.schoolStructureScopeService.populateDefaultScope();
    const obs2 = this.http
      .get<IResponse<SchoolDTO>>(`${ApiUrl.v1BE}/schools/${id}`)
      .pipe(
        map((res) => {
          const schoolMap = ORGANIZATION_MAP_FORM_DTO.school(res.data);
          const modifiedLevels = schoolMap.schoolLevels?.map((level) => {
            const levelFromScope = findSchoolStructureEntity(
              this.schoolStructureScopeService.userScopedSchoolStructure(),
              'level',
              level.id,
            );
            return {
              ...level,
              hasAccess: levelFromScope?.hasAccess ?? false,
            };
          });
          modifiedLevels.forEach((level, i) => {
            const modifiedClasses = level.classes.map((levelClass) => {
              const levelClassFromScope = findSchoolStructureEntity(
                this.schoolStructureScopeService.userScopedSchoolStructure(),
                'class',
                levelClass.id,
              );
              return {
                ...levelClass,
                hasAccess: levelClassFromScope?.hasAccess ?? false,
              };
            });
            modifiedLevels[i].classes = [...(modifiedClasses ?? [])];
          });
          return {
            ...schoolMap,
            schoolLevels: modifiedLevels,
          };
        }),
      );
    return obs1.pipe(
      switchMap(() => {
        return obs2;
      }),
    );
  }

  updateSchoolLevels(schoolId: number, levelIds: any): Observable<any> {
    return this.http.put(`${ApiUrl.v1BE}/schools/${schoolId}/levels`, levelIds);
  }

  getAllSchoolTeachers(schoolId: number): Observable<SchoolTeacher[]> {
    return this.http
      .get<SchoolTeacherResponseDTO>(
        `${ApiUrl.v1BE}/schools/${schoolId}/teachers`,
      )
      .pipe(
        map((res) =>
          ensureArray(res.data).map((teacher) => ({
            id: teacher.id,
            displayName: getLocalizedFullName(teacher),
            displayedValue: getLocalizedFullName(teacher),
            value: teacher.id,
          })),
        ),
      );
  }

  getLevelsBySchoolIds(schoolIds: number[]): Observable<ILevel[]> {
    return this.http
      .post<IResponse<ILevel[]>>(`${ApiUrl.v1BE}/schools/levels`, {
        schoolIds,
      })
      .pipe(map((res) => res.data));
  }
}

interface SchoolTeacherDTO {
  id: number;
  arFullName: string;
  enFullName: string;
}

type SchoolTeacherResponseDTO = IResponse<SchoolTeacherDTO[]>;

export interface SchoolTeacher {
  id: number;
  displayName: string;
  displayedValue: string;
  value: number;
}
