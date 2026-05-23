import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AttendanceCalendarComponent,
  DsAttendanceConfig,
} from '@ds/calendar/attendance-calendar.component';
import { StudentAttendanceDetailService } from './data-access/student-attendance-detail.service';
import { AuthService } from '@auth/auth.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  of,
  skip,
  switchMap,
  tap,
  debounceTime,
  Subject,
  combineLatest,
} from 'rxjs';
import {
  DsCalendarGridRange,
  DsCalendarReadyEvent,
} from '@ds/calendar/calender.interface';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { TranslocoService } from '@jsverse/transloco';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { isBefore } from 'date-fns';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-student-attendance-detail',
  templateUrl: './student-attendance-detail.page.html',
  standalone: true,
  imports: [AttendanceCalendarComponent, CdkScrollable, IonContent],
})
export class StudentAttendanceDetailPage implements OnInit {
  calendarMonth = signal<number | null>(null);
  calendarYear = signal<number | null>(null);
  // #region inject
  private readonly translationService = inject(TranslocoService);
  private readonly attendanceDetailService = inject(
    StudentAttendanceDetailService,
  );

  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly authService = inject(AuthService);
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );
  private readonly route = inject(ActivatedRoute);

  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly selectedStudentId = computed(() => {
    const user = this.authService.user();
    if (this.authService.isUserStudent()) {
      return user!.userTypeId;
    }
    return this.studentSelectionScopeService.selectedStudent()?.id;
  });

  private readonly selectedStudentSchoolId = computed(() => {
    return this.schoolStructureScopeService.selectedSchoolId();
  });

  private readonly selectedAcademicYearId = computed(() => {
    return this.academicYearScopeService.selectedAcademicYear()?.id;
  });

  readonly local = this.translationService.getActiveLang();

  // Academic year date restrictions for calendar navigation
  readonly academicYearMinMonth = computed(() => {
    const academicYear = this.academicYearScopeService.selectedAcademicYear();
    if (!academicYear?.startDate) return undefined;

    const startDate = new Date(academicYear.startDate);
    return {
      month: startDate.getMonth(),
      year: startDate.getFullYear(),
    };
  });

  readonly academicYearMaxMonth = computed(() => {
    const academicYear = this.academicYearScopeService.selectedAcademicYear();
    if (!academicYear?.endDate) return undefined;

    const endDate = new Date(academicYear.endDate);
    const currentDate = new Date();

    // Use the earlier date between academic year end and current date
    const maxDate = isBefore(endDate, currentDate) ? endDate : currentDate;

    return {
      month: maxDate.getMonth(),
      year: maxDate.getFullYear(),
    };
  });
  // #endregion

  readonly effectiveMonth = computed(() =>
    this.calendarMonth() !== null
      ? this.calendarMonth()!
      : new Date().getMonth(),
  );
  readonly effectiveYear = computed(() =>
    this.calendarYear() !== null
      ? this.calendarYear()!
      : new Date().getFullYear(),
  );
  calendarGridStart = signal<Date | null>(null);
  calendarGridEnd = signal<Date | null>(null);
  readonly attendanceConfig = signal<DsAttendanceConfig | null>(null);
  private readonly calendarChange$ = new Subject<DsCalendarGridRange>();

  constructor() {
    combineLatest([
      toObservable(this.selectedStudentId),
      toObservable(this.selectedAcademicYearId),
    ])
      .pipe(
        takeUntilDestroyed(),
        skip(1),
        debounceTime(10),
        switchMap((obj) => this.fetchAttendance()),
      )
      .subscribe();

    this.calendarChange$
      .pipe(
        tap((e) => {
          this.updateCalendarRange(e.month, e.year, e.startDate, e.endDate);
          this.attendanceConfig.set(null);
        }),
        debounceTime(400),
        takeUntilDestroyed(),
        switchMap((e) => {
          return this.fetchAttendance();
        }),
      )
      .subscribe();
  }

  ngOnInit(): void {}

  onCalendarMonthChange(e: DsCalendarGridRange) {
    this.calendarChange$.next(e);
  }

  onCalendarReady({ range }: DsCalendarReadyEvent) {
    this.calendarChange$.next(range);
  }

  private fetchAttendance() {
    const studentId = this.selectedStudentId();
    const startDate = this.calendarGridStart();
    const endDate = this.calendarGridEnd();
    if (!studentId || !startDate || !endDate) return EMPTY;
    const academicYearId = this.selectedAcademicYearId();
    return this.attendanceDetailService
      .fetchStudentAttendanceDetails(studentId, {
        fromDate: startDate!,
        toDate: endDate!,
        schoolId: this.selectedStudentSchoolId()!,
        ...(academicYearId && { academicYearId: academicYearId }),
      })
      .pipe(
        tap((data) => {
          const { dates, attendanceStats, calenderStats } = data ?? {};

          this.attendanceConfig.set({
            dates: dates ?? [],
            attendanceStats: attendanceStats ?? {},
            calenderStats: calenderStats ?? {},
            student: data.student,
          });
        }),
        catchError(() => {
          return of(null);
        }),
      );
  }

  /**
   * Updates calendar range only (no fetch)
   */
  private updateCalendarRange(
    month: number,
    year: number,
    startDate: Date,
    endDate: Date,
  ) {
    this.calendarMonth.set(month);
    this.calendarYear.set(year);
    this.calendarGridStart.set(startDate);
    this.calendarGridEnd.set(endDate);
  }
}
