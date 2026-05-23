import { inject } from '@angular/core';
import { type ResolveFn } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { GuardianService } from '@pages/user-management/guardians/guardians.service';
import { StudentsService } from '@pages/user-management/students/students.service';
import { AcademicYearItem } from '@shared/interfaces/academic-year-scope.interface';
import { map, of } from 'rxjs';

export const StudentsScopeResolver: ResolveFn<any> = (_route, _state) => {
  const studentSelectionScopeService = inject(StudentSelectionScopeService);
  const schoolStructureScopeService = inject(SchoolStructureScopeService);
  const authService = inject(AuthService);
  const guardianService = inject(GuardianService);
  const studentService = inject(StudentsService);
  const academicYearScopeService = inject(AcademicYearsScopeService);
  const user = authService.user();
  if (user?.type === 'GUARDIAN') {
    return guardianService.getGuardian(user?.userTypeId).pipe(
      map((g) => {
        // If guardian has no schools/students, allow through to see empty state
        // The ViewPostsComponent will show "Students aren't part of any class"
        if (g.students.length) {
          studentSelectionScopeService.updateStudentSelectionScopeFromGuardianStudents(
            g.students,
          );
          studentSelectionScopeService.updateSelectedStudent(g.students[0].id);

          const firstStudentWithSchoolYear = g.students.find((s) => {
            const { school, academicYear } = s;
            return school?.id && academicYear?.id;
          });

          if (firstStudentWithSchoolYear) {
            schoolStructureScopeService.updateSelectedStructure({
              id: firstStudentWithSchoolYear.school?.id,
              type: 'school',
            } as sideMenuSchoolStructureItem);

            academicYearScopeService.updateSelectedAcademicYear({
              id: firstStudentWithSchoolYear.academicYear?.id,
              name: firstStudentWithSchoolYear.academicYear?.displayName,
            } as AcademicYearItem);
          }
        }
        return g.students;
      }),
    );
  } else if (user?.type === 'STUDENT') {
    return studentService.getStudent(user?.userTypeId).pipe(
      map((student) => {
        // If student has no level, allow through to see empty state
        // The ViewPostsComponent will show "You're not part of any class"
        if (!student?.level?.id) {
          return student;
        }

        const {
          school,
          class: classObj,
          level,
          academicYear,
          id,
          displayName,
          nationalId,
        } = student;

        const mappedStudent = {
          id: id,
          fullName: displayName,
          nationalId: nationalId,
          academicYear: academicYear,
          school: school
            ? {
                id: school?.id,
                name: school?.displayName,
                class: classObj,
                level: level,
              }
            : null,
        };
        studentSelectionScopeService.updateStudentSelectionScope([
          mappedStudent,
        ]);
        studentSelectionScopeService.updateSelectedStudent(id);
        return student;
      }),
    );
  } else {
    return of([]);
  }
};
