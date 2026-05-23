import { inject, Injectable, signal } from '@angular/core';
import { LayoutService } from '@layout/layout.service';
import { StudentsService } from '@pages/user-management/students/students.service';
import { Student } from '@shared/dto-transformation';
import { Gender, ResourceStatus, UserStatus } from '@shared/enums';
import {
  IPagination,
  IStudentListItem,
  IStudentQueryParams,
} from '@shared/interfaces';

@Injectable()
export class StudentsListingService {
  // #region inject
  private readonly layoutService = inject(LayoutService);
  private readonly studentServices = inject(StudentsService);
  // #endregion

  // #region private
  private readonly studentsSignal = signal<IStudentListItem[]>([]);
  private readonly studentsLoadingSignal = signal<boolean>(false);
  private readonly studentsPaginationSignal = signal<IPagination | null>(null);
  // #endregion

  // #region public
  readonly studentsList = this.studentsSignal.asReadonly();
  readonly studentsLoading = this.studentsLoadingSignal.asReadonly();
  readonly studentsPagination = this.studentsPaginationSignal.asReadonly();
  // #endregion

  // #region public
  loadActiveOrPausedStudentsList(
    additionalParams?: IStudentQueryParams,
    pathSuffix?: string,
  ) {
    const defaultParams: Partial<IStudentQueryParams> = {
      userStatuses: [UserStatus.ACTIVE, UserStatus.PAUSED].join(','),
    };

    const params = {
      ...defaultParams,
      ...additionalParams,
    };

    return this.loadStudentsList(params, pathSuffix);
  }

  loadStudentsList(params?: IStudentQueryParams, pathSuffix?: string) {
    this.layoutService.showProgressBar();
    this.studentsLoadingSignal.set(true);
    return this.studentServices.fetchStudents(params, pathSuffix).subscribe({
      next: (response) => {
        this.studentsSignal.set(mapStudentsToStudentListItems(response.data));
        this.studentsPaginationSignal.set(response.paginate);
      },
      error: (error) => {
        if (error.status === 404 && error.error.paginate.totalItems === 0) {
          this.studentsSignal.set([]);
        }
        this.studentsLoadingSignal.set(false);
        this.layoutService.hideProgressBar();
        this.studentsPaginationSignal.set(error.error.paginate);
      },
      complete: () => {
        this.layoutService.hideProgressBar();
        this.studentsLoadingSignal.set(false);
      },
    });
  }
  // #endregion
}

// #region internal

export function mapStudentsToStudentListItems(
  students: Student[],
): IStudentListItem[] {
  return students.map((student) => {
    const {
      company,
      campus,
      school,
      level,
      class: activeClass,
      academicYear,
    } = student;
    return {
      id: student.id,
      nationalId: student.nationalId,
      phoneNumber: student.displayPhoneNumber ?? '-',
      displayName: student.displayName,
      dateOfBirth: student.dateOfBirth,
      pioneerId: student.pioneerId,
      passportNumber: student.passportNumber,
      passportExpiryDate: student.passportExpiryDate ?? null,
      registrationDate: student.registrationDate,
      nationalityId: student.nationalityId?.toString() || '-',
      nationalityName: student.nationalityName ?? '-',
      levelId: level?.id,
      levelName: level?.displayName || student.getAllLevelsName(),
      schoolId: school?.id,
      schoolName: school?.displayName || student.getAllSchoolsName(),
      campusId: campus?.id,
      campusName: campus?.displayName || student.getAllCampusesName(),
      companyId: company?.id,
      companyName: company?.displayName || student.getAllCompaniesName(),
      gender: student.gender as Gender,
      school: school?.displayName || student.getAllSchoolsName(),
      level: level?.displayName || student.getAllLevelsName(),
      class: activeClass?.displayName,
      status: student.status,
      actions: '',
      classId: activeClass?.id,
      className: activeClass?.displayName,
      guardian: student.guardians?.map((g) => g.displayName).join(', '),
      guardians: student.guardians,
      userId: student.userId,
      academicYearId: academicYear?.id,
      aId: academicYear?.id,
      academicYearName: academicYear?.displayName,
      lastActive: student.lastActive,
      updatedAt: student.updatedAt,
      studentClassStatus: student.studentClassStatus,
      studentClass: activeClass,
      userStatuses: student.userStatuses,
    };
  });
}
// #endregion
