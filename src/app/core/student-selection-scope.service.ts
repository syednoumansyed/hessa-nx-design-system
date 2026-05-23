import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { Student } from '@shared/dto-transformation';
import { UserProfileColors } from '@shared/enums';
import { UserStatus } from '@shared/enums';
import { ObjId } from '@shared/interfaces/common.interface';
import { DisplayIdentifiable } from '@shared/interfaces/identifiable.interface';

export interface StudentSelectionScope {
  id: number;
  fullName: string;
  nationalId: string;
  academicYear: DisplayIdentifiable | null;
  status?: UserStatus;
  image?: string | null;
  profileColor?: UserProfileColors;
  school?: {
    id: number | null;
    name: string | null;
    level: DisplayIdentifiable | null;
    class: DisplayIdentifiable | null;
  } | null;
}

@Injectable({
  providedIn: 'root',
})
export class StudentSelectionScopeService {
  private readonly _studentSelectionScope = signal<
    Array<StudentSelectionScope>
  >([]);

  private authService = inject(AuthService);
  studentSelectionScope = this._studentSelectionScope.asReadonly();

  private readonly _selectedStudent = signal<StudentSelectionScope | null>(
    null,
  );
  selectedStudent = this._selectedStudent.asReadonly();

  selectedStudentId = computed(() => {
    const user = this.authService.user();
    if (this.authService.isUserStudent()) {
      return user!.userTypeId;
    }
    return this.selectedStudent()?.id;
  });

  updateStudentSelectionScope(students: Array<StudentSelectionScope>) {
    this._studentSelectionScope.set(students);
  }

  updateSelectedStudent(studentId: ObjId) {
    const student = this._studentSelectionScope().find(
      (s) => s.id === studentId,
    );
    if (!student) {
      this._selectedStudent.set(null);
    } else this._selectedStudent.set(student);
  }

  updateStudentSelectionScopeFromGuardianStudents(students: Student[]) {
    this._studentSelectionScope.set(
      this.mapGuardianStudentsToStudentSelectionScope(students),
    );
  }

  private mapGuardianStudentsToStudentSelectionScope(
    students: Student[],
  ): StudentSelectionScope[] {
    return students.map((student) => {
      const {
        school,
        level,
        class: studentClass,
        academicYear,
      } = student || {};
      return {
        id: student.id,
        fullName: student.displayName,
        nationalId: student.nationalId,
        status: student.status,
        image: student?.imageUrl,
        profileColor: student?.profileColor,
        academicYear: academicYear
          ? {
              id: academicYear.id,
              displayName: academicYear.displayName,
            }
          : null,
        school: school
          ? {
              id: school.id,
              name: school.displayName,
              level: level
                ? {
                    id: level.id,
                    displayName: level.displayName,
                  }
                : null,
              class: studentClass
                ? {
                    id: studentClass.id,
                    displayName: studentClass.displayName,
                  }
                : null,
            }
          : null,
      };
    });
  }
}
