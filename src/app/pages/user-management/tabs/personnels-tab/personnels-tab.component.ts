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
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsAgGridTitleSubtitleCellComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-cell.component';
import { DsAgGridTitleSubtitleHeaderComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-header.component';
import { faEye, faPen, faUser, faBan } from '@fortawesome/pro-light-svg-icons';
import { faPhone } from '@fortawesome/pro-regular-svg-icons';
import { faFileExport, faPlay } from '@fortawesome/pro-solid-svg-icons';
import {
  Gender,
  UserStatus,
  UserType,
  translatedChipOptions,
  ResourceStatus,
} from '@shared/enums';
import { Personnel } from '@shared/dto-transformation/user-managment/personnel/personnel.interface';
import { ObjId } from '@shared/interfaces/common.interface';
import { PersonnelService } from '../../personnels/personnel.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
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
import { DsModalService } from '@ds/modal/modal.service';
import { NationalitiesApiService } from '@core/api-services/nationalities-api/nationalities.api-service';
import { RoleApiService } from '@core/api-services/role-api/role.api-service';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { PersonnelStatusService } from '../../personnels/utils/personnel-status.service';
import { AccountBlockingService } from '../../students/account-blocking.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { resolveSchoolStructureParams } from '../../utils/resolve-school-structure-params';
import { ToastrService } from 'ngx-toastr';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { formatDateToUnix } from '@shared/utils/date';
import { getUnixTime } from 'date-fns';

@Component({
  selector: 'app-personnels-tab',
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

    <!-- Custom mobile card template for personnel list -->
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

        <!-- Badges: role(s) + phone -->
        <div class="flex flex-wrap gap-ds-md">
          @for (role of data.roles; track role.id) {
            <app-ds-chip
              [text]="role.displayName"
              customClasses="bg-surface-pastel-background-purpleRich border-black-8 text-emphasis-high"
            />
          }
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
        </div>

        <!-- Metadata -->
        @if (
          data.nationalId ||
          data.dateOfBirth ||
          data.campuses?.length ||
          data.schools?.length
        ) {
          <div
            class="flex flex-col gap-ds-lg rounded-ds-lg bg-surface-pastel-background-blue px-ds-xl py-ds-md"
          >
            @if (data.nationalId) {
              <div class="flex items-center justify-between gap-ds-md">
                <span class="single-line-sm-low-emphasis text-emphasis-mid">{{
                  nationalIdLabel
                }}</span>
                <span
                  class="content-md-high-emphasis text-end text-emphasis-high"
                  >{{ data.nationalId }}</span
                >
              </div>
            }
            @if (data.dateOfBirth) {
              <div class="flex items-center justify-between gap-ds-md">
                <span class="single-line-sm-low-emphasis text-emphasis-mid">{{
                  birthDateLabel
                }}</span>
                <span
                  class="content-md-high-emphasis text-end text-emphasis-high"
                  >{{ hesDatePipe.transform(data.dateOfBirth) }}</span
                >
              </div>
            }
            @for (campus of data.campuses; track campus.id) {
              <div class="flex items-center justify-between gap-ds-md">
                <span class="single-line-sm-low-emphasis text-emphasis-mid">{{
                  campusLabel
                }}</span>
                <div class="flex flex-col items-end">
                  <span
                    class="content-md-high-emphasis text-end text-emphasis-high"
                    >{{ campus.displayName }}</span
                  >
                  @if (getSchoolsForCampus(data, campus.id); as schools) {
                    <span
                      class="single-line-sm-low-emphasis text-end text-emphasis-mid"
                      >{{ schools }}</span
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
export class PersonnelsTabComponent {
  private readonly router = inject(Router);
  private readonly personnelService = inject(PersonnelService);
  private readonly translocoService = inject(HesTranslateService);
  protected readonly hesDatePipe = inject(HesDatePipe);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly authService = inject(AuthService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly scopeService = inject(SchoolStructureScopeService);
  private readonly layoutService = inject(LayoutService);
  private readonly modalService = inject(DsModalService);
  private readonly nationalitiesApiService = inject(NationalitiesApiService);
  private readonly roleApiService = inject(RoleApiService);
  private readonly personnelStatusService = inject(PersonnelStatusService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly accountBlockingService = inject(AccountBlockingService);
  private readonly toastr = inject(ToastrService);
  private readonly hesToastr = inject(HesToasterService);

  /** Current cross-page selection state */
  private readonly selectionState = signal<DsSelectionState>({
    mode: 'none',
    selectedIds: [],
    excludedIds: [],
  });

  /** Tracks which bulk action is currently loading */
  private readonly bulkLoadingAction = signal<string | null>(null);

  /** Last query params used in fetchData (reused for bulk actions) */
  private lastQueryParams: Record<string, any> = {};

  /** Refresh table when personnel status changes (activate/deactivate) */
  private readonly refreshOnStatusChange =
    this.personnelStatusService.actionComplete$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.tableRef()?.refresh());

  /** Populate nationalities for the filter dropdown */
  private readonly _populateNationalities = this.nationalitiesApiService
    .populateNationalitiesList()
    .pipe(takeUntilDestroyed())
    .subscribe();

  /** Role options for the filter dropdown */
  private readonly _roleOptions = signal<ISelectValue[]>([]);
  /** Exclude seeded Student (id:1) and Guardian (id:2) roles — they have their own tabs */
  private static readonly EXCLUDED_ROLE_IDS = [1, 2];
  private readonly _populateRoles = this.roleApiService
    .fetchRolesForDropDown()
    .pipe(takeUntilDestroyed())
    .subscribe((roles) =>
      this._roleOptions.set(
        roles.filter(
          (r) =>
            !PersonnelsTabComponent.EXCLUDED_ROLE_IDS.includes(
              r.value as number,
            ),
        ),
      ),
    );

  private readonly tableRef = viewChild(DsResponsiveTableComponent);
  private readonly mobileCardTemplate =
    viewChild<TemplateRef<DsMobileItemContext<Personnel>>>(
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

  /** Localized labels for mobile card metadata */
  protected readonly nationalIdLabel = this.translocoService.t(
    'global.national_id.title',
  );
  protected readonly birthDateLabel = this.translocoService.t(
    'global.date_of_birth.title',
  );
  protected readonly campusLabel = this.translocoService.t(
    'global.campus.title',
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

  private readonly columns = computed<DsResponsiveColumn<Personnel>[]>(() => [
    // 1. Name - Role (pinned start, title+subtitle cell)
    {
      field: 'displayName',
      headerName: this.translocoService.t('global.name.title'),
      headerComponent: DsAgGridTitleSubtitleHeaderComponent,
      headerComponentParams: {
        title: this.translocoService.t('global.name.title'),
        subtitle: this.translocoService.t('global.roles.title'),
      },
      cellRenderer: DsAgGridTitleSubtitleCellComponent,
      cellRendererParams: {
        titleField: 'displayName',
        subtitleGetter: (data: Personnel) => data?.displayRoleNames?.() || '-',
      },
      pinned: 'start',
      lockPinned: true,
      lockVisible: true,
      sortable: true,
      mobile: { slot: 'title' },
    },
    // 2. Campus / School (title+subtitle cell)
    {
      field: 'campuses',
      headerName: this.translocoService.t('global.campus.title'),
      headerComponent: DsAgGridTitleSubtitleHeaderComponent,
      headerComponentParams: {
        title: this.translocoService.t('global.campus.title'),
        subtitle: this.translocoService.t('global.school.title'),
      },
      cellRenderer: DsAgGridTitleSubtitleCellComponent,
      cellRendererParams: {
        subtitleGetter: (data: Personnel) => {
          const schools = data?.schools || [];
          return schools.map((s) => s.displayName).join(', ') || '';
        },
      },
      valueGetter: (params: any) => {
        const campuses = params.data?.campuses || [];
        return campuses.map((c: any) => c.displayName).join(', ') || '-';
      },
      mobile: { slot: 'metadata', order: 5 },
    },
    // Hidden school column for campus/school subtitle cell (not in customize columns)
    {
      field: 'schools' as any,
      headerName: this.translocoService.t('global.school.title'),
      valueGetter: (params: any) => {
        const schools = params.data?.schools || [];
        return schools.map((s: any) => s.displayName).join(', ') || '-';
      },
      hide: true,
      excludeFromCustomization: true,
    },
    // 4. Phone number
    {
      field: 'displayPhoneNumber',
      headerName: this.translocoService.t('global.phone_number.title'),
      sortable: true,
      dsCell: { type: 'phone' },
      mobile: { slot: 'metadata', order: 2 },
    },
    // 5. Email
    {
      field: 'email',
      headerName: this.translocoService.t('global.email.title'),
      mobile: { slot: 'metadata', order: 3 },
    },
    // 6. Employee ID
    {
      field: 'employeeIdentifier',
      headerName: this.translocoService.t('global.employee_id.label'),
      mobile: { slot: 'metadata', order: 4 },
    },
    // 7. National ID
    {
      field: 'nationalId',
      headerName: this.translocoService.t('global.national_id.title'),
      sortable: true,
      mobile: { slot: 'metadata', order: 1 },
    },
    // 8. Nationality
    {
      field: 'nationality',
      headerName: this.translocoService.t('global.nationality.title'),
      valueGetter: (params) => params.data?.nationality?.displayName || '',
      mobile: { slot: 'metadata', order: 6 },
    },
    // 9. Start date
    {
      field: 'startDate',
      headerName: this.translocoService.t('global.start_date.title'),
      dsCell: { type: 'date' },
      mobile: { hideOnMobile: true },
    },
    // 10. Last active
    {
      field: 'lastUserEvent',
      headerName: this.translocoService.t('global.last_active.txt'),
      valueGetter: (params) => params.data?.lastUserEvent?.createdAt ?? null,
      dsCell: { type: 'duration' },
      mobile: { hideOnMobile: true },
    },
    // 11. Last update (sort-only, hidden)
    {
      field: 'updatedAt',
      headerName: this.translocoService.t('global.last_update.title'),
      dsCell: { type: 'date' },
      sortable: true,
      sort: 'desc' as const,
      hide: true,
      excludeFromCustomization: true,
      mobile: { hideOnMobile: true },
    },
    // 12. Last created (sort-only, hidden)
    {
      field: 'createdAt',
      headerName: this.translocoService.t('global.last_created.title'),
      dsCell: { type: 'date' },
      sortable: true,
      hide: true,
      excludeFromCustomization: true,
      mobile: { hideOnMobile: true },
    },
    // === Hidden columns (available via Customize Columns) ===
    // 13. Gender
    {
      field: 'gender',
      headerName: this.translocoService.t('global.gender.title'),
      sortable: true,
      valueGetter: (params) =>
        params.data?.gender
          ? this.translocoService.enumT(params.data.gender)
          : '',
      hide: true,
      mobile: { hideOnMobile: true },
    },
    // 12. Date of birth
    {
      field: 'dateOfBirth',
      headerName: this.translocoService.t('global.date_of_birth.title'),
      dsCell: { type: 'date' },
      hide: true,
      mobile: { hideOnMobile: true },
    },
    // 13. Status
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
      hide: true,
      mobile: { hideOnMobile: true },
    },
    // 14. Role
    {
      field: 'roles',
      headerName: this.translocoService.t('global.roles.title'),
      valueGetter: (params) => params.data?.displayRoleNames() || '',
      hide: true,
      excludeFromCustomization: true,
      mobile: { slot: 'metadata', order: 7 },
    },
    // 15. Company
    {
      field: 'companies',
      headerName: this.translocoService.t('global.company.title'),
      valueGetter: (params) => {
        const companies = params.data?.companies || [];
        return companies.map((c: any) => c.displayName).join(', ');
      },
      hide: true,
      mobile: { hideOnMobile: true },
    },
    // 16. Passport number
    {
      field: 'passportNumber',
      headerName: this.translocoService.t('global.passport_num.title'),
      hide: true,
      mobile: { hideOnMobile: true },
    },
    // 17. Passport expiry date
    {
      field: 'passportExpiryDate',
      headerName: this.translocoService.t('global.passport_expiry_date.title'),
      dsCell: { type: 'date' },
      hide: true,
      mobile: { hideOnMobile: true },
    },
  ]);

  // ============================================================================
  // Row Actions - defined inline in config
  // ============================================================================

  // ============================================================================
  // Bulk Actions
  // ============================================================================

  private readonly bulkActions = computed(() => {
    const hasBulkPermission = this.rbacService.hasPermission(
      RESOURCE_PERMISSION.personnel.bulkStatusUpdate,
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
  // Filters
  // ============================================================================

  private readonly filters = computed<DsFilterConfig[]>(() => {
    const genderOptions: ChipSelectorOption[] = translatedChipOptions(
      Gender,
      this.translocoService.enumT.bind(this.translocoService),
    );
    const statusOptions: ChipSelectorOption[] = [
      {
        value: UserStatus.ACTIVE,
        displayedValue: this.translocoService.enumT(UserStatus.ACTIVE),
      },
      {
        value: UserStatus.INACTIVE,
        displayedValue: this.translocoService.t('deactivation_deactivated.txt'),
      },
    ];

    const filtersList: DsFilterConfig[] = [
      {
        type: 'search' as const,
        key: 'searchText',
        label: this.translocoService.t('global.search.title'),
        placeholder: this.translocoService.t('global.search.title'),
        exposed: true,
      } as DsFilterConfig,
    ];

    // School structure filter — only show for multi-school users
    if (this.scopeService.schoolsList().length > 1) {
      filtersList.push({
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

    filtersList.push(
      {
        type: 'chip-selector' as const,
        key: 'status',
        label: this.translocoService.t('global.status.title'),
        options: statusOptions,
      },
      {
        type: 'chip-selector' as const,
        key: 'gender',
        label: this.translocoService.t('global.gender.title'),
        options: genderOptions,
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
        key: 'startDate',
        label: this.translocoService.t('global.start_date.title'),
        placeholder: this.translocoService.t('global.start_date.title'),
      },
      {
        type: 'date-range' as const,
        key: 'dateOfBirth',
        label: this.translocoService.t('global.date_of_birth.title'),
        placeholder: this.translocoService.t('global.date_of_birth.title'),
      },
      {
        type: 'select' as const,
        key: 'roleId',
        label: this.translocoService.t('global.roles.title'),
        config: {
          placeholder: this.translocoService.t('global.roles.title'),
          options: this._roleOptions().map((r) => ({
            id: r.value,
            display: r.displayedValue,
          })),
        },
      },
    );

    return filtersList;
  });

  // ============================================================================
  // Selection State
  // ============================================================================

  private readonly selectedRows = signal<Personnel[]>([]);
  private readonly allRowsSelected = signal<boolean>(false);

  // ============================================================================
  // Table Configuration
  // ============================================================================

  readonly config = computed<DsResponsiveTableConfig<Personnel>>(() => ({
    columns: this.columns(),
    dataSource: (request) => this.fetchData(request),
    filters: this.filters(),
    initialFilters: this.scopeFilters(),
    rowActions: [
      {
        id: 'view',
        label: this.translocoService.t('global.view.btn'),
        icon: faEye,
        action: (row) =>
          this.router.navigate(['/user-management/personnels', row.id]),
        visible: (row) =>
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.viewPersonnelProfile,
          ) || this.rbacService.isCurrentUser(row.userId),
      },
      {
        id: 'edit',
        label: this.translocoService.t('global.edit.btn'),
        icon: faPen,
        action: (row) =>
          this.router.navigate([
            '/user-management/personnels',
            row.id,
            'update',
          ]),
        visible: (row) =>
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.editPersonnelProfile,
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
            UserType.PERSONNEL,
          ),
        visible: (row) => {
          if (row.status !== UserStatus.ACTIVE) return false;
          const isSameUser =
            this.authService.user()?.type === UserType.PERSONNEL &&
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
        action: (row) => this.deactivatePersonnel(row),
        visible: (row) =>
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.decativateActivateProfile,
          ) && row.status !== UserStatus.INACTIVE,
      },
      {
        id: 'activate',
        label: this.translocoService.t('global.activate_account.btn'),
        icon: faBan,
        action: (row) => this.activatePersonnel(row),
        visible: (row) =>
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.decativateActivateProfile,
          ) && row.status !== UserStatus.ACTIVE,
      },
    ],
    bulkActions: this.bulkActions(),
    ...(this.bulkActions().length
      ? {
          selection: {
            mode: 'multiple' as const,
            entityLabel: 'Personnel',
          },
        }
      : {}),
    emptyState: {
      title: this.translocoService.t('global.no_existing_found.title', {
        roleName: this.translocoService.t('global.personnels.title'),
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
    table: {
      rowClickable: true,
      autoSizeStrategy: {
        type: 'fitCellContents',
      },
      defaultColDef: {
        minWidth: 160,
      },
    },
    persistState: 'personnels-tab',
  }));

  // ============================================================================
  // Data Fetching
  // ============================================================================

  private fetchData(req: DsDataSourceRequest) {
    const params: any = {
      pageNumber: req.page,
      itemsPerPage: req.perPage,
    };

    // Sorting — map display field names to backend-accepted column names
    const sortFieldMap: Record<string, string> = {
      displayPhoneNumber: 'phoneNumber',
    };
    if (req.sort) {
      params.sortByColumn = sortFieldMap[req.sort.field] ?? req.sort.field;
      params.order = req.sort.direction;
    } else {
      // Default sort by last update (most recent first)
      params.sortByColumn = 'updatedAt';
      params.order = 'desc';
    }

    // Filters
    const filters = req.filters ?? {};

    if (filters['searchText']) {
      params.searchText = filters['searchText'];
    }
    if (filters['gender']) {
      params.gender = filters['gender'];
    }
    if (filters['status']) {
      params.userStatus = filters['status'];
    }
    if (filters['nationalityIds']) {
      const ids = filters['nationalityIds'];
      const joined = Array.isArray(ids) ? ids.join(',') : String(ids);
      if (joined) params.nationalityIds = joined;
    }
    if (filters['startDate']) {
      const d = filters['startDate'] as any;
      if (d.from) params.startDateFrom = getUnixTime(new Date(d.from));
      if (d.to) params.startDateTo = getUnixTime(new Date(d.to));
    }
    if (filters['dateOfBirth']) {
      const d = filters['dateOfBirth'] as any;
      if (d.from) params.dateOfBirthFrom = getUnixTime(new Date(d.from));
      if (d.to) params.dateOfBirthTo = getUnixTime(new Date(d.to));
    }
    if (filters['roleId']) {
      params.roleId = filters['roleId'];
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

    return this.personnelService.fetchPersonnels(params).pipe(
      map((response) => {
        // Emit total count for parent tab counter
        if (response.paginate?.totalItems !== undefined) {
          this.totalItemsChanged.emit(response.paginate.totalItems);
        }
        // Return full pagination object so DsResponsiveTableComponent can handle
        // both desktop pagination and mobile infinite-scroll termination correctly.
        return {
          data: response.data,
          pagination: response.paginate,
        };
      }),
    );
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  onSelectionChanged(rows: Personnel[]): void {
    this.selectedRows.set(rows);
  }

  onSelectionStateChanged(state: DsSelectionState): void {
    this.selectionState.set(state);
  }

  onSortChanged(event: DsSortChangeEvent): void {
    // Sorting is handled by the dataSource
  }

  onRowClicked(row: Personnel): void {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.personnel.viewPersonnelProfile,
      ) ||
      this.rbacService.isCurrentUser(row.userId)
    ) {
      this.router.navigate(['/user-management/personnels', row.id]);
    }
  }

  onBulkAction(event: DsBulkActionEvent<Personnel>): void {
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

  // ============================================================================
  // Bulk Action Helpers
  // ============================================================================

  private buildBulkSelectionBody(): {
    personnelIds?: number[];
    excludePersonnelIds?: number[];
  } {
    const state = this.selectionState();
    if (state.mode === 'all') {
      return state.excludedIds.length > 0
        ? { excludePersonnelIds: state.excludedIds.map(Number) }
        : {};
    }
    if (state.mode === 'some') {
      return { personnelIds: state.selectedIds.map(Number) };
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
        this.personnelService
          .bulkUpdatePersonnelStatus(this.getBulkQueryParams(), {
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
        this.personnelService
          .bulkUpdatePersonnelStatus(this.getBulkQueryParams(), {
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
  private readonly exportFieldMap: Record<string, string> = {
    displayName: 'fullName',
    campuses: 'campus',
    schools: 'school',
    displayPhoneNumber: 'phoneNumber',
    email: 'email',
    employeeIdentifier: 'employeeIdentifier',
    nationalId: 'nationalId',
    nationality: 'nationality',
    startDate: 'startDate',
    lastUserEvent: 'userEvent',
    updatedAt: 'updatedAt',
    createdAt: 'createdAt',
    gender: 'gender',
    dateOfBirth: 'dateOfBirth',
    status: 'status',
    roles: 'role',
    companies: 'company',
    passportNumber: 'passportNumber',
    passportExpiryDate: 'passportExpiryDate',
  };

  /**
   * Maps each visible column field to additional fields that should always
   * be exported alongside it (e.g. subtitle fields shown in the same column).
   */
  private readonly exportCompanionFields: Record<string, string[]> = {
    fullName: ['role'],
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

    this.personnelService
      .exportPersonnelsCsv(this.getBulkQueryParams(), {
        ...this.buildBulkSelectionBody(),
        fieldsToExtract: visibleFields,
      })
      .subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            const a = document.createElement('a');
            a.href = response.data;
            a.download = `personnels-export-${Date.now()}.csv`;
            a.click();
          }
          this.resetBulkState();
        },
        error: () => this.bulkLoadingAction.set(null),
      });
  }

  // ============================================================================
  // Mobile Card Helpers
  // ============================================================================

  /** Compute filtered menu actions for a given row */
  protected getRowMenuActions(row: Personnel): PopupItem[] {
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
  protected onMobileMenuAction(item: PopupItem, row: Personnel): void {
    const action = (this.config().rowActions ?? []).find(
      (a) => a.id === item.id,
    );
    action?.action?.(row);
  }

  /** Get comma-separated school names for a given campus */
  protected getSchoolsForCampus(data: Personnel, campusId: number): string {
    return (data.schools || [])
      .filter((s) => s.campusId === campusId)
      .map((s) => s.displayName)
      .join(', ');
  }

  // ============================================================================
  // Action Methods
  // ============================================================================

  private deactivatePersonnel(personnel: Personnel): void {
    this.personnelStatusService.onDeactivatePersonnel(personnel.id?.toString());
  }

  private activatePersonnel(personnel: Personnel): void {
    this.personnelStatusService.onActivatePersonnel(personnel.id?.toString());
  }
}
