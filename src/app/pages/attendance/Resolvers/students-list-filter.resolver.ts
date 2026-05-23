import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { map } from 'rxjs';
import { StudentAttendanceService } from '../pages/student-attendance/data-access/student-attendance.service';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';

export const studentsListFilterResolver: ResolveFn<any> = (_route, _state) => {
  const studentAttendanceService = inject(StudentAttendanceService);
  const auth = inject(AuthService);
  const studentSelectionScopeService = inject(StudentSelectionScopeService);
  const selectedSchoolId = inject(
    SchoolStructureScopeService,
  ).selectedSchoolId();
  const userType = auth.user()?.type;
  const userTypeId = auth.user()?.userTypeId;

  if (userType === UserType.STUDENT) {
    studentAttendanceService.updateSelectedStudent(userTypeId ?? null);
    return;
  } else if (userType === UserType.GUARDIAN) {
    studentAttendanceService.updateSelectedStudent(
      studentSelectionScopeService.selectedStudent()?.id ?? null,
    );
    return;
  } else if (selectedSchoolId) {
    const schoolStructureListingService = inject(SchoolStructureListingService);
    schoolStructureListingService.selectFirstLevel();
    schoolStructureListingService.selectFirstClass();

    return studentAttendanceService
      .populateStudentOptions({ studentClassStatus: 'ACTIVE' })
      .pipe(
        map((res) => {
          if (res?.data?.length)
            studentAttendanceService.updateSelectedStudent(res.data[0].id);
          return res;
        }),
      );
  } else return;
};
