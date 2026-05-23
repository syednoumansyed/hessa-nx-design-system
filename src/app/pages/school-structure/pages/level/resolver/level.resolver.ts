import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import { map } from 'rxjs';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { SchoolService } from '../../school/school.service';
import { School } from '@shared/dto-transformation/organization';

export const levelResolver: ResolveFn<School> = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const breadcrumbService = inject(BreadcrumbService);
  const levelId = +route.paramMap.get('levelId')!;
  const classId = route.paramMap.get('classId');
  return inject(SchoolService)
    .getSchoolById(+route.paramMap.get('schoolId')!)
    .pipe(
      map((school) => {
        if (school) {
          const level = school.schoolLevels.find(
            (level) => level.id === levelId,
          );
          breadcrumbService.set('@companyName', {
            label: school?.campus?.company?.displayName,
            routeLink: `school-structure/company/${school?.campus?.company?.id}`,
          });
          breadcrumbService.set('@campusName', {
            label: school?.campus?.displayName,
            routeLink: `school-structure/campus/${school?.campus?.id}`,
          });
          breadcrumbService.set('@schoolName', {
            label: school?.displayName,
            routeLink: `school-structure/school/${school.id}`,
          });
          if (level)
            breadcrumbService.set('@levelName', {
              label: level.displayName,
              routeLink: `school-structure/school/${school.id}/level/${level.id}`,
            });

          if (classId && level) {
            const classDetail = level?.classes?.find((c) => c.id === +classId);
            breadcrumbService.set('@className', {
              label: classDetail?.displayName,
              routeLink: `school-structure/school/${school.id}/level/${level.id}/class/${classId}`,
            });
          }
        }
        return school;
      }),
    );
};
