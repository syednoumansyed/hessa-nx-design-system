import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { tap } from 'rxjs';

export const academicYearResolver: ResolveFn<any> = (_route, _state) => {
  const academicYearsScopeService = inject(AcademicYearsScopeService);

  return academicYearsScopeService.fetchAllAcademicYears().pipe(
    tap((response) => {
      academicYearsScopeService.updateAcademicYearsListing(response.data);
      const currAcademicYear =
        academicYearsScopeService.findCurrentOrNearestAcademicYearOrSemester(
          response.data,
        );
      if (currAcademicYear) {
        academicYearsScopeService.updateSelectedAcademicYear(currAcademicYear);
        const currSemester =
          academicYearsScopeService.findCurrentOrNearestAcademicYearOrSemester(
            currAcademicYear.semesters,
          );
        if (currSemester)
          academicYearsScopeService.updateSelectedSemester(currSemester);
      }
    }),
  );
};
