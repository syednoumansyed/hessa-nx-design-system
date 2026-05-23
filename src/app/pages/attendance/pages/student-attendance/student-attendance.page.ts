import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { ListingHeaderComponent } from '../../../../shared/components/user-listing-header/listing-header.component';
import { ViewAttendanceColDefService } from '@pages/attendance/data-access/view-attendance-col-def.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthService } from '@auth/auth.service';
import { UserType, Language } from '@shared/enums';
import { StudentAttendanceService } from './data-access/student-attendance.service';
import {
  FormControlGeneratorComponent,
  IControl,
} from '../../../../shared/components/form-control-generator/form-control-generator.component';
import { format, formatDate, parseISO } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { AttendanceStatus } from '@pages/attendance/data-access/attendance.dto';
import { IStudentAttendanceListingItem } from '@pages/attendance/data-access/attendance.interface';
import { HesIconComponent } from '../../../../shared/components/hes-icon/hes-icon.component';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { isMobile } from '@shared/utils/platform';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '../../../../shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { skip, catchError, map, Observable, of } from 'rxjs';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import {
  DsResponsiveTableComponent,
  DsResponsiveColumn,
  DsResponsiveTableConfig,
  DsDataSourceRequest,
  DsDataSourceResponse,
  DsHeaderPrefixDirective,
} from '@ds/ds-responsive-table';
import { DsAgGridTitleSubtitleCellComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-cell.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { AttendanceCellComponent } from '@pages/attendance/components/attendance-cell/attendance-cell.component';

@Component({
  selector: 'app-student-attendance',
  templateUrl: './student-attendance.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    ReactiveFormsModule,
    ListingHeaderComponent,
    TranslocoDirective,
    FormControlGeneratorComponent,
    HesIconComponent,
    NoSelectedScopeCardComponent,
    NgClass,
    DsResponsiveTableComponent,
    DsHeaderPrefixDirective,
    DsAgGridTitleSubtitleCellComponent,
    AvatarComponent,
  ],
})
export class StudentAttendancePage implements OnInit {
  AttendanceStatus = AttendanceStatus;
  isMobile = isMobile();

  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly colDefService = inject(ViewAttendanceColDefService);
  private readonly auth = inject(AuthService);
  private readonly studentAttendanceService = inject(StudentAttendanceService);
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );
  private readonly academicYearService = inject(AcademicYearsScopeService);
  private readonly translocoService = inject(HesTranslateService);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  readonly destroyRef = inject(DestroyRef);

  private readonly tableRef = viewChild(DsResponsiveTableComponent);

  // ── Old listing header filter form ─────────────────────────────────────────
  filterForms!: FormGroup;

  dateRangeForm = this.formBuilder.group<{
    dateRange: { from: Date; to: Date };
  }>({
    dateRange: { from: new Date(), to: new Date() },
  });

  dateRangeControl: IControl = {
    type: 'date-range',
    formControlName: 'dateRange',
    placeholder: 'From - To',
    required: false,
  };

  listingDropdownFilters = computed(() => {
    if (this.hideHeaderFilters()) return [];
    return this.colDefService.listingDropdownFilters();
  });

  // ── Cached rows (for status card client-side filtering without re-fetch) ──
  private readonly _cachedAttendanceRows = signal<
    IStudentAttendanceListingItem[]
  >([]);
  private readonly _cachedFetchKey = signal<string>('');

  // ── Public signals ─────────────────────────────────────────────────────────
  selectedStatus = this.studentAttendanceService.selectedStatus;
  selectedStudent = this.studentAttendanceService.selectedStudent;
  studentOptions = this.studentAttendanceService.studentOptions;
  displayContent = signal(false);

  hideHeaderFilters = computed(
    () =>
      this.auth.user()?.type === UserType.STUDENT ||
      this.auth.user()?.type === UserType.GUARDIAN,
  );

  studentDetails = computed(
    () => this.studentAttendanceService.studentAttendace()?.student,
  );

  studentAttendanceCount = computed(
    () => this.studentAttendanceService.studentAttendace()?.attendanceStats,
  );

  studentAvatar = computed(() =>
    this.studentDetails()?.displayName
      ? this.getFirstLetters(this.studentDetails()?.displayName!)
      : '',
  );

  statusOptions = this.colDefService.statusOptions;

  SelectedStatusDisplayedValue = computed(
    () =>
      this.statusOptions()?.find((item) => item.value === this.selectedStatus())
        ?.displayedValue,
  );

  readonly requiredScopes = computed<Array<HesScope>>(() =>
    this.auth.user()?.type === 'PERSONNEL'
      ? ['school', 'academicYear']
      : ['school', 'academicYear', 'student'],
  );

  // ── Columns ───────────────────────────────────────────────────────────────
  readonly columns = computed<
    DsResponsiveColumn<IStudentAttendanceListingItem>[]
  >(() => {
    const lang = this.translocoService.getActiveLang();
    const locale = lang === Language.ARABIC ? arSA : enUS;
    return [
      {
        field: 'date',
        valueGetter: (params) => {
          const date = (params.data as IStudentAttendanceListingItem)?.date;
          if (!date) return '-';
          try {
            return format(parseISO(date), 'dd/MM/yyyy');
          } catch {
            return date;
          }
        },
        headerName: this.t('global.date.title'),
        sortable: false,
        pinned: 'start',
        lockPinned: true,
        cellRenderer: DsAgGridTitleSubtitleCellComponent,
        cellRendererParams: {
          subtitleGetter: (data: IStudentAttendanceListingItem) => {
            if (!data.date) return '';
            try {
              return format(parseISO(data.date), 'EEEE', { locale });
            } catch {
              return '';
            }
          },
        },
        mobile: { slot: 'title' },
      },
      {
        field: 'attendance',
        headerName: this.t('attendance.daily_attendance.title'),
        sortable: false,
        cellRenderer: AttendanceCellComponent,
        dsCell: {
          type: 'badge',
          badge: {
            labelFn: (value) => (value ? this.t('enum.' + value) : '-'),
          },
        },
        mobile: { slot: 'badge', badgeField: 'attendance' },
      },
      {
        field: 'checkIn',
        headerName: this.t('attendance.check_in.title'),
        sortable: false,
        valueFormatter: (params) => (params.value as string) || '-',
        mobile: { slot: 'metadata' },
      },
      {
        field: 'checkOut',
        headerName: this.t('attendance.check_out.title'),
        sortable: false,
        valueFormatter: (params) => (params.value as string) || '-',
        mobile: { slot: 'metadata' },
      },
      {
        field: 'attendanceType',
        headerName: this.t('attendance.attendance_type.title'),
        sortable: false,
        valueFormatter: (params) => {
          const v = params.value as string | null | undefined;
          return v ? this.t('enum.' + v) : '-';
        },
        mobile: { slot: 'metadata' },
      },
      {
        field: 'reason',
        headerName: this.t('attendance.reason_for_leave.title'),
        sortable: false,
        valueFormatter: (params) => (params.value as string) || '-',
        mobile: { slot: 'metadata' },
      },
    ];
  });

  // ── Table config (no filters — old header handles filtering) ───────────────
  readonly config = computed<
    DsResponsiveTableConfig<IStudentAttendanceListingItem>
  >(() => ({
    columns: this.columns(),
    dataSource: (req) => this.fetchData(req),
    emptyState: {
      imagePath: 'assets/illustrations/no_data.svg',
      title: this.selectedStudent()
        ? this.t('global.no_data.txt')
        : this.t('attendance.select_student_to_view.txt'),
    },
    table: {
      autoSizeStrategy: { type: 'fitGridWidth' },
      showZoom: true,
    },
    persistState: false,
  }));

  constructor() {
    // GUARDIAN: student comes from scope service, not filter panel
    if (this.auth.user()?.type === UserType.GUARDIAN) {
      toObservable(this.studentSelectionScopeService.selectedStudent)
        .pipe(takeUntilDestroyed())
        .subscribe((student) => {
          if (!student) {
            this.studentAttendanceService.updateSelectedStudent(null);
            this.studentAttendanceService.updateStudentAttendance(null);
          } else {
            this.studentAttendanceService.updateSelectedStudent(student.id);
            this.populateStudentAttendances();
          }
        });
    }

    // Reset when school structure changes
    toObservable(
      this.schoolStructureListingService.selectedSchoolStructureModel,
    )
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe((v) => {
        this.studentAttendanceService.updateSelectedStudent(null);
        this.studentAttendanceService.updateStudentAttendance(null);
        this._cachedAttendanceRows.set([]);
        this._cachedFetchKey.set('');
        this.filterForms?.controls['studentId']?.setValue(null);
        // Refresh table to show empty state with cleared data
        this.tableRef()?.refreshFromFirstPage();

        if (this.auth.isUserPersonnel()) {
          if (v.selectedLevel && v.selectedClass) {
            this.studentAttendanceService
              .populateStudentOptions({
                levelId: v.selectedLevel.id.toString(),
                classId: v.selectedClass.id,
                studentClassStatus: 'ACTIVE',
              })
              .pipe(
                map((res) => {
                  const firstId = res?.data?.[0]?.id ?? null;
                  this.studentAttendanceService.updateSelectedStudent(firstId);
                  this.filterForms?.controls['studentId']?.setValue(firstId);
                }),
              )
              .subscribe();
          } else {
            this.studentAttendanceService.clearStudentsOptions();
          }
        } else {
          if (this.selectedStudent()) {
            this.populateStudentAttendances();
          }
        }
      });
  }

  ngOnInit(): void {
    this.studentAttendanceService.updateSelectedStartDate(
      formatDate(new Date().toISOString(), 'yyyy-MM-dd'),
    );
    this.studentAttendanceService.updateSelectedEndDate(
      formatDate(new Date().toISOString(), 'yyyy-MM-dd'),
    );

    this.dateRangeForm.valueChanges.subscribe(({ dateRange }) => {
      this.studentAttendanceService.updateSelectedStartDate(
        formatDate(dateRange!.from, 'yyyy-MM-dd'),
      );
      this.studentAttendanceService.updateSelectedEndDate(
        formatDate(dateRange!.to, 'yyyy-MM-dd'),
      );
      this.populateStudentAttendances();
    });

    this.schoolStructureListingService.selectFirstLevel();
  }

  ionViewWillEnter() {
    const schoolId = this.schoolScopeService.selectedSchoolId();
    const student = this.selectedStudent();
    const academicYear = this.academicYearService.selectedAcademicYear();
    if (schoolId && student && academicYear) {
      this.populateStudentAttendances();
    }
  }

  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  onFiltersChange(_filters: any) {}

  updateFormGroup(formGroup: FormGroup) {
    this.filterForms = formGroup;
    this.filterForms.controls['studentId']?.valueChanges.subscribe(
      (v: number | null) => {
        this.studentAttendanceService.updateSelectedStudent(v);
        if (v) {
          this.populateStudentAttendances();
        } else {
          this.studentAttendanceService.updateStudentAttendance(null);
        }
      },
    );
  }

  getFirstLetters(name: string): string {
    const words = name?.split(' ');
    const firstLetters = words?.map((word) => word.charAt(0));
    return firstLetters?.join('');
  }

  updateSelectedStatus(status: AttendanceStatus | null) {
    this.studentAttendanceService.updateSelectedStatus(status);
    this.tableRef()?.refreshFromFirstPage();
  }

  // ── Data fetching (reads from service, not table filters) ──────────────────
  populateStudentAttendances() {
    const classId =
      this.schoolStructureListingService.selectedClass()?.id ?? null;
    const levelId =
      this.schoolStructureListingService.selectedLevel()?.id ?? null;
    this.studentAttendanceService
      .fetchStudentAttendanceDetails({
        ...(classId !== null && { classId }),
        ...(levelId !== null && { levelId }),
      })
      .subscribe({
        next: () => this.tableRef()?.refreshFromFirstPage(),
        error: () =>
          this.studentAttendanceService.updateStudentAttendance(null),
      });
  }

  private fetchData(
    _req: DsDataSourceRequest,
  ): Observable<DsDataSourceResponse<IStudentAttendanceListingItem>> {
    const studentId = this.studentAttendanceService.selectedStudent();
    if (!studentId) {
      return of({ data: [] });
    }

    const status = this.selectedStatus();
    const rows = (
      this.studentAttendanceService.studentAttendace()?.attendances ?? []
    ).map((a) => ({
      date: a.date,
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      attendance: a.attendanceStatus,
      attendanceType: a.type,
      reason: a.reason,
    }));

    return of({
      data: status ? rows.filter((r) => r.attendance === status) : rows,
    });
  }

  private t(key: string): string {
    return this.translocoService.t(key);
  }
}
