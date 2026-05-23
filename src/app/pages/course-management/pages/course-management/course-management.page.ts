import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import {
  faPlus,
  faPen,
  faEye,
  faTrashCan,
} from '@fortawesome/pro-regular-svg-icons';
import { map, Observable, of, switchMap } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { getDaysOfWeek } from '@pages/course-management/utils/day-of-week.utils';
import { DsSelectOption } from '@ds/select/select.interface';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import {
  NoSelectedScopeCardComponent,
  HesScope,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import {
  DsResponsiveTableComponent,
  DsHeaderPrefixDirective,
  DsResponsiveTableConfig,
  DsResponsiveColumn,
  DsDataSourceRequest,
  DsDataSourceResponse,
} from '@ds/ds-responsive-table';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';
import {
  DsSchoolStructureControlValue,
  DsSchoolStructureEntityType,
} from '@ds/school-structure-control/types/school-structure-control.types';
import { StructureDepth } from '@shared/utils/school-structure';
import { CourseManagementModalService } from '@pages/course-management/utils/course-management-modal.service';
import { LectureModalService } from '@pages/course-management/utils/lecture-modal.service';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { CourseManagement } from '@pages/course-management/data-access/course-management.interface';
import { LectureTableCellComponent } from '@pages/course-management/components/lecture-table-cell/lecture-table-cell.component';
import { SortOrder, UserType } from '@shared/enums';
import { AuthService } from '@auth/auth.service';
import { SchoolService } from '@pages/school-structure/pages/school/school.service';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { LayoutService } from '@layout/layout.service';
import { DsAgGridTitleSubtitleCellComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-cell.component';
import { DsAgGridTitleSubtitleHeaderComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-header.component';
import { DayOfWeekPipe } from '@pages/course-management/pipes/day-of-week.pipe';
import { Time12hrPipe } from '@pages/course-management/pipes/time-12-hr.pipe';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsMobileFooterContext } from '@ds/ds-responsive-table';

export interface CourseTableRow {
  id: number;
  subjectName: string;
  personnelName: string;
  lectureCount: number;
  academicYearName: string;
  companyName: string;
  campusName: string;
  schoolName: string;
  levelName: string;
  className: string;
  status: string;
  creditHour: number;
  lectures: CourseManagement['lectures'];
  course: CourseManagement;
  hasContents: boolean;
}

@Component({
  selector: 'app-course-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DsResponsiveTableComponent,
    DsHeaderPrefixDirective,
    DsButtonComponent,
    NoSelectedScopeCardComponent,
    DayOfWeekPipe,
    Time12hrPipe,
    TranslocoDirective,
  ],
  providers: [SchoolStructureListingService],
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <app-no-selected-scope-card
        [requiredScope]="requiredScopes"
        (onScopeUpdate)="handleDisplayContent($event)"
      />
      @if (displayContent()) {
        <ds-responsive-table
          class="flex min-h-0 flex-1 flex-col"
          [config]="config()"
          (rowClicked)="onRowClicked($event)"
        >
          <ng-template dsHeaderPrefix>
            <div class="hidden w-full items-center gap-ds-lg lg:flex">
              @if (rbacService.hasPermission(courseCreatePermission)) {
                <ds-button
                  class="ms-auto"
                  variant="primary"
                  size="md"
                  [iconStart]="faPlus"
                  (click)="onAddCourse()"
                >
                  {{ t('course_management.add_course.btn') }}
                </ds-button>
              }
            </div>
          </ng-template>
        </ds-responsive-table>
      }
    </div>

    <!-- Mobile footer: company → campus/school + lectures in one box -->
    <ng-template #mobileLectureFooter let-data="data">
      <div
        *transloco="let t"
        class="flex flex-col gap-ds-lg rounded-ds-lg bg-surface-pastel-background-blue px-ds-xl py-ds-md"
      >
        @if (data.companyName) {
          <div class="flex items-center justify-between gap-ds-md">
            <span class="single-line-sm-low-emphasis text-emphasis-mid">{{
              t('global.company.title')
            }}</span>
            <span
              class="content-md-high-emphasis text-end text-emphasis-high"
              >{{ data.companyName }}</span
            >
          </div>
        }
        @if (data.campusName) {
          <div class="flex items-center justify-between gap-ds-md">
            <span class="single-line-sm-low-emphasis text-emphasis-mid">{{
              t('global.campus.title')
            }}</span>
            <div class="flex flex-col items-end">
              <span
                class="content-md-high-emphasis text-end text-emphasis-high"
                >{{ data.campusName }}</span
              >
              @if (data.schoolName) {
                <span
                  class="single-line-sm-low-emphasis text-end text-emphasis-mid"
                  >{{ data.schoolName }}</span
                >
              }
            </div>
          </div>
        }
        @for (lecture of data.lectures; track lecture.id) {
          <div
            class="flex cursor-pointer items-center justify-between gap-ds-md"
            (click)="onViewLecture(data.course, lecture)"
          >
            <span class="single-line-xs-low-emphasis text-emphasis-mid">{{
              lecture.dayOfWeek | dayOfWeek
            }}</span>
            <span
              class="single-line-xs-high-emphasis whitespace-nowrap text-emphasis-high"
            >
              {{ t('enum.PERIOD') }} {{ lecture.periodNumber }} ({{
                lecture.startTime | time12hr
              }}
              - {{ lecture.endTime | time12hr }})
            </span>
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class CourseManagementPage implements OnInit, OnDestroy {
  protected readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly layoutService = inject(LayoutService);
  private readonly courseService = inject(CourseManagementService);
  private readonly schoolService = inject(SchoolService);
  private readonly courseManagementModalService = inject(
    CourseManagementModalService,
  );
  private readonly lectureModalService = inject(LectureModalService);
  private readonly translocoService = inject(HesTranslateService);
  private readonly transloco = inject(TranslocoService);
  private readonly scopeService = inject(SchoolStructureScopeService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly authService = inject(AuthService);

  protected readonly faPlus = faPlus;
  protected readonly courseCreatePermission =
    RESOURCE_PERMISSION.course.courseCreate;
  protected readonly requiredScopes: HesScope[] = ['school', 'academicYear'];
  protected readonly displayContent = signal(false);

  private readonly tableRef = viewChild(DsResponsiveTableComponent);
  private readonly mobileLectureFooter = viewChild<
    TemplateRef<DsMobileFooterContext<CourseTableRow>>
  >('mobileLectureFooter');

  // ── Subject / Teacher options for filters ────────────────────────────────
  // Tracks the school-structure value selected INSIDE the filter modal before
  // Apply is clicked. Updated via the filter's onChange callback.
  private readonly modalSchoolValue = signal<
    DsSchoolStructureControlValue[] | null
  >(null);

  // Resolve the effective school ID from the modal selection (or sidebar scope
  // as fallback). For levels and classes, the parent school is found by
  // traversing the user-scoped structure tree.
  private readonly filterSchoolId = computed<number | null>(() => {
    const modalVal = this.modalSchoolValue();
    const item = modalVal?.length
      ? modalVal[0]
      : this.scopeService.selectedSchoolStructureItem();
    if (!item) return null;
    if (item.type === 'school') return item.id;
    if (
      item.type === 'level' ||
      item.type === 'class' ||
      item.type === 'school_level'
    ) {
      return this.findSchoolIdInTree(
        this.scopeService.userScopedSchoolStructure(),
        item.type,
        item.id,
      );
    }
    return null; // campus / company — no single school
  });

  /** Traverse the structure tree to find the school that owns a level or class. */
  private findSchoolIdInTree(
    nodes: sideMenuSchoolStructureItem[],
    targetType: string,
    targetId: number,
  ): number | null {
    for (const node of nodes) {
      if (node.type === 'school') {
        for (const level of node.children ?? []) {
          if (targetType === 'level' && level.id === targetId) {
            return node.id;
          }
          if (
            targetType === 'school_level' &&
            (level as any).schoolLevelId === targetId
          ) {
            return node.id;
          }
          for (const cls of level.children ?? []) {
            if (targetType === 'class' && cls.id === targetId) {
              return node.id;
            }
          }
        }
      } else if (node.children?.length) {
        const found = this.findSchoolIdInTree(
          node.children,
          targetType,
          targetId,
        );
        if (found !== null) return found;
      }
    }
    return null;
  }

  // Subject options: still driven by table-filters-data with scope params
  private readonly filterScopeParams = computed<Record<string, unknown>>(() => {
    const schoolId = this.filterSchoolId();
    if (schoolId) return { schoolId };
    const modalVal = this.modalSchoolValue();
    const item = modalVal?.length
      ? modalVal[0]
      : this.scopeService.selectedSchoolStructureItem();
    if (!item) return {};
    switch (item.type) {
      case 'company':
      case 'sub-company':
        return { companyId: item.id };
      case 'campus':
        return { campusId: item.id };
      default:
        return {};
    }
  });

  /** All subjects with personnel data — unscoped so filter dropdowns show everything */
  private readonly teacherSubjectData = toSignal(
    this.courseService.getSubjectAndTeacherData(),
    { initialValue: [] },
  );

  private readonly subjectOptions = computed<DsSelectOption[]>(() =>
    this.teacherSubjectData()
      .map((s) => ({ id: s.id, display: s.displayName }))
      .sort((a, b) => a.display.localeCompare(b.display)),
  );

  /** Selected course/subject ID from the filter — used to narrow teacher list */
  private readonly selectedSubjectId = signal<number | null>(null);

  /** Flatten personnel from table-filters-data subjects.
   *  If a course is selected, show only teachers for that course.
   *  Otherwise show all unique teachers across all subjects. */
  private readonly teacherOptions = computed<DsSelectOption[]>(() => {
    const data = this.teacherSubjectData();
    const selectedSubject = this.selectedSubjectId();
    const subjects = selectedSubject
      ? data.filter((s) => s.id === selectedSubject)
      : data;
    const seen = new Map<number, DsSelectOption>();
    for (const subject of subjects) {
      for (const course of subject.courses) {
        if (!seen.has(course.personnel.id)) {
          seen.set(course.personnel.id, {
            id: course.personnel.id,
            display: course.personnel.displayName,
          });
        }
      }
    }
    return [...seen.values()].sort((a, b) =>
      a.display.localeCompare(b.display),
    );
  });

  // ── Scope-change effect: push sidebar scope into table filters ──────────
  private readonly _scopeChangeEffect = effect(() => {
    const scopeItem = this.scopeService.selectedSchoolStructureItem();
    const academicYear = this.academicYearScope.selectedAcademicYear();
    const table = this.tableRef();
    if (!table) return;

    const updates: DsFiltersValue = {};
    updates['schoolStructure'] = scopeItem
      ? ([
          { id: scopeItem.id, type: scopeItem.type, name: scopeItem.name },
        ] as any)
      : undefined;
    updates['academicYearId'] = academicYear ? academicYear.id : undefined;
    untracked(() => table.updateFilters(updates));
  });

  // ── Refresh table when lecture add/edit completes ───────────────────────
  private readonly _lectureRefresh = this.lectureModalService.onRefresh$
    .pipe(takeUntilDestroyed())
    .subscribe(() => this.tableRef()?.refreshFromFirstPage());

  // ── Refresh table (from page 1) when course add/edit completes ──────────
  private readonly _courseRefresh =
    this.courseManagementModalService.onSuccessCourse$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.tableRef()?.refreshFromFirstPage());

  // ── Initial filters seeded from sidebar scope ────────────────────────────
  private readonly initialFilters = computed<DsFiltersValue>(() => {
    const filters: DsFiltersValue = {};
    const item = this.scopeService.selectedSchoolStructureItem();
    if (item) {
      filters['schoolStructure'] = [
        { id: item.id, type: item.type, name: item.name },
      ] as any;
    }
    const academicYear = this.academicYearScope.selectedAcademicYear();
    if (academicYear) {
      filters['academicYearId'] = academicYear.id;
    }
    return filters;
  });

  // ── Columns ──────────────────────────────────────────────────────────────
  private readonly columns = computed<DsResponsiveColumn<CourseTableRow>[]>(
    () => [
      // 1. Course / Teacher — combined title+subtitle cell (pinned start)
      {
        field: 'subjectName',
        headerName: this.t('resource.course'),
        headerComponent: DsAgGridTitleSubtitleHeaderComponent,
        headerComponentParams: {
          title: this.t('resource.course'),
          subtitle: this.t('course_management.teacher.title'),
        },
        cellRenderer: DsAgGridTitleSubtitleCellComponent,
        cellRendererParams: {
          titleField: 'subjectName',
          subtitleFields: ['personnelName'],
        },
        pinned: 'start',
        lockPinned: true,
        sortable: true,
        mobile: { slot: 'title' },
      },
      // Hidden teacher column — data source for subtitle cell, shown on mobile
      {
        field: 'personnelName',
        headerName: this.t('course_management.teacher.title'),
        hide: true,
        excludeFromCustomization: true,
        mobile: { slot: 'subtitle' },
      },
      {
        field: 'lectureCount',
        headerName: this.t('resource.lecture'),
        cellRenderer: LectureTableCellComponent,
        minWidth: 220,
        fitContent: true,
        suppressSizeToFit: true,
      },
      {
        field: 'academicYearName',
        headerName: this.t('global.academic_year.title'),
        sortable: true,
      },
      {
        field: 'className',
        headerName: this.t('global.class.title'),
        sortable: true,
        mobile: { slot: 'badge', order: 2 },
      },
      {
        field: 'levelName',
        headerName: this.t('global.level.title'),
        sortable: true,
        mobile: { slot: 'badge', order: 1 },
      },
      {
        field: 'schoolName',
        headerName: this.t('global.school.title'),
        sortable: true,
      },
      {
        field: 'campusName',
        headerName: this.t('global.campus.title'),
        sortable: true,
      },
      {
        field: 'companyName',
        headerName: this.t('global.company.title'),
        sortable: true,
      },
      {
        field: 'creditHour',
        headerName: this.t('grade_management.credit_hour.txt'),
      },
      {
        field: 'status',
        headerName: this.t('global.status.title'),
        sortable: true,
        dsCell: {
          type: 'badge',
          badge: {
            variantMap: {
              ACTIVE: 'success',
              INACTIVE: 'danger',
            },
            labelFn: (value: unknown) => this.t('enum.' + value),
          },
        },
        mobile: {
          slot: 'badge',
          badgeVariant: (value) => (value === 'ACTIVE' ? 'success' : 'danger'),
        },
      },
    ],
  );

  // ── Filters ──────────────────────────────────────────────────────────────
  private readonly filters = computed<DsFilterConfig[]>(() => [
    {
      type: 'search' as const,
      key: 'searchText',
      label: this.t('course_management.search.placeholder'),
      placeholder: this.t('course_management.search.placeholder'),
      exposed: true,
    },
    {
      type: 'school-structure' as const,
      key: 'schoolStructure',
      label: this.t('global.school.title'),
      placeholder: this.t('global.school.title'),
      isMultiSelect: false,
      depth: StructureDepth.CLASS,
      allowedSelections: [
        'company',
        'campus',
        'school',
        'level',
        'class',
      ] as DsSchoolStructureEntityType[],
      onChange: (value) => {
        this.modalSchoolValue.set(
          (value as DsSchoolStructureControlValue[] | null) ?? null,
        );
      },
    },
    {
      type: 'select' as const,
      key: 'subjectId',
      label: this.t('resource.course'),
      config: {
        options: this.subjectOptions(),
        placeholder: this.t('resource.course'),
        showSearch: true,
      },
      onChange: (value) =>
        this.selectedSubjectId.set((value as number) ?? null),
    },
    ...(!this.rbacService.isTeacherOnly()
      ? [
          {
            type: 'select' as const,
            key: 'personnelId',
            label: this.t('course_management.teacher.title'),
            config: {
              options: this.teacherOptions(),
              placeholder: this.t('course_management.teacher.title'),
              showSearch: true,
            },
            dependsOn: 'subjectId',
          },
        ]
      : []),
    {
      type: 'chip-selector' as const,
      key: 'lectureId',
      label: this.t('course_management.day_of_the_week_req.label'),
      options: getDaysOfWeek(this.transloco.getActiveLang()).map((d) => ({
        value: d.value,
        displayedValue: d.displayedValue as string,
      })),
    },
    {
      type: 'chip-selector' as const,
      key: 'status',
      label: this.t('global.status.title'),
      options: [
        { value: 'ACTIVE', displayedValue: this.t('enum.ACTIVE') },
        { value: 'INACTIVE', displayedValue: this.t('enum.INACTIVE') },
      ],
    },
    {
      type: 'chip-selector' as const,
      key: 'academicYearId',
      label: this.t('global.academic_year.title'),
      options: this.academicYearScope.academicYears().map((y) => ({
        value: y.id,
        displayedValue: y.name,
      })),
    },
  ]);

  // ── Row actions ──────────────────────────────────────────────────────────
  private readonly rowActions = computed(() => [
    {
      id: 'view',
      label: this.t('global.view.btn'),
      icon: faEye,
      action: (row: CourseTableRow) =>
        this.courseManagementModalService.onAddViewEditCourse(row.id, true),
      visible: () =>
        this.rbacService.hasPermission(
          RESOURCE_PERMISSION.course.courseDetailView,
        ),
    },
    {
      id: 'edit',
      label: this.t('global.edit.btn'),
      icon: faPen,
      action: (row: CourseTableRow) =>
        this.courseManagementModalService.onAddViewEditCourse(row.id),
      visible: () =>
        this.rbacService.hasPermission(RESOURCE_PERMISSION.course.courseUpdate),
    },
    {
      id: 'add-lecture',
      label: this.t('course_management.add_lecture.btn'),
      icon: faPlus,
      action: (row: CourseTableRow) =>
        this.lectureModalService.openLectureForm(row.course),
      visible: () =>
        this.rbacService.hasPermission(
          RESOURCE_PERMISSION.lecture.lectureCreate,
        ),
    },
    {
      id: 'delete',
      label: this.t('global.delete.btn'),
      icon: faTrashCan,
      action: (row: CourseTableRow) =>
        this.courseManagementModalService.deleteCourse(
          row.id,
          row.hasContents,
          row.lectureCount > 0,
        ),
      visible: () =>
        this.rbacService.hasSomePermission([
          RESOURCE_PERMISSION.course.courseDelete,
          RESOURCE_PERMISSION.course.courseDeleteWithContents,
        ]),
    },
  ]);

  // ── Table config ─────────────────────────────────────────────────────────
  readonly config = computed<DsResponsiveTableConfig<CourseTableRow>>(() => ({
    columns: this.columns(),
    dataSource: (req) => this.fetchCourses(req),
    filters: this.filters(),
    initialFilters: this.initialFilters(),
    rowActions: this.rowActions(),
    table: {
      autoSizeStrategy: { type: 'fitCellContents' as const },
    },
    emptyState: {
      imagePath: 'assets/illustrations/no_data.svg',
      title: this.t('course_management.no_courses.title'),
      description: this.rbacService.hasPermission(
        RESOURCE_PERMISSION.course.courseCreate,
      )
        ? this.t('course_management.no_courses_msg.text')
        : undefined,
    },
    mobile: {
      showSortButton: true,
      showMetadataBackground: false,
      footerTemplate: this.mobileLectureFooter() ?? undefined,
      ...(this.rbacService.hasPermission(this.courseCreatePermission) && {
        primaryAction: {
          label: this.t('course_management.add_course.btn'),
          icon: faPlus,
          action: () => this.onAddCourse(),
        },
      }),
    },
  }));

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.layoutService.updateSelectedSchoolInfoVisibility(true);
  }

  ngOnDestroy(): void {
    this.layoutService.updateSelectedSchoolInfoVisibility(false);
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  onAddCourse() {
    this.courseManagementModalService.onAddViewEditCourse();
  }

  onViewLecture(course: CourseManagement, lecture: any) {
    this.lectureModalService.onViewLecture(course, lecture as any);
  }

  onRowClicked(row: CourseTableRow) {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.course.courseDetailView,
      )
    ) {
      this.courseManagementModalService.onAddViewEditCourse(row.id, true);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Maps a column field name to the locale-prefixed sort column the courses API expects. */
  private toApiSortColumn(field: string): string {
    const p = this.transloco.getActiveLang() === 'ar' ? 'ar' : 'en';
    const map: Record<string, string> = {
      subjectName: `${p}SubjectName`,
      personnelName: `${p}PersonnelName`,
      className: `${p}ClassName`,
      levelName: `${p}LevelName`,
      schoolName: `${p}SchoolName`,
      campusName: `${p}CampusName`,
      companyName: `${p}CompanyName`,
      academicYearName: 'academicYear',
    };
    return map[field] ?? field;
  }

  // ── Data fetching ─────────────────────────────────────────────────────────
  private fetchCourses(
    request: DsDataSourceRequest,
  ): Observable<DsDataSourceResponse<CourseTableRow>> {
    const { page, perPage, sort, filters } = request;

    // Map school-structure filter to flat API params
    const schoolStructure = filters['schoolStructure'] as any;
    const structureParams: Record<string, unknown> = {};
    if (schoolStructure?.length) {
      const item = schoolStructure[0];
      switch (item.type) {
        case 'school':
          structureParams['schoolId'] = item.id;
          break;
        case 'campus':
          structureParams['campusId'] = item.id;
          break;
        case 'company':
        case 'sub-company':
          structureParams['companyId'] = item.id;
          break;
        case 'level':
        case 'school_level':
          structureParams['levelId'] = item.id;
          break;
        case 'class':
          structureParams['classId'] = item.id;
          break;
      }
    }

    const params: Record<string, unknown> = {
      pageNumber: page,
      itemsPerPage: perPage,
      ...(sort && {
        sortByColumn: this.toApiSortColumn(sort.field),
        order: sort.direction as SortOrder,
      }),
      ...(filters['searchText'] && { searchText: filters['searchText'] }),
      ...(filters['status'] && { status: filters['status'] }),
      ...(filters['academicYearId'] && {
        academicYearId: filters['academicYearId'],
      }),
      ...(filters['subjectId'] != null && { subjectId: filters['subjectId'] }),
      ...(filters['personnelId'] != null && {
        personnelId: filters['personnelId'],
      }),
      ...(filters['lectureId'] != null && { lectureId: filters['lectureId'] }),
      ...structureParams,
    };

    return this.courseService.getCourses(params as any).pipe(
      map((response) => ({
        data: this.mapRows(response.data),
        pagination: response.paginate,
      })),
    );
  }

  private mapRows(data: CourseManagement[]): CourseTableRow[] {
    return data.map((item) => ({
      id: item.id,
      subjectName: item.subject.displayName,
      personnelName: item.personnel.displayName,
      lectureCount: item.lectures?.length ?? 0,
      academicYearName: item.academicYear.name,
      companyName: item.company.displayName,
      campusName: item.campus.displayName,
      schoolName: item.school.displayName,
      levelName: item.level.displayName,
      className: item.class.displayName,
      status: item.status,
      creditHour: item.creditHour,
      lectures: item.lectures,
      course: item,
      hasContents: item.hasContents,
    }));
  }

  protected t(key: string): string {
    return this.translocoService.t(key);
  }
}
