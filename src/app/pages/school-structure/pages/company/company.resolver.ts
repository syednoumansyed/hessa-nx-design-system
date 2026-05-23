import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import { CompanyService } from './company.service';
import { map } from 'rxjs';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { Company } from '@shared/dto-transformation/organization';

export const companyResolver: ResolveFn<Company | undefined> = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const breadcrumbService = inject(BreadcrumbService);
  return inject(CompanyService)
    .getCompanyById(+route.paramMap.get('id')!)
    .pipe(
      map((company) => {
        if (company) {
          breadcrumbService.set('@companyName', company.displayName);
          return company;
        }
        return undefined;
      }),
    );
};

export const subCompanyResolver: ResolveFn<Company | undefined> = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const breadcrumbService = inject(BreadcrumbService);
  const companyService = inject(CompanyService);
  return companyService.getCompanyById(+route.paramMap.get('id')!).pipe(
    map((company) => {
      if (company) {
        breadcrumbService.set('@subCompanyName', company.displayName);
        if (company.parentId)
          companyService.getCompanyById(company.parentId).subscribe({
            next: (parentCompany) => {
              breadcrumbService.set('@companyName', {
                label: parentCompany.displayName,
                routeLink: `school-structure/company/${company.parentId}`,
              });
            },
          });
        return company;
      }
      return undefined;
    }),
  );
};
