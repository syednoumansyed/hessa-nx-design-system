import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import { map } from 'rxjs';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { SchoolService } from './school.service';
import { School } from '@shared/dto-transformation/organization';

export const schoolResolver: ResolveFn<School | undefined> = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const breadcrumbService = inject(BreadcrumbService);
  return inject(SchoolService)
    .getSchoolById(+route.paramMap.get('id')!)
    .pipe(
      map((school) => {
        if (school) {
          breadcrumbService.set('@companyName', {
            label: school.campus?.company?.displayName,
            routeLink: `school-structure/company/${school.campus?.company?.id}`,
          });
          breadcrumbService.set('@campusName', {
            label: school.campus?.displayName,
            routeLink: `school-structure/campus/${school.campus?.id}`,
          });
          breadcrumbService.set('@schoolName', school.displayName);
          return school;
        }
        return undefined;
      }),
    );
};
