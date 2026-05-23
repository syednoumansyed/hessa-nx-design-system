import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import { map } from 'rxjs';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { CampusService } from './campus.service';
import { Campus } from '@shared/dto-transformation/organization';

export const campusResolver: ResolveFn<Campus | undefined> = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const breadcrumbService = inject(BreadcrumbService);
  return inject(CampusService)
    .getCampusById(+route.paramMap.get('campusId')!)
    .pipe(
      map((campus) => {
        if (campus) {
          breadcrumbService.set('@companyName', {
            label: campus.company?.displayName ?? '',
            routeLink: `school-structure/company/${campus.company?.id}`,
          });
          breadcrumbService.set('@campusName', campus.displayName ?? '');

          return campus;
        }
        return undefined;
      }),
    );
};
