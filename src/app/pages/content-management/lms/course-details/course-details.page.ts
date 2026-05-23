import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  input,
  effect,
  DestroyRef,
} from '@angular/core';
import { CourseDetailApiService } from './data-access/course-detail-api.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { DsProgressBarComponent } from '@ds/progress-bar/progress-bar.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { IonContent } from '@ionic/angular/standalone';
import { DsChipComponent } from '@ds/chip/chip.component';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import {
  AcademicYearDTO,
  SemesterDTO,
} from '@pages/academic-year/data-access/academic-year.dto';
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { DsIconComponent } from '@ds/icon/icon.component';
import { ActionListService } from '@shared/services/action-list.service';
import {
  CourseWeeklyDetailComponent,
  CourseWeeklyDetailConfig,
  JumpToWeekConfig,
} from './components/course-weekly-detail/course-weekly-detail.component';
import { WorkOverviewComponent } from './components/work-overview/work-overview.component';
import { CourseDetailSkeletonComponent } from './components/course-detail-skeleton/course-detail-skeleton.component';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { Subject, debounceTime, switchMap, of, catchError, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CourseDetailForStudent } from './data-access/course-detail.interface';

@Component({
  templateUrl: './course-details.page.html',
  standalone: true,
  imports: [
    IonContent,
    DsProgressBarComponent,
    TranslocoDirective,
    DsChipComponent,
    DsIconComponent,
    WorkOverviewComponent,
    CourseWeeklyDetailComponent,
    CourseDetailSkeletonComponent,
  ],
})
export class CourseDetailsPage implements OnInit {
  readonly courseId = input.required<string>(); // Route parameter as input
  readonly courseDetail = signal<CourseDetailForStudent | null>(null);
  private readonly cachedCourseDetail = signal<CourseDetailForStudent | null>(
    null,
  ); // Cache for subject info

  private readonly courseDetailApiService = inject(CourseDetailApiService);
  private readonly translationService = inject(HesTranslateService);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly actionListService = inject(ActionListService);
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );

  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly destroyRef = inject(DestroyRef);

  readonly contentLoading = signal<boolean>(true);
  protected readonly faChevronRight = faChevronRight;
  readonly selectedSemester = signal<SemesterDTO | null>(null);
  readonly jumpToWeekConfig = signal<JumpToWeekConfig | null>(null);

  // Debounce subject for fetchCourseContents
  private readonly fetchCourseContentsSubject$ = new Subject<void>();
  readonly courseDetailVm = computed(() => {
    const detail = this.courseDetail();
    const cachedDetail = this.cachedCourseDetail();
    const selectedSemester = this.selectedSemester();
    const selectedAcademicYear =
      this.academicYearScopeService.selectedAcademicYear();
    const availableSemesters = this.getAvailableSemesters();

    if (!detail) {
      return this.createPlaceholderViewModel(
        cachedDetail,
        selectedSemester,
        selectedAcademicYear,
        availableSemesters,
      );
    }

    return this.createCourseViewModel(
      detail,
      selectedSemester,
      selectedAcademicYear,
      availableSemesters,
    );
  });

  /**
   * Extracts attachment URL based on current language preference
   */
  private getAttachmentUrl(
    detail: CourseDetailForStudent | null,
  ): string | undefined {
    if (!detail?.attachments?.length) return 'assets/icons/subject-default.svg';

    const lang = this.translationService.getActiveLang();
    const attachment =
      detail.attachments.find((att) => att.language === lang) ??
      detail.attachments[0];
    return attachment?.url ?? 'assets/icons/subject-default.svg';
  }

  /**
   * Creates placeholder view model using cached subject data when current course detail is null
   */
  private createPlaceholderViewModel(
    cachedDetail: CourseDetailForStudent | null,
    selectedSemester: SemesterDTO | null,
    selectedAcademicYear: AcademicYearDTO | null,
    availableSemesters: SemesterDTO[] | null,
  ) {
    return {
      attachmentUrl: this.getAttachmentUrl(cachedDetail),
      subjectName: cachedDetail?.subject?.displayName,
      courseStatus: null,
      weeksCompletionPercentage: 0,
      missedCount: 0,
      todoCount: 0,
      personnels: null,
      levelName: null,
      className: null,
      semesterName: selectedSemester?.semesterNumber,
      academicYearName: selectedAcademicYear?.name,
      isAllowSemesterChange: (availableSemesters?.length ?? 0) > 1,
      isPlaceholder: true,
    };
  }

  /**
   * Creates full course view model with all available data
   */
  private createCourseViewModel(
    detail: CourseDetailForStudent,
    selectedSemester: SemesterDTO | null,
    selectedAcademicYear: AcademicYearDTO | null,
    availableSemesters: SemesterDTO[] | null,
  ) {
    return {
      attachmentUrl: this.getAttachmentUrl(detail),
      subjectName: detail.subject.displayName,
      courseStatus: detail.course.status,
      weeksCompletionPercentage: detail.weeksCompletionPercentage || 0,
      missedCount: detail.missedCount || 0,
      todoCount: detail.todoCount || 0,
      personnels: detail.personnel.displayName,
      levelName: detail.level.displayName,
      className: detail.classesDisplayName,
      semesterName: selectedSemester?.name,
      academicYearName: selectedAcademicYear?.name,
      isAllowSemesterChange: (availableSemesters?.length ?? 0) > 1,
      isPlaceholder: false,
    };
  }

  // Computed properties for child component inputs
  readonly weeklyScopeParams = computed(
    (): CourseWeeklyDetailConfig => ({
      academicYearId: this.selectedSemester()?.academicYearId!,
      semesterId: this.selectedSemester()?.id!,
      schoolId: this.schoolStructureScopeService.selectedSchoolId()!,
      studentId: this.studentSelectionScopeService.selectedStudentId()!,
      courseId: Number(this.courseId()),
    }),
  );

  constructor() {
    // Set up debounced fetchCourseContents
    this.fetchCourseContentsSubject$
      .pipe(
        debounceTime(300), // 300ms debounce
        switchMap(() => {
          const courseId = this.courseId();
          if (!courseId) {
            return of(null);
          }
          return this.performFetchCourseContents();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    // Watch for courseId changes and trigger debounced fetch
    effect(() => {
      const courseId = this.courseId();
      const semester = this.selectedSemester();
      const studentId = this.studentSelectionScopeService.selectedStudentId();
      if (courseId && semester && studentId) {
        this.fetchCourseContents();
      }
    });
  }

  ngOnInit() {
    const semester = this.academicYearScopeService.selectedSemester();
    if (semester) {
      this.selectedSemester.set(semester);
    }
  }

  ionViewWillEnter() {
    this.fetchCourseContents();
  }

  protected onSemesterDialogOpen() {
    const semesters = this.getAvailableSemesters();

    // Only allow semester change if there are more than one semester
    if (!semesters || semesters.length <= 1) {
      return;
    }

    const items =
      semesters?.map((sem) => ({
        id: sem.id?.toString(),
        title: `${this.translationService.t('global.semester.title')} ${sem.semesterNumber}`,
        endIconConfig: {
          showArrow: true,
        },
      })) ?? [];
    this.actionListService.show({
      title: 'global.select_semester.placeholder',
      onItemAction: ({ id }) => {
        const semester = this.getAvailableSemesters()?.find(
          (sem) => sem.id?.toString() === id?.toString(),
        );
        if (semester) {
          this.selectedSemester.set(semester);
        }
      },
      items,
      activeItemIndex: items.findIndex(
        (item) =>
          item.id?.toString() === this.selectedSemester()?.id?.toString(),
      ),
    });
  }

  onJumpToWeek = (config: JumpToWeekConfig) => {
    this.jumpToWeekConfig.set(config);
  };

  /**
   * Silently fetches course contents without loading indicators.
   * Used for background refreshing on user events.
   */
  silentlyFetchCourseContents() {
    this.performFetchCourseContents(false).subscribe();
  }

  // Debounced fetch method - triggers the subject
  private fetchCourseContents() {
    this.fetchCourseContentsSubject$.next();
  }

  private performFetchCourseContents(showLoader: boolean = true) {
    const courseId = this.courseId();
    if (!courseId) {
      return of(null);
    }
    const schoolId = this.schoolStructureScopeService.selectedSchoolId();
    const fetchParams: any = {
      academicYearId: this.selectedSemester()?.academicYearId,
      semesterId: this.selectedSemester()?.id,
      studentId: this.studentSelectionScopeService.selectedStudentId(),
      includeData: ['TOPIC', 'WEEK'].toString(),
      courseId: Number(courseId),
    };
    if (schoolId !== null && schoolId !== undefined) {
      fetchParams.schoolId = schoolId;
    }

    if (showLoader) {
      this.contentLoading.set(true);
    }

    return this.courseDetailApiService.fetchCourseContents(fetchParams).pipe(
      tap((data) => {
        const courseDetail = data[0];
        this.courseDetail.set(courseDetail);
        // Cache the course detail for subject info (name, image)
        if (courseDetail) {
          this.cachedCourseDetail.set(courseDetail);
        }
        this.contentLoading.set(false);
      }),
      catchError((error) => {
        if (error.status === 404) {
          this.courseDetail.set(null);
        }
        this.contentLoading.set(false);
        return of(null);
      }),
    );
  }

  private getAvailableSemesters() {
    const allSemesters =
      this.academicYearScopeService.selectedAcademicYearSemesters();
    if (!allSemesters) return null;

    const today = new Date();

    // Filter out future semesters (semesters that haven't started yet)
    return allSemesters.filter((semester) => {
      const semesterStartDate = new Date(semester.startDate);
      // Include semesters that have started (start date is today or in the past)
      return semesterStartDate <= today;
    });
  }
}
