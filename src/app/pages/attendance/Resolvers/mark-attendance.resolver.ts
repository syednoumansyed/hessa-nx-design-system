import { inject } from '@angular/core';
import { Router, type ResolveFn } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AttendanceService } from '../data-access/attendance.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { formatDate } from 'date-fns';

// make sure translation files are loaded and available before routing
export const markStudentsAttendanceResolver: ResolveFn<any> = (
  _route,
  _state,
) => {
  const attendanceService = inject(AttendanceService);
  const schoolScopeService = inject(SchoolStructureScopeService);
  const academicYearScopeService = inject(AcademicYearsScopeService);
  const router = inject(Router);

  const selectedSchoolId =
    schoolScopeService.selectedSchoolStructureItem()?.type === 'school'
      ? schoolScopeService.selectedSchoolStructureItem()?.id
      : null;
  const selectedDateId = attendanceService.selectedDate();
  const selectedClassId = attendanceService.selectedClass();
  const selectedLevelId = attendanceService.selectedLevel();
  const selectedAcademicYearId =
    academicYearScopeService.selectedAcademicYear()?.id;
  if (
    !selectedSchoolId ||
    !selectedDateId ||
    !selectedClassId ||
    !selectedLevelId ||
    !selectedAcademicYearId
  )
    return;

  return forkJoin([
    attendanceService.getClassAttendanceList({
      schoolId: selectedSchoolId,
      date: formatDate(selectedDateId.toISOString(), 'yyyy-MM-dd'),
      classId: selectedClassId,
      levelId: selectedLevelId,
    }),
    attendanceService.getClassStudentsAttendanceList({
      schoolId: selectedSchoolId,
      date: formatDate(selectedDateId.toISOString(), 'yyyy-MM-dd'),
      classId: selectedClassId,
      levelId: selectedLevelId,
      academicYearId: selectedAcademicYearId,
    }),
  ]).pipe(
    catchError(() => {
      router.navigate(['/attendance/list']);
      return of(null);
    }),
  );
};
