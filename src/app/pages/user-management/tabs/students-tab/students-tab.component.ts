import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  effect,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  DsResponsiveTableComponent,
  DsHeaderPrefixDirective,
  DsResponsiveTableConfig,
  DsResponsiveColumn,
  DsBulkActionEvent,
  DsSortChangeEvent,
  DsDataSourceRequest,
  DsSelectionState,
} from '@ds/ds-responsive-table';
import { DsIcon } from '@ds/icon/icon.component';
import { DsAgGridTitleSubtitleCellComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-cell.component';
import { DsAgGridTitleSubtitleHeaderComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-header.component';
import { DsCellBadgeVariant } from '@ds/ag-grid-table/ds-ag-grid-cell-renderer.component';
import { faEye, faPen, faUser, faBan } from '@fortawesome/pro-light-svg-icons';
import { faPauseCircle } from '@fortawesome/pro-regular-svg-icons';
import { faFileExport, faPlay } from '@fortawesome/pro-solid-svg-icons';
import {
  Gender,
  UserStatus,
  UserType,
  enumArrayFromEnum,
  translatedChipOptions,
  ResourceStatus,
} from '@shared/enums';
import { IStudentListItem } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { StudentsService } from '../../students/students.service';
import { AccountBlockingService } from '../../students/account-blocking.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { mapStudentsToStudentListItems } from '@shared/services/students-listing.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { AuthService } from '@auth/auth.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { LayoutService } from '@layout/layout.service';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';
import { DsSchoolStructureEntityType } from '@ds/school-structure-control/types/school-structure-control.types';
import { StructureDepth } from '@shared/utils/school-structure';
import { ChipSelectorOption } from '@ds/chip-selector/chip-selector.component';
import { filter, map, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NationalitiesApiService } from '@core/api-services/nationalities-api/nationalities.api-service';
import { FeedbackService } from '@shared/services/feedback.service';
import { formatDateToUnix } from '@shared/utils/date';
import { resolveSchoolStructureParams } from '../../utils/resolve-school-structure-params';
import { getUnixTime } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { HesToasterService } from '@shared/services/hes-toaster.service';

@Component({
  selector: 'app-students-tab',
  standalone: true,
  imports: [DsResponsiveTableComponent, DsHeaderPrefixDirective, CommonModule],
  providers: [HesDatePipe],
  template: `
    <ds-responsive-table
      class="min-h-0 w-full flex-1"
      [config]="config()"
      (selectionChanged)="onSelectionChanged($event)"
      (selectionStateChanged)="onSelectionStateChanged($event)"
      (bulkActionClick)="onBulkAction($event)"
      (rowClicked)="onRowClicked($event)"
      (sortChanged)="onSortChanged($event)"
    >
      @if (tabsTemplate()) {
        <ng-template dsHeaderPrefix>
          <ng-container *ngTemplateOutlet="tabsTemplate()" />
        </ng-template>
      }
    </ds-responsive-table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsTabComponent {
  private readonly router = inject(Router);
  private readonly studentService = inject(StudentsService);
  private readonly accountBlockingService = inject(AccountBlockingService);
  private readonly translocoService = inject(HesTranslateService);
  private readonly hesDatePipe = inject(HesDatePipe);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly authService = inject(AuthService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly scopeService = inject(SchoolStructureScopeService);
  private readonly layoutService = inject(LayoutService);
  private readonly nationalitiesApiService = inject(NationalitiesApiService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly toastr = inject(ToastrService);
  private readonly hesToastr = inject(HesToasterService);

  private readonly tableRef = viewChild(DsResponsiveTableComponent);

  /** Current cross-page selection state */
  private readonly selectionState = signal<DsSelectionState>({
    mode: 'none',
    selectedIds: [],
    excludedIds: [],
  });

  /** Tracks which bulk action is currently loading */
  private readonly bulkLoadingAction = signal<string | null>(null);

  /** Last query params used in fetchStudents (reused for bulk actions) */
  private lastQueryParams: Record<string, any> = {};

  /** Populate nationalities for the filter dropdown */
  private readonly _populateNationalities = this.nationalitiesApiService
    .populateNationalitiesList()
    .pipe(takeUntilDestroyed())
    .subscribe();

  readonly tabsTemplate = input<TemplateRef<unknown> | null>(null);
  readonly mobilePrimaryAction = input<{
    label: string;
    icon?: DsIcon;
    action: () => void;
  } | null>(null);
  readonly totalItemsChanged = output<number>();

  // ============================================================================
  // Scope-based filters (sidebar school structure + academic year)
  // ============================================================================

  private readonly scopeFilters = computed<DsFiltersValue>(() => {
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

  /** Combined scope signal for change detection */
  private readonly scopeState = computed(() => ({
    scopeItem: this.scopeService.selectedSchoolStructureItem(),
    academicYear: this.academicYearScope.selectedAcademicYear(),
  }));

  /** Update table scope filters only when the sidebar selection actually changes.
   *  skip(1) ensures the initial mount does NOT fire — the stored localStorage
   *  state is restored as-is by seedInitialFiltersEffect. */
  private readonly scopeChangeSub = toObservable(this.scopeState)
    .pipe(skip(1), takeUntilDestroyed())
    .subscribe(({ scopeItem, academicYear }) => {
      const table = this.tableRef();
      if (!table) return;
      const updates: DsFiltersValue = {};
      updates['schoolStructure'] = scopeItem
        ? ([
            { id: scopeItem.id, type: scopeItem.type, name: scopeItem.name },
          ] as any)
        : undefined;
      updates['academicYearId'] = academicYear?.id;
      table.updateFilters(updates);
    });

  /** Parent triggers refresh via ionViewWillEnter */
  refreshTrigger = input(0);
  private readonly refreshEffect = effect(() => {
    const trigger = this.refreshTrigger();
    if (trigger > 0) {
      // Read tableRef inside untracked so this effect only re-runs
      // when refreshTrigger changes, not when the viewChild updates.
      untracked(() => this.tableRef()?.refreshFromFirstPage());
    }
  });

  // ============================================================================
  // Columns
  // ============================================================================

  private readonly columns = computed<DsResponsiveColumn<IStudentListItem>[]>(
    () => [
      // 1. Name - Level/Class (pinned start, title+subtitle cell)
      {
        field: 'displayName',
        headerName: this.translocoService.t('global.name.title'),
        headerComponent: DsAgGridTitleSubtitleHeaderComponent,
        headerComponentParams: {
          title: this.translocoService.t('global.name.title'),
          subtitle:
            this.translocoService.t('global.level.title') +
            ' - ' +
            this.translocoService.t('global.class.title'),
        },
        cellRenderer: DsAgGridTitleSubtitleCellComponent,
        cellRendererParams: {
          titleField: 'displayName',
          subtitleFields: ['levelName', 'className'],
          subtitleSeparator: ' - ',
        },
        pinned: 'start',
        lockPinned: true,
        sortable: true,
        mobile: { slot: 'title' },
      },
      // Hidden level/class columns for subtitle cell (not in customize columns)
      // On mobile, shown as badge chips: level (blue), class (pink/red-rich)
      {
        field: 'levelName',
        headerName: this.translocoService.t('global.level.title'),
        hide: true,
        excludeFromCustomization: true,
        mobile: { slot: 'badge', order: 0, badgeVariant: 'info' },
      },
      {
        field: 'className',
        headerName: this.translocoService.t('global.class.title'),
        hide: true,
        excludeFromCustomization: true,
        mobile: { slot: 'badge', order: 0, badgeVariant: 'default' },
      },
      // 2. National ID
      {
        field: 'nationalId',
        headerName: this.translocoService.t('global.national_id.title'),
        sortable: true,
        mobile: { slot: 'metadata', order: 1 },
      },
      // 3. Student ID
      {
        field: 'id',
        headerName: this.translocoService.t('global.student_id.title'),
        sortable: true,
        mobile: { slot: 'metadata', order: 2 },
      },
      // 4. Status (badge cell)
      {
        field: 'status',
        headerName: this.translocoService.t('global.status.title'),
        dsCell: {
          type: 'badge',
          badge: {
            variantMap: {
              [UserStatus.ACTIVE]: 'success',
              [UserStatus.INACTIVE]: 'danger',
              [UserStatus.PAUSED]: 'warning',
            },
            labelFn: (value: unknown) =>
              value === UserStatus.INACTIVE
                ? this.translocoService.t('deactivation_deactivated.txt')
                : this.translocoService.enumT(value as string),
          },
        },
      },
      // 5. Linked guardians - hidden on mobile by default
      {
        field: 'guardian',
        headerName: this.translocoService.t('global.linked_guardians.title'),
      },
      // 6. Nationality - hidden on mobile by default
      {
        field: 'nationalityName',
        headerName: this.translocoService.t('global.nationality.title'),
      },
      // 7. Last active - hidden on mobile by default
      {
        field: 'lastActive',
        headerName: this.translocoService.t('global.last_active.txt'),
        dsCell: { type: 'duration' },
      },
      // 8. Phone number - hidden on mobile by default
      {
        field: 'phoneNumber',
        headerName: this.translocoService.t('global.phone_number.title'),
        sortable: true,
        dsCell: { type: 'phone' },
      },
      // 9. Campus / School (title+subtitle cell)
      {
        field: 'campusName',
        headerName: this.translocoService.t('global.campus.title'),
        headerComponent: DsAgGridTitleSubtitleHeaderComponent,
        headerComponentParams: {
          title: this.translocoService.t('global.campus.title'),
          subtitle: this.translocoService.t('global.school.title'),
        },
        cellRenderer: DsAgGridTitleSubtitleCellComponent,
        cellRendererParams: {
          titleField: 'campusName',
          subtitleFields: ['schoolName'],
        },
      },
      // Hidden schoolName for campus/school subtitle cell (not in customize columns)
      {
        field: 'schoolName',
        headerName: this.translocoService.t('global.school.title'),
        hide: true,
        excludeFromCustomization: true,
      },
      // 10. Date of birth - hidden on mobile by default
      {
        field: 'dateOfBirth',
        headerName: this.translocoService.t('global.date_of_birth.title'),
        dsCell: { type: 'date' },
      },
      // 11. Updated at (default sort: most recent first) - hidden on mobile by default
      {
        field: 'updatedAt',
        headerName: this.translocoService.t('global.updated_at.title'),
        sortable: true,
        sort: 'desc' as const,
        dsCell: { type: 'duration' },
      },
      // 12. Created at (sort-only, hidden)
      {
        field: 'createdAt',
        headerName: this.translocoService.t('global.last_created.title'),
        sortable: true,
        hide: true,
        excludeFromCustomization: true,
        dsCell: { type: 'date' },
      },
      // === Hidden columns (available via Customize Columns) ===
      // 13. Gender
      {
        field: 'gender',
        headerName: this.translocoService.t('global.gender.title'),
        sortable: true,
        hide: true,
        valueFormatter: ({ data }) =>
          data ? this.translocoService.t('enum.' + data.gender) : '',
      },
      // 13. Registration date
      {
        field: 'registrationDate',
        headerName: this.translocoService.t('global.registration_date.title'),
        hide: true,
        dsCell: { type: 'date' },
      },
      // 14. Student class status
      {
        field: 'studentClassStatus',
        headerName: this.translocoService.t(
          'global.student_class.status.title',
        ),
        hide: true,
        dsCell: {
          type: 'badge',
          badge: {
            variantMap: {
              ACTIVE: 'success',
              INACTIVE: 'danger',
            } as unknown as Record<string, DsCellBadgeVariant>,
            labelFn: (value: unknown) =>
              this.translocoService.enumT(value as string),
          },
        },
      },
      // 15. Company
      {
        field: 'companyName',
        headerName: this.translocoService.t('global.company.title'),
        hide: true,
      },
      // 16. Passport number
      {
        field: 'passportNumber',
        headerName: this.translocoService.t('global.passport_num.title'),
        hide: true,
      },
      // 17. Passport expiry date
      {
        field: 'passportExpiryDate',
        headerName: this.translocoService.t(
          'global.passport_expiry_date.title',
        ),
        hide: true,
        dsCell: { type: 'date' },
      },
      // 18. Academic year
      {
        field: 'academicYearName',
        headerName: this.translocoService.t('global.academic_year.title'),
        hide: true,
        valueFormatter: ({ data }) => data?.academicYearName ?? '-',
      },
      // 19. Pioneers ID
      {
        field: 'pioneerId',
        headerName: this.translocoService.t('global.pioneers_id.title'),
        hide: true,
      },
    ],
  );

  // ============================================================================
  // Filters
  // ============================================================================

  private readonly filters = computed<DsFilterConfig[]>(() => {
    const genderOptions: ChipSelectorOption[] = translatedChipOptions(
      Gender,
      this.translocoService.enumT.bind(this.translocoService),
    );
    const statusOptions: ChipSelectorOption[] = enumArrayFromEnum(
      UserStatus,
    ).map((status) => ({
      value: status as string,
      displayedValue:
        status === 'INACTIVE'
          ? this.translocoService.t('deactivation_deactivated.txt')
          : this.translocoService.enumT(status as string),
    }));
    const classStatusOptions: ChipSelectorOption[] = enumArrayFromEnum(
      ResourceStatus,
    ).map((status) => ({
      value: status as string | number,
      displayedValue: this.translocoService.enumT(status as string),
    }));

    return [
      {
        type: 'search' as const,
        key: 'searchText',
        label: this.translocoService.t('global.search.title'),
        placeholder: this.translocoService.t('global.search.title'),
        exposed: true,
      },
      {
        type: 'school-structure' as const,
        key: 'schoolStructure',
        label: this.translocoService.t('global.school.title'),
        placeholder: this.translocoService.t('global.school.title'),
        isMultiSelect: false,
        useLevelId: true,
        depth: StructureDepth.CLASS,
        allowedSelections: [
          'company',
          'campus',
          'school',
          'level',
          'class',
        ] as DsSchoolStructureEntityType[],
      },
      {
        type: 'chip-selector' as const,
        key: 'gender',
        label: this.translocoService.t('global.gender.title'),
        options: genderOptions,
      },
      {
        type: 'chip-selector' as const,
        key: 'userStatus',
        label: this.translocoService.t('global.status.title'),
        options: statusOptions,
      },
      {
        type: 'chip-selector' as const,
        key: 'studentClassStatus',
        label: this.translocoService.t('global.student_class.status.title'),
        options: classStatusOptions,
      },
      {
        type: 'chip-selector' as const,
        key: 'academicYearId',
        label: this.translocoService.t('global.academic_year.title'),
        options: this.academicYearScope.academicYears().map((item) => ({
          value: item.id,
          displayedValue: item.name,
        })),
      },
      {
        type: 'select' as const,
        key: 'nationalityIds',
        label: this.translocoService.t('global.nationality.title'),
        config: {
          placeholder: this.translocoService.t('global.nationality.title'),
          isMultiple: true,
          options: this.nationalitiesApiService
            .nationalitiesList()
            .map((n) => ({
              id: n.value,
              display: n.displayedValue,
            })),
        },
      },
      {
        type: 'date-range' as const,
        key: 'dateOfBirth',
        label: this.translocoService.t('global.date_of_birth.title'),
        placeholder: this.translocoService.t('global.date_of_birth.title'),
      },
      {
        type: 'date-range' as const,
        key: 'passportExpiryDate',
        label: this.translocoService.t('global.passport_expiry_date.title'),
        placeholder: this.translocoService.t(
          'global.passport_expiry_date.title',
        ),
      },
      {
        type: 'date-range' as const,
        key: 'registrationDate',
        label: this.translocoService.t('global.registration_date.title'),
        placeholder: this.translocoService.t('global.registration_date.title'),
      },
    ];
  });

  // ============================================================================
  // Bulk Actions
  // ============================================================================

  private readonly bulkActions = computed(() => {
    const hasBulkPermission = this.rbacService.hasPermission(
      RESOURCE_PERMISSION.student.bulkStatusUpdate,
    );
    if (!hasBulkPermission) return [];

    const loadingId = this.bulkLoadingAction();
    return [
      {
        id: 'activate',
        label: this.translocoService.t('global.activate_account.btn'),
        icon: faPlay,
        loading: loadingId === 'activate',
      },
      {
        id: 'deactivate',
        label: this.translocoService.t('global.de_activate.btn'),
        icon: faBan,
        loading: loadingId === 'deactivate',
      },
      {
        id: 'pause',
        label: this.translocoService.t(
          'deactivation_paused_user.pause_account.title',
        ),
        icon: faPauseCircle,
        loading: loadingId === 'pause',
      },
      {
        id: 'export',
        label: this.translocoService.t('global.export.txt'),
        icon: faFileExport,
        loading: loadingId === 'export',
      },
    ];
  });

  // ============================================================================
  // Config
  // ============================================================================

  readonly config = computed<DsResponsiveTableConfig<IStudentListItem>>(() => ({
    columns: this.columns(),
    dataSource: (request) => this.fetchStudents(request),
    filters: this.filters(),
    initialFilters: this.scopeFilters(),
    rowActions: [
      {
        id: 'view',
        label: this.translocoService.t('global.view.btn'),
        icon: faEye,
        action: (row) =>
          this.router.navigate(['/user-management/students', row.id]),
        visible: (row) =>
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.viewStudentProfile,
          ) || this.rbacService.isCurrentUser(row.userId),
      },
      {
        id: 'edit',
        label: this.translocoService.t('global.edit.btn'),
        icon: faPen,
        action: (row) =>
          this.router.navigate(['/user-management/students', row.id, 'update']),
        visible: (row) =>
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.editStudentProfile,
          ) || this.rbacService.isCurrentUser(row.userId),
      },
      {
        id: 'login-as',
        label: this.translocoService.t('global.login_user.btn'),
        icon: faUser,
        action: (row) =>
          this.authService.displayLoginConfirmationDialog(
            row.userId,
            row.id,
            UserType.STUDENT,
          ),
        visible: (row) => {
          if (row.status !== UserStatus.ACTIVE) return false;
          const isSameUser =
            this.authService.user()?.type === UserType.STUDENT &&
            this.authService.user()?.userTypeId === row.id;
          return (
            !this.authService.isLoggedInAsOtherUser() &&
            !isSameUser &&
            this.rbacService.hasPermission(
              RESOURCE_PERMISSION.LOGIN.LOGIN_AS_USER,
            )
          );
        },
      },
      {
        id: 'pause',
        label: this.translocoService.t(
          'deactivation_paused_user.pause_account.title',
        ),
        icon: faPauseCircle,
        action: (row) => this.onPauseStudentAccount(row.id, row.displayName),
        visible: (row) =>
          row.status === UserStatus.ACTIVE &&
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.deactivateActivateProfile,
          ),
      },
      {
        id: 'resume',
        label: this.translocoService.t(
          'deactivation_paused_user.resume_account_msg.title',
        ),
        icon: faPauseCircle,
        action: (row) => this.onResumeStudentAccount(row.id),
        visible: (row) =>
          row.status === UserStatus.PAUSED &&
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.deactivateActivateProfile,
          ),
      },
      {
        id: 'deactivate',
        label: this.translocoService.t('global.de_activate.btn'),
        icon: faBan,
        action: (row) => this.onDeactivateStudent(row.id, row.displayName),
        visible: (row) =>
          row.status !== UserStatus.INACTIVE &&
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.deactivateActivateProfile,
          ),
      },
      {
        id: 'activate',
        label: this.translocoService.t('global.activate_account.btn'),
        icon: faBan,
        action: (row) => this.onActivateStudent(row.id),
        visible: (row) =>
          row.status === UserStatus.INACTIVE &&
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.deactivateActivateProfile,
          ),
      },
    ],
    emptyState: {
      title: this.translocoService.t('global.no_existing_found.title', {
        roleName: this.translocoService.t('global.students.title'),
      }),
      description: this.translocoService.t(
        'global.no_existing_found.description',
      ),
    },
    mobile: {
      showSortButton: true,
      ...(this.mobilePrimaryAction()
        ? { primaryAction: this.mobilePrimaryAction()! }
        : {}),
    },
    bulkActions: this.bulkActions(),
    ...(this.bulkActions().length
      ? {
          selection: {
            mode: 'multiple' as const,
            entityLabel: this.translocoService.t('global.students.title'),
          },
        }
      : {}),
    table: {
      rowClickable: true,
      autoSizeStrategy: {
        type: 'fitCellContents',
      },
      defaultColDef: {
        minWidth: 160,
      },
    },
    persistState: 'students-tab',
  }));

  // ============================================================================
  // DataSource
  // ============================================================================

  /**
   * Builds API query params from a DsDataSourceRequest.
   * Shared between fetchStudents and bulk operations.
   */

  private buildQueryParams(request: DsDataSourceRequest): Record<string, any> {
    const params: Record<string, any> = {
      pageNumber: request.page,
      itemsPerPage: request.perPage,
    };

    if (request.sort) {
      params['sortByColumn'] = request.sort.field;
      params['order'] = request.sort.direction;
    } else {
      params['sortByColumn'] = 'updatedAt';
      params['order'] = 'desc';
    }

    const { filters } = request;

    if (filters['searchText']) {
      params['searchText'] = filters['searchText'];
    }
    if (filters['gender']) {
      params['gender'] = filters['gender'];
    }
    if (filters['userStatus']) {
      params['userStatus'] = filters['userStatus'];
    }
    if (filters['studentClassStatus']) {
      params['studentClassStatus'] = filters['studentClassStatus'];
    }
    if (filters['academicYearId']) {
      params['academicYearId'] = filters['academicYearId'];
    }
    if (filters['dateOfBirth']) {
      const d = filters['dateOfBirth'] as any;
      if (d.from) params['dateOfBirthFrom'] = getUnixTime(new Date(d.from));
      if (d.to) params['dateOfBirthTo'] = getUnixTime(new Date(d.to));
    }
    if (filters['passportExpiryDate']) {
      const d = filters['passportExpiryDate'] as any;
      if (d.from)
        params['passportExpiryDateFrom'] = getUnixTime(new Date(d.from));
      if (d.to) params['passportExpiryDateTo'] = getUnixTime(new Date(d.to));
    }
    if (filters['registrationDate']) {
      const d = filters['registrationDate'] as any;
      if (d.from)
        params['registrationDateFrom'] = getUnixTime(new Date(d.from));
      if (d.to) params['registrationDateTo'] = getUnixTime(new Date(d.to));
    }
    if (filters['nationalityIds']) {
      const ids = filters['nationalityIds'];
      const joined = Array.isArray(ids) ? ids.join(',') : String(ids);
      if (joined) params['nationalityIds'] = joined;
    }

    const schoolStructure = filters['schoolStructure'];
    if (Array.isArray(schoolStructure) && schoolStructure.length > 0) {
      for (const selection of schoolStructure) {
        const sel = selection as { id: number; type: string };
        // Resolve the selected node + all ancestor IDs from the tree
        const resolved = resolveSchoolStructureParams(
          this.scopeService.userScopedSchoolStructure(),
          sel.id,
          sel.type,
        );
        Object.assign(params, resolved);
      }
    }

    return params;
  }

  private fetchStudents(request: DsDataSourceRequest) {
    const params = this.buildQueryParams(request);
    // Store for reuse in bulk operations
    this.lastQueryParams = params;

    return this.studentService.fetchStudents(params).pipe(
      map((resp) => {
        const data = mapStudentsToStudentListItems(resp.data);
        const pagination = resp.paginate;
        this.totalItemsChanged.emit(pagination?.totalItems ?? 0);
        return { data, pagination };
      }),
    );
  }

  // ============================================================================
  // Bulk Action Handlers
  // ============================================================================

  /**
   * Builds the selection body for bulk API calls based on cross-page state.
   * - mode 'all': sends excludeStudentIds (if any)
   * - mode 'some': sends studentIds
   * - mode 'none': empty (shouldn't happen as actions require selection)
   */
  private buildBulkSelectionBody(): {
    studentIds?: number[];
    excludeStudentIds?: number[];
  } {
    const state = this.selectionState();
    if (state.mode === 'all') {
      return state.excludedIds.length > 0
        ? { excludeStudentIds: state.excludedIds.map(Number) }
        : {};
    }
    if (state.mode === 'some') {
      return { studentIds: state.selectedIds.map(Number) };
    }
    return {};
  }

  /**
   * Returns the query params for bulk operations.
   * Strips pagination params since bulk ops apply to all matching records.
   */
  private getBulkQueryParams(): Record<string, any> {
    const { pageNumber, itemsPerPage, ...rest } = this.lastQueryParams;
    return rest;
  }

  /** Resets bulk loading state and clears selection after action completes */
  private resetBulkState(): void {
    this.bulkLoadingAction.set(null);
    this.tableRef()?.clearSelection();
  }

  private async onBulkActivate(): Promise<void> {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.t(
          'global.bulk_activate_accounts.title',
        ),
        modalMessage: this.translocoService.t(
          'user_management.bulk_activate_accounts_alert.txt',
        ),
        primaryBtnStr: this.translocoService.t('global.yes_activate.btn'),
        secondaryBtnStr: this.translocoService.t('global.no_cancel.btn'),
      },
      () => {
        this.bulkLoadingAction.set('activate');
        this.studentService
          .bulkUpdateStudentStatus(this.getBulkQueryParams(), {
            ...this.buildBulkSelectionBody(),
            status: 'ACTIVE',
          })
          .subscribe({
            next: () => {
              this.toastr.success(
                '',
                this.translocoService.t(
                  'user_management.bulk_accounts_activated_successfully.txt',
                ),
              );
              this.resetBulkState();
              this.tableRef()?.refreshFromFirstPage();
            },
            error: (err) => {
              this.hesToastr.showBackendError(err);
              this.bulkLoadingAction.set(null);
            },
          });
      },
    );
  }

  private onBulkDeactivate(): void {
    this.accountBlockingService
      .openPauseOrDeactivateDialog(
        0,
        this.translocoService.t('global.students.title'),
        false, // isPause
        true, // isBulk
      )
      .subscribe({
        next: (payload) => {
          if (!payload || payload === false) return;
          this.bulkLoadingAction.set('deactivate');
          this.studentService
            .bulkUpdateStudentStatus(this.getBulkQueryParams(), {
              ...this.buildBulkSelectionBody(),
              status: 'INACTIVE',
              reason: payload.reason,
            })
            .subscribe({
              next: () => {
                this.toastr.success(
                  '',
                  this.translocoService.t(
                    'user_management.bulk_accounts_deactivated_successfully.txt',
                  ),
                );
                this.resetBulkState();
                this.tableRef()?.refreshFromFirstPage();
              },
              error: (err) => {
                this.hesToastr.showBackendError(err);
                this.bulkLoadingAction.set(null);
              },
            });
        },
      });
  }

  private onBulkPause(): void {
    // Open pause dialog in bulk mode — returns form payload without calling API
    this.accountBlockingService
      .openPauseOrDeactivateDialog(
        0,
        this.translocoService.t('global.students.title'),
        true,
        true, // isBulk
      )
      .subscribe({
        next: (payload) => {
          if (!payload || payload === false) return;
          this.bulkLoadingAction.set('pause');
          // payload = { status, startTime, endTime, reason }
          this.studentService
            .bulkUpdateStudentStatus(this.getBulkQueryParams(), {
              ...this.buildBulkSelectionBody(),
              status: payload.status,
              reason: payload.reason,
              startTime: payload.startTime,
              endTime: payload.endTime,
            })
            .subscribe({
              next: () => {
                this.toastr.success(
                  '',
                  this.translocoService.t(
                    'user_management.bulk_accounts_suspended_successfully.txt',
                  ),
                );
                this.resetBulkState();
                this.tableRef()?.refreshFromFirstPage();
              },
              error: (err) => {
                this.hesToastr.showBackendError(err);
                this.bulkLoadingAction.set(null);
              },
            });
        },
      });
  }

  /** Maps frontend column field names to backend API field names for CSV export */
  private readonly exportFieldMap: Record<string, string> = {
    displayName: 'fullName',
    levelName: 'level',
    className: 'class',
    nationalId: 'nationalId',
    id: 'id',
    status: 'status',
    guardian: 'guardians',
    nationalityName: 'nationality',
    lastActive: 'userEvent',
    phoneNumber: 'phoneNumber',
    campusName: 'campus',
    schoolName: 'school',
    dateOfBirth: 'dateOfBirth',
    updatedAt: 'updatedAt',
    createdAt: 'createdAt',
    gender: 'gender',
    registrationDate: 'registrationDate',
    studentClassStatus: 'studentClassStatus',
    companyName: 'company',
    passportNumber: 'passportNumber',
    passportExpiryDate: 'passportExpiryDate',
    academicYearName: 'academicYear',
    pioneerId: 'pioneerId',
  };

  /**
   * Maps each visible column field to additional fields that should always
   * be exported alongside it (e.g. subtitle fields shown in the same column).
   */
  private readonly exportCompanionFields: Record<string, string[]> = {
    fullName: ['level', 'class'],
    campus: ['school'],
  };

  private onBulkExport(): void {
    this.bulkLoadingAction.set('export');
    // Map visible column fields to backend API field names (respects user customization)
    const mappedFields = (
      this.tableRef()?.getVisibleColumnFields() ??
      this.columns()
        .filter((col) => !col.hide)
        .map((col) => col.field)
        .filter((f): f is string => !!f)
    )
      .map((f) => this.exportFieldMap[f] ?? f)
      .filter((f) => !!f);

    // Include companion fields for combined columns (e.g. school with campus)
    const visibleFields = [
      ...mappedFields,
      ...mappedFields.flatMap((f) => this.exportCompanionFields[f] ?? []),
    ].filter((f, i, arr) => arr.indexOf(f) === i); // dedupe

    this.studentService
      .exportStudentsCsv(this.getBulkQueryParams(), {
        ...this.buildBulkSelectionBody(),
        fieldsToExtract: visibleFields,
      })
      .subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            // Backend returns a signed CloudFront URL to the actual CSV file
            const a = document.createElement('a');
            a.href = response.data;
            a.download = `students-export-${Date.now()}.csv`;
            a.click();
          }
          this.resetBulkState();
        },
        error: (err) => {
          this.hesToastr.showBackendError(err);
          this.bulkLoadingAction.set(null);
        },
      });
  }

  // ============================================================================
  // Single Row Action Handlers
  // ============================================================================

  private onPauseStudentAccount(studentId: ObjId, studentName: string): void {
    this.accountBlockingService
      .openPauseOrDeactivateDialog(studentId, studentName, true)
      .subscribe({
        next: (res) => {
          if (res) this.tableRef()?.refresh();
        },
      });
  }

  private onDeactivateStudent(studentId: number, studentName: string): void {
    this.accountBlockingService
      .openPauseOrDeactivateDialog(studentId, studentName)
      .subscribe({
        next: () => {
          this.tableRef()?.refresh();
        },
      });
  }

  private onActivateStudent(id: number): void {
    this.studentService.onActivateStudent(() => this.activateStudent(id));
  }

  private activateStudent(id: ObjId): void {
    this.studentService.activateStudent(id).subscribe({
      next: () => {
        this.studentService.onActivateStudentSuccess();
        this.tableRef()?.refresh();
      },
      error: () => {
        this.studentService.onActivateStudentError(
          () => () => this.activateStudent(id),
        );
      },
    });
  }

  private onResumeStudentAccount(id: ObjId): void {
    this.layoutService.showPageSpinner();
    this.studentService.getStudent(id).subscribe({
      next: (res) => {
        if (res.statusData?.endTime) {
          this.studentService.onResumeStudent(
            this.hesDatePipe.transform(res.statusData.endTime),
            () => this.activateStudent(id),
          );
        }
      },
      complete: () => {
        this.layoutService.hidePageSpinner();
      },
    });
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  onSelectionChanged(rows: IStudentListItem[]): void {
    // Available for parent to listen to if needed
  }

  onSelectionStateChanged(state: DsSelectionState): void {
    this.selectionState.set(state);
  }

  onBulkAction(event: DsBulkActionEvent<IStudentListItem>): void {
    const { action } = event;
    switch (action.id) {
      case 'activate':
        this.onBulkActivate();
        break;
      case 'deactivate':
        this.onBulkDeactivate();
        break;
      case 'pause':
        this.onBulkPause();
        break;
      case 'export':
        this.onBulkExport();
        break;
    }
  }

  onRowClicked(row: IStudentListItem): void {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.student.viewStudentProfile,
      ) ||
      this.rbacService.isCurrentUser(row.userId)
    ) {
      this.router.navigate(['/user-management/students', row.id]);
    }
  }

  onSortChanged(event: DsSortChangeEvent): void {
    // Sorting is handled internally by dataSource
  }
}
