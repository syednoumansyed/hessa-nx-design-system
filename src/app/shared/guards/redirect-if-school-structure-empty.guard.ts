import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AuthService } from '@auth/auth.service';
import { findAllSchools } from '@shared/utils/school-structure';
import { map, tap } from 'rxjs';

export const redirectIfSchoolStructureEmptyGuard: CanActivateFn = (
  _next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const schoolStructureScopeService = inject(SchoolStructureScopeService);
  const router = inject(Router);
  const auth = inject(AuthService);

  return schoolStructureScopeService
    .populateDefaultScope()

    .pipe(
      tap(() => {
        const schools = findAllSchools(
          schoolStructureScopeService.userScopedSchoolStructureTillSchool(),
        );
        if (schools.length === 1) {
          schoolStructureScopeService.updateSelectedStructure(schools[0]);
        }
      }),
      map(() => {
        const isEmptySchoolStructure =
          schoolStructureScopeService.isSchoolStructureEmpty();
        if (isEmptySchoolStructure) {
          // Allow any user (personnel, student, guardian) to access home and menu pages
          const isPersonnel = auth.isUserPersonnel();
          const isStudent = auth.isUserStudent();
          const isGuardian = auth.isUserGuardian();
          const isGoingToHome = state.url === '/' || state.url === '/home';
          const isGoingToMenu = state.url === '/menu';

          if (
            (isPersonnel || isStudent || isGuardian) &&
            (isGoingToHome || isGoingToMenu)
          ) {
            return true;
          }

          if (state.url !== '/help-center') {
            return router.createUrlTree(['/help-center']);
          }
        }
        return true;
      }),
    );
};
