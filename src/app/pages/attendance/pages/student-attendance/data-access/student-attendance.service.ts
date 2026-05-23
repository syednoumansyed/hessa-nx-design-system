import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { StudentsService } from '@pages/user-management/students/students.service';
import {
  IPagination,
  IResponse,
  IStudentQueryParams,
  Idropdown,
} from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { formatDate } from 'date-fns';
import { catchError, map, Observable, of } from 'rxjs';
import {
  AttendanceStatus,
  StudentAttendanceDetailsQueryParams,
  StudentAttendanceDetailsWidthSummaryDTO,
} from '../../../data-access/attendance.dto';
import { StudentAttendanceDetailsWidthSummary } from '@pages/attendance/data-access/attendance.interface';
import { ATTENDANCE_MAP_FROM_DTO } from '@pages/attendance/data-access/attendance-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class StudentAttendanceService {
  private http = inject(HttpClient);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly studentService = inject(StudentsService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );

  selectedSchoolId = computed(() => {
    const selectedSchoolStructureItem =
      this.schoolScopeService.selectedSchoolStructureItem();
    return selectedSchoolStructureItem?.type === 'school'
      ? selectedSchoolStructureItem?.id
      : null;
  });

  private _studentsListSearchText = signal<string | undefined>(undefined);
  private _lastLevelId = signal<string | number | null>(null);
  private _lastClassId = signal<number | null>(null);
  _studentOptions = signal<Idropdown[]>([]);
  readonly studentOptions = this._studentOptions.asReadonly();

  private readonly _studentOptionsPagination = signal<IPagination | undefined>(
    undefined,
  );
  readonly studentOptionsPagination =
    this._studentOptionsPagination.asReadonly();

  private readonly _selectedStudent = signal<number | null>(null);
  readonly selectedStudent = this._selectedStudent.asReadonly();

  private readonly _selectedStartDate = signal<string | number>(
    formatDate(new Date().toISOString(), 'yyyy-MM-dd'),
  );
  selectedStartDate = this._selectedStartDate.asReadonly();

  private readonly _selectedEndDate = signal<string | number>(
    formatDate(new Date().toISOString(), 'yyyy-MM-dd'),
  );
  selectedEndDate = this._selectedEndDate.asReadonly();

  selectedLevel = this.schoolStructureListingService.selectedLevel;

  selectedClass = this.schoolStructureListingService.selectedClass;

  private readonly _studentAttendace =
    signal<StudentAttendanceDetailsWidthSummary | null>(null);
  studentAttendace = this._studentAttendace.asReadonly();

  private readonly _selectedStatus = signal<AttendanceStatus | null>(null);
  selectedStatus = this._selectedStatus.asReadonly();

  constructor() {}

  updateSelectedStatus(status: AttendanceStatus | null) {
    this._selectedStatus.set(status);
  }

  updateSelectedStartDate(date: string) {
    this._selectedStartDate.set(date);
  }

  updateSelectedEndDate(date: string) {
    this._selectedEndDate.set(date);
  }

  updateSelectedLevel(level: number | null) {
    this.schoolStructureListingService.updateSelectedLevel(level);
  }

  updateSelectedClass(classId: number | null) {
    this.schoolStructureListingService.updateSelectedClass(classId);
  }

  updateStudentsListSearchText(text: string | undefined) {
    this._studentsListSearchText.set(text);
  }

  updateSelectedStudent(studentId: number | null) {
    this._selectedStudent.set(studentId);
  }

  updateStudentAttendance(
    studentAttendance: StudentAttendanceDetailsWidthSummary | null,
  ) {
    this._studentAttendace.set(studentAttendance);
  }

  // Merged: Your parameter handling + Remote's data transformation
  fetchStudentAttendanceDetails(
    params?: Partial<StudentAttendanceDetailsQueryParams> & {
      classId?: number | string | null;
      levelId?: number | string | null;
    },
  ): Observable<StudentAttendanceDetailsWidthSummary> {
    const classId =
      params?.classId ??
      this.schoolStructureListingService.selectedClass()?.id ??
      null;
    const levelId =
      params?.levelId ??
      this.schoolStructureListingService.selectedLevel()?.id ??
      null;

    return this.http
      .get<IResponse<StudentAttendanceDetailsWidthSummaryDTO>>(
        `${ApiUrl.v1BE}/attendances/students/${this.selectedStudent()!}`,
        {
          params: {
            // caller-provided (optional)
            ...(params ?? {}),
            // service-sourced required params
            schoolId: this.selectedSchoolId()!.toString(),
            ...(classId != null && { classId: String(classId) }),
            ...(levelId != null && { levelId: String(levelId) }),
            fromDate: this.selectedStartDate().toString(),
            toDate: this.selectedEndDate().toString(),
            academicYearId:
              this.academicYearScopeService.selectedAcademicYear()!.id,
          },
        },
      )
      .pipe(
        map((res) => {
          const mapData =
            ATTENDANCE_MAP_FROM_DTO.studentAttendanceDetailsWidthSummary(
              res.data,
            );
          this.updateStudentAttendance(mapData);
          return mapData;
        }),
      );
  }

  // Merged: Your parameter handling logic
  populateStudentOptions(
    params?: IStudentQueryParams,
    update = false,
    event?: InfiniteScrollCustomEvent,
  ) {
    const levelId =
      params?.levelId !== undefined
        ? params.levelId
        : (this._lastLevelId() ?? this.selectedLevel()?.id);

    const classId =
      params?.classId !== undefined
        ? params.classId
        : (this._lastClassId() ?? this.selectedClass()?.id);

    this._lastLevelId.set(levelId ?? null);
    this._lastClassId.set(classId ?? null);

    return this.studentService
      .fetchActiveOrPausedStudents(
        {
          ...params,
          itemsPerPage: params?.itemsPerPage ?? 10000,
          schoolId: this.selectedSchoolId()!.toString(),
          academicYearId:
            this.academicYearScopeService.selectedAcademicYear()!.id,
          ...(this._studentsListSearchText() && {
            searchText: this._studentsListSearchText(),
          }),
          ...(levelId != null && { levelId: levelId.toString() }),
          ...(classId != null && { classId }),
        },
        'attendances/students-list',
      )
      .pipe(
        map((res) => {
          if (update) {
            const nextList: any = res.data.map((n) => ({
              value: n.id,
              displayedValue: n.displayName,
              ...n,
            }));
            this._studentOptions.update((list) => {
              return list.concat(nextList);
            });
            event?.target.complete();
          } else {
            const list = res.data.map((n) => ({
              value: n.id,
              displayedValue: n.displayName,
            }));
            this._studentOptions.set(list);
          }
          this._studentOptionsPagination.set(res.paginate);
          return res;
        }),
        catchError((err) => {
          this._studentOptions.set([]);
          this._studentOptionsPagination.set(err.error.paginate);
          return of(null);
        }),
      );
  }

  clearStudentsOptions() {
    this._studentOptions.set([]);
  }
}
