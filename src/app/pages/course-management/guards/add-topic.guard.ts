import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';

export const AddTopicGuard: CanActivateFn = (
  _next: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const schoolScopeService = inject(SchoolStructureScopeService);
  const academicYearScopeService = inject(AcademicYearsScopeService);
  const router: Router = inject(Router);

  const selectedSchoolId =
    schoolScopeService.selectedSchoolStructureItem()?.type === 'school'
      ? schoolScopeService.selectedSchoolStructureItem()?.id
      : null;
  const selectedAcademicYearId =
    academicYearScopeService.selectedAcademicYear()?.id;

  if (selectedSchoolId && selectedAcademicYearId) return true;
  else return router.navigate(['/course-management/list']);
};
