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
  DsMobileItemContext,
  DsSelectionState,
} from '@ds/ds-responsive-table';
import { DsIconComponent, DsIcon } from '@ds/icon/icon.component';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsAgGridTitleSubtitleCellComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-cell.component';
import { DsAgGridTitleSubtitleHeaderComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-header.component';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { faEye, faPen, faUser, faBan } from '@fortawesome/pro-light-svg-icons';
import { faPhone } from '@fortawesome/pro-regular-svg-icons';
import { faFileExport, faPlay } from '@fortawesome/pro-solid-svg-icons';
import {
  Gender,
  UserStatus,
  UserType,
  enumArrayFromEnum,
  translatedChipOptions,
  ResourceStatus,
} from '@shared/enums';
import { IGuardianListItem } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { GuardianService } from '../../guardians/guardians.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { AuthService } from '@auth/auth.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';
import { DsSchoolStructureEntityType } from '@ds/school-structure-control/types/school-structure-control.types';
import { StructureDepth } from '@shared/utils/school-structure';
import { ChipSelectorOption } from '@ds/chip-selector/chip-selector.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { resolveSchoolStructureParams } from '../../utils/resolve-school-structure-params';
import { AccountBlockingService } from '../../students/account-blocking.service';
import { ToastrService } from 'ngx-toastr';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { filter, map, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-guardians-tab',
  standalone: true,
  imports: [
    DsResponsiveTableComponent,
    DsHeaderPrefixDirective,
    DsResponsiveMenuComponent,
    DsIconComponent,
    DsChipComponent,
    CommonModule,
  ],
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

    <!-- Custom mobile card template for guardian list -->
    <ng-template #mobileCardTemplate let-data="data">
      <div class="flex flex-col gap-ds-md">
        <!-- Header: name + menu -->
        <div class="flex items-center justify-between gap-ds-md">
          <span class="content-lg-high-emphasis min-w-0 flex-1 truncate">{{
            data.displayName
          }}</span>
          @if (getRowMenuActions(data).length > 0) {
            <ds-responsive-menu
              class="shrink-0"
              [items]="getRowMenuActions(data)"
              [triggerAriaLabel]="'Actions'"
              (itemSelected)="onMobileMenuAction($event, data)"
            />
          }
        </div>

        <!-- Badges: phone (clickable) + status -->
        <div class="flex flex-wrap gap-ds-md">
          @if (data.displayPhoneNumber) {
            <a [href]="'tel:' + data.displayPhoneNumber" class="no-underline">
              <app-ds-chip
                [text]="data.displayPhoneNumber"
                [startIcon]="phoneIcon"
                startIconColorClass="text-surface-pastel-foreground-blue"
                customClasses="bg-surface-pastel-background-blueRich border-black-8 text-surface-pastel-foreground-blue underline"
              />
            </a>
          }
          <app-ds-chip
            [text]="getStatusLabel(data.status)"
            [customClasses]="
              data.status === 'ACTIVE'
                ? 'bg-surface-pastel-background-greenRich border-black-8 text-emphasis-high'
                : 'bg-surface-pastel-background-redRich border-black-8 text-emphasis-high'
            "
          />
        </div>

        <!-- Metadata: campus + students -->
        @if (data.campusId || data.linkedStudents?.length) {
          <div
            class="flex flex-col gap-ds-lg rounded-ds-lg bg-surface-pastel-background-blue px-ds-xl py-ds-md"
          >
            @if (data.campusId) {
              <div class="flex items-center justify-between gap-ds-md">
                <span class="single-line-sm-low-emphasis text-emphasis-mid">{{
                  campusLabel
                }}</span>
                <span
                  class="content-md-high-emphasis text-end text-emphasis-high"
                  >{{ data.campusId }}</span
                >
              </div>
            }
            @for (student of data.linkedStudents; track $index) {
              <div class="flex items-center justify-between gap-ds-md">
                <span class="single-line-sm-low-emphasis text-emphasis-mid">
                  {{ studentLabel }} {{ $index + 1 }}
                </span>
                <div class="flex flex-col items-end">
                  <span
                    class="content-md-high-emphasis text-end text-emphasis-high"
                    >{{ student.name }}</span
                  >
                  @if (student.schoolName) {
                    <span
                      class="single-line-sm-low-emphasis text-end text-emphasis-mid"
                      >{{ student.schoolName }}</span
                    >
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardiansTabComponent {
  private readonly router = inject(Router);
  private readonly guardianService = inject(GuardianService);
  private readonly translocoService = inject(HesTranslateService);
  private readonly hesDatePipe = inject(HesDatePipe);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly authService = inject(AuthService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly scopeService = inject(SchoolStructureScopeService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly accountBlockingService = inject(AccountBlockingService);
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

  /** Last query params used in fetchGuardians (reused for bulk actions) */
  private lastQueryParams: Record<string, any> = {};
  private readonly mobileCardTemplate =
    viewChild<TemplateRef<DsMobileItemContext<IGuardianListItem>>>(
      'mobileCardTemplate',
    );

  readonly tabsTemplate = input<TemplateRef<unknown> | null>(null);
  readonly mobilePrimaryAction = input<{
    label: string;
    icon?: DsIcon;
    action: () => void;
  } | null>(null);
  readonly totalItemsChanged = output<number>();

  /** Phone icon for mobile badge */
  protected readonly phoneIcon = faPhone;

  /** Localized labels for mobile card */
  protected readonly campusLabel = this.translocoService.t(
    'global.campus.title',
  );
  protected readonly studentLabel = this.translocoService.t(
    'global.student.title',
  );

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
      untracked(() => this.tableRef()?.refreshFromFirstPage());
    }
  });

  // ============================================================================
  // Columns
  // ============================================================================

  private readonly columns = computed<DsResponsiveColumn<IGuardianListItem>[]>(
    () => [
      // 1. Name - National ID (pinned start, title+subtitle cell)
      {
        field: 'displayName',
        headerName: this.translocoService.t('global.name.title'),
        headerComponent: DsAgGridTitleSubtitleHeaderComponent,
        headerComponentParams: {
          title: this.translocoService.t('global.name.title'),
          subtitle: this.translocoService.t('global.national_id.title'),
        },
        cellRenderer: DsAgGridTitleSubtitleCellComponent,
        cellRendererParams: {
          titleField: 'displayName',
          subtitleFields: ['nationalId'],
        },
        pinned: 'start',
        lockPinned: true,
        sortable: true,
      },
      // Hidden national ID column for subtitle cell (not in customize columns)
      {
        field: 'nationalId',
        headerName: this.translocoService.t('global.national_id.title'),
        sortable: true,
        hide: true,
        excludeFromCustomization: true,
      },
      // 2. Linked students
      {
        field: 'student',
        headerName: this.translocoService.t('global.linked_students.title'),
      },
      // 3. Phone number
      {
        field: 'phoneNumber',
        headerName: this.translocoService.t('global.phone_number.title'),
        dsCell: { type: 'phone' },
      },
      // 4. Last active
      {
        field: 'lastActive',
        headerName: this.translocoService.t('global.last_active.txt'),
        dsCell: { type: 'date' },
      },
      // 5. Campus / School (title+subtitle cell, like Name / National ID)
      {
        field: 'campusId',
        headerName: this.translocoService.t('global.campus.title'),
        headerComponent: DsAgGridTitleSubtitleHeaderComponent,
        headerComponentParams: {
          title: this.translocoService.t('global.campus.title'),
          subtitle: this.translocoService.t('global.school.title'),
        },
        cellRenderer: DsAgGridTitleSubtitleCellComponent,
        cellRendererParams: {
          titleField: 'campusId',
          subtitleFields: ['schoolId'],
        },
      },
      // Hidden schoolId for campus/school subtitle cell (not in customize columns)
      {
        field: 'schoolId',
        headerName: this.translocoService.t('global.school.title'),
        hide: true,
        excludeFromCustomization: true,
      },
      // 6. Nationality — hidden + excluded from customization
      // (backend does not return nationality data for guardians)
      {
        field: 'nationality' as any,
        headerName: this.translocoService.t('global.nationality.title'),
        hide: true,
        excludeFromCustomization: true,
      },
      // 7. Status (hidden by default)
      {
        field: 'status',
        headerName: this.translocoService.t('global.status.title'),
        hide: true,
        dsCell: {
          type: 'badge',
          badge: {
            variantMap: {
              [ResourceStatus.ACTIVE]: 'success',
              [ResourceStatus.INACTIVE]: 'danger',
            },
            labelFn: (value: unknown) =>
              value === ResourceStatus.INACTIVE
                ? this.translocoService.t('deactivation_deactivated.txt')
                : this.translocoService.enumT(value as string),
          },
        },
      },
      // 8. Gender (hidden)
      {
        field: 'gender',
        headerName: this.translocoService.t('global.gender.title'),
        sortable: true,
        hide: true,
        valueFormatter: ({ data }) =>
          data ? this.translocoService.t('enum.' + data.gender) : '',
      },
      // 9. Company (hidden)
      {
        field: 'companyId',
        headerName: this.translocoService.t('global.company.title'),
        hide: true,
      },
      // 10. Academic year (hidden)
      {
        field: 'academicYearId',
        headerName: this.translocoService.t('global.academic_year.title'),
        hide: true,
      },
      // 11. Last update (sort-only, hidden — default sort)
      {
        field: 'updatedAt' as any,
        headerName: this.translocoService.t('global.last_update.title'),
        dsCell: { type: 'date' },
        sortable: true,
        sort: 'desc' as const,
        hide: true,
        excludeFromCustomization: true,
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
    const statusOptions: ChipSelectorOption[] = [
      {
        value: ResourceStatus.ACTIVE,
        displayedValue: this.translocoService.enumT(ResourceStatus.ACTIVE),
      },
      {
        value: ResourceStatus.INACTIVE,
        displayedValue: this.translocoService.t('deactivation_deactivated.txt'),
      },
    ];
    const classStatusOptions: ChipSelectorOption[] = enumArrayFromEnum(
      ResourceStatus,
    ).map((status) => ({
      value: status as string | number,
      displayedValue: this.translocoService.enumT(status as string),
    }));

    const filters: DsFilterConfig[] = [
      {
        type: 'search' as const,
        key: 'searchText',
        label: this.translocoService.t('global.search.title'),
        placeholder: this.translocoService.t('global.search.title'),
        exposed: true,
      },
    ];

    // Only show school-structure filter when user has multiple schools
    if (this.scopeService.schoolsList().length > 1) {
      filters.push({
        type: 'school-structure' as const,
        key: 'schoolStructure',
        label: this.translocoService.t('global.school.title'),
        placeholder: this.translocoService.t('global.school.title'),
        isMultiSelect: false,
        depth: StructureDepth.SCHOOL,
        allowedSelections: [
          'company',
          'campus',
          'school',
        ] as DsSchoolStructureEntityType[],
      });
    }

    filters.push(
      {
        type: 'chip-selector' as const,
        key: 'gender',
        label: this.translocoService.t('global.gender.title'),
        options: genderOptions,
      },
      {
        type: 'chip-selector' as const,
        key: 'status',
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
    );

    return filters;
  });

  // ============================================================================
  // Bulk Actions
  // ============================================================================

  private readonly bulkActions = computed(() => {
    const hasBulkPermission = this.rbacService.hasPermission(
      RESOURCE_PERMISSION.guardians.bulkStatusUpdate,
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

  readonly config = computed<DsResponsiveTableConfig<IGuardianListItem>>(
    () => ({
      columns: this.columns(),
      dataSource: (request) => this.fetchGuardians(request),
      filters: this.filters(),
      initialFilters: this.scopeFilters(),
      rowActions: [
        {
          id: 'view',
          label: this.translocoService.t('global.view.btn'),
          icon: faEye,
          action: (row) =>
            this.router.navigate(['/user-management/guardians', row.id]),
          visible: (row) =>
            this.rbacService.hasPermission(
              RESOURCE_PERMISSION.guardians.viewGuardianProfile,
            ) || this.rbacService.isCurrentUser(row.userId),
        },
        {
          id: 'edit',
          label: this.translocoService.t('global.edit.btn'),
          icon: faPen,
          action: (row) =>
            this.router.navigate([
              '/user-management/guardians',
              row.id,
              'update',
            ]),
          visible: (row) =>
            this.rbacService.hasPermission(
              RESOURCE_PERMISSION.guardians.updateGuardainsProfile,
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
              UserType.GUARDIAN,
            ),
          visible: (row) => {
            if (row.status !== ResourceStatus.ACTIVE) return false;
            const isSameUser =
              this.authService.user()?.type === UserType.GUARDIAN &&
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
          id: 'deactivate',
          label: this.translocoService.t('global.de_activate.btn'),
          icon: faBan,
          action: (row) => this.onDeactivateGuardian(row.id),
          visible: (row) =>
            row.status !== ResourceStatus.INACTIVE &&
            this.rbacService.hasPermission(
              RESOURCE_PERMISSION.guardians.deactivateActivateProfile,
            ),
        },
        {
          id: 'activate',
          label: this.translocoService.t('global.activate_account.btn'),
          icon: faBan,
          action: (row) => this.onActivateGuardian(row.id),
          visible: (row) =>
            row.status === ResourceStatus.INACTIVE &&
            this.rbacService.hasPermission(
              RESOURCE_PERMISSION.guardians.deactivateActivateProfile,
            ),
        },
      ],
      emptyState: {
        title: this.translocoService.t('global.no_existing_found.title', {
          roleName: this.translocoService.t('global.guardians.title'),
        }),
        description: this.translocoService.t(
          'global.no_existing_found.description',
        ),
      },
      mobile: {
        itemTemplate: this.mobileCardTemplate(),
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
              entityLabel: this.translocoService.t('global.guardians.title'),
            },
          }
        : {}),
      table: { rowClickable: true },
      persistState: 'guardians-tab',
    }),
  );

  // ============================================================================
  // DataSource
  // ============================================================================

  private fetchGuardians(request: DsDataSourceRequest) {
    const params: Record<string, any> = {
      pageNumber: request.page,
      itemsPerPage: request.perPage,
    };

    if (request.sort) {
      params['sortByColumn'] = request.sort.field;
      params['order'] = request.sort.direction;
    } else {
      // Default sort by last update (most recent first)
      params['sortByColumn'] = 'updatedAt';
      params['order'] = 'desc';
    }

    // Map filters to API params
    const { filters } = request;

    if (filters['searchText']) {
      params['searchText'] = filters['searchText'];
    }
    if (filters['gender']) {
      params['gender'] = filters['gender'];
    }
    if (filters['status']) {
      params['userStatus'] = filters['status'];
    }
    if (filters['academicYearId']) {
      params['academicYearId'] = filters['academicYearId'];
    }
    if (filters['studentClassStatus']) {
      params['studentClassStatus'] = filters['studentClassStatus'];
    }
    // Resolve school structure filter with full ancestor hierarchy
    const schoolStructure = filters['schoolStructure'];
    if (Array.isArray(schoolStructure) && schoolStructure.length > 0) {
      for (const selection of schoolStructure) {
        const sel = selection as { id: number; type: string };
        const resolved = resolveSchoolStructureParams(
          this.scopeService.userScopedSchoolStructure(),
          sel.id,
          sel.type,
        );
        Object.assign(params, resolved);
      }
    }

    this.lastQueryParams = params;

    return this.guardianService.getGuardiansList(params).pipe(
      map((resp) => {
        const data = this.guardianService.mapGuardiansToGuardianListItems(
          resp.data,
        );
        const pagination = resp.paginate;
        this.totalItemsChanged.emit(pagination?.totalItems ?? 0);
        return { data, pagination };
      }),
    );
  }

  // ============================================================================
  // Mobile Card Helpers
  // ============================================================================

  /** Compute filtered menu actions for a given row */
  protected getRowMenuActions(row: IGuardianListItem): PopupItem[] {
    return (this.config().rowActions ?? [])
      .filter((action) => {
        if (typeof action.visible === 'function') return action.visible(row);
        return action.visible !== false;
      })
      .map((action) => ({
        id: action.id,
        title: action.label,
        icon: action.icon,
        disabled:
          typeof action.disabled === 'function'
            ? action.disabled(row)
            : action.disabled,
      }));
  }

  /** Handle menu action click from mobile card */
  protected onMobileMenuAction(item: PopupItem, row: IGuardianListItem): void {
    const action = (this.config().rowActions ?? []).find(
      (a) => a.id === item.id,
    );
    action?.action?.(row);
  }

  /** Get localized status label */
  protected getStatusLabel(status: ResourceStatus): string {
    return status === ResourceStatus.INACTIVE
      ? this.translocoService.t('deactivation_deactivated.txt')
      : this.translocoService.enumT(status as string);
  }

  // ============================================================================
  // Action Handlers
  // ============================================================================

  private onDeactivateGuardian(id: ObjId): void {
    this.guardianService.onDeactivateGuardian(() =>
      this.deactivateGuardian(id),
    );
  }

  private deactivateGuardian(id: ObjId): void {
    this.guardianService.deactivateGuardian(String(id)).subscribe({
      next: () => {
        this.tableRef()?.refresh();
      },
    });
  }

  private onActivateGuardian(id: ObjId): void {
    this.guardianService.onActivateGuardian(() => this.activateGuardian(id));
  }

  private activateGuardian(id: ObjId): void {
    this.guardianService.activateGuardian(String(id)).subscribe({
      next: () => {
        this.tableRef()?.refresh();
      },
    });
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  onSelectionChanged(rows: IGuardianListItem[]): void {
    // Available for parent to listen to if needed
  }

  onSelectionStateChanged(state: DsSelectionState): void {
    this.selectionState.set(state);
  }

  onBulkAction(event: DsBulkActionEvent<IGuardianListItem>): void {
    switch (event.action.id) {
      case 'activate':
        this.onBulkActivate();
        break;
      case 'deactivate':
        this.onBulkDeactivate();
        break;
      case 'export':
        this.onBulkExport();
        break;
    }
  }

  onRowClicked(row: IGuardianListItem): void {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.guardians.viewGuardianProfile,
      ) ||
      this.rbacService.isCurrentUser(row.userId)
    ) {
      this.router.navigate(['/user-management/guardians', row.id]);
    }
  }

  onSortChanged(event: DsSortChangeEvent): void {
    // Sorting is handled internally by dataSource
  }

  // ============================================================================
  // Bulk Action Helpers
  // ============================================================================

  private buildBulkSelectionBody(): {
    guardianIds?: number[];
    excludeGuardianIds?: number[];
  } {
    const state = this.selectionState();
    if (state.mode === 'all') {
      return state.excludedIds.length > 0
        ? { excludeGuardianIds: state.excludedIds.map(Number) }
        : {};
    }
    if (state.mode === 'some') {
      return { guardianIds: state.selectedIds.map(Number) };
    }
    return {};
  }

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
        this.guardianService
          .bulkUpdateGuardianStatus(this.getBulkQueryParams(), {
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

  private async onBulkDeactivate(): Promise<void> {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.t(
          'global.bulk_deactivate_accounts.title',
        ),
        modalMessage: this.translocoService.t(
          'user_management.bulk_deactivate_accounts_alert.txt',
        ),
        primaryBtnStr: this.translocoService.t('global.yes_deactivate.btn'),
        secondaryBtnStr: this.translocoService.t('global.no_cancel.btn'),
      },
      () => {
        this.bulkLoadingAction.set('deactivate');
        this.guardianService
          .bulkUpdateGuardianStatus(this.getBulkQueryParams(), {
            ...this.buildBulkSelectionBody(),
            status: 'INACTIVE',
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
    );
  }

  /** Maps frontend column field names to backend API field names for CSV export */
  private readonly exportFieldMap: Record<string, string | null> = {
    displayName: 'fullName',
    nationalId: 'nationalId',
    student: 'students',
    phoneNumber: 'phoneNumber',
    lastActive: 'userEvent',
    campusId: 'campus',
    schoolId: 'school',
    nationality: null, // not supported by guardian export API
    status: 'status',
    gender: 'gender',
    companyId: 'company',
    academicYearId: 'academicYear',
    updatedAt: 'updatedAt',
  };

  /**
   * Maps each visible column field to additional fields that should always
   * be exported alongside it (e.g. subtitle fields shown in the same column).
   */
  private readonly exportCompanionFields: Record<string, string[]> = {
    fullName: ['nationalId'],
    campus: ['school'],
  };

  private onBulkExport(): void {
    this.bulkLoadingAction.set('export');
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

    this.guardianService
      .exportGuardiansCsv(this.getBulkQueryParams(), {
        ...this.buildBulkSelectionBody(),
        fieldsToExtract: visibleFields,
      })
      .subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            const a = document.createElement('a');
            a.href = response.data;
            a.download = `guardians-export-${Date.now()}.csv`;
            a.click();
          }
          this.resetBulkState();
        },
        error: () => this.bulkLoadingAction.set(null),
      });
  }
}
