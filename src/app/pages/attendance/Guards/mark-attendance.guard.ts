import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AttendanceService } from '../data-access/attendance.service';

export const MarkAttendanceGuard: CanActivateFn = (
  _next: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const attendanceService = inject(AttendanceService);
  const schoolScopeService = inject(SchoolStructureScopeService);
  const academicYearScopeService = inject(AcademicYearsScopeService);
  const router: Router = inject(Router);

  const selectedSchoolId = schoolScopeService.selectedSchoolId();
  const selectedDateId = attendanceService.selectedDate().toString();
  const selectedClassId = attendanceService.selectedClass();
  const selectedLevelId = attendanceService.selectedLevel();
  const selectedAcademicYearId =
    academicYearScopeService.selectedAcademicYear()?.id;

  if (
    selectedSchoolId &&
    selectedDateId &&
    selectedClassId &&
    selectedLevelId &&
    selectedAcademicYearId
  )
    return true;
  else return router.navigate(['/attendance/list']);
};
