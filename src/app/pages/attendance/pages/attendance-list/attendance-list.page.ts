import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AttendanceService } from '@pages/attendance/data-access/attendance.service';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { ClassAttendanceStatus } from '@pages/attendance/data-access/attendance.dto';
import { IClassAttendance } from '@pages/attendance/data-access/attendance.interface';
import { Router } from '@angular/router';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { format, isSameDay } from 'date-fns';
import {
  DsActionButtonConfig,
  DsMobileFooterContext,
} from '@ds/ds-responsive-table';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { map, Observable, of } from 'rxjs';
import {
  DsResponsiveTableComponent,
  DsResponsiveTableConfig,
  DsResponsiveColumn,
  DsDataSourceRequest,
  DsDataSourceResponse,
} from '@ds/ds-responsive-table';
import { DsFilterConfig } from '@ds/filter-panel/ds-filter-panel.model';
import { DsButtonComponent } from '@ds/button/button.component';
import { classAttendanceListQueryParams } from '@pages/attendance/data-access/attendance.dto';

@Component({
  selector: 'app-attendance-list',
  templateUrl: './attendance-list.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    DsResponsiveTableComponent,
    TranslocoDirective,
    NoSelectedScopeCardComponent,
    DsButtonComponent,
  ],
  providers: [SchoolStructureListingService],
})
export class AttendanceListPage {
  readonly requiredScopes: HesScope[] = ['school'];

  private readonly attendanceService = inject(AttendanceService);
  private readonly scopeService = inject(SchoolStructureScopeService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly router = inject(Router);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly translocoService = inject(HesTranslateService);

  protected readonly displayContent = signal(false);

  private readonly selectedLevelId = signal<number | null>(null);

  private readonly tableRef = viewChild(DsResponsiveTableComponent);
  private readonly mobileFooterTemplateRef =
    viewChild<TemplateRef<DsMobileFooterContext<IClassAttendance>>>(
      'mobileFooter',
    );

  // Re-fetch when school scope changes — reset filters so stale IDs don't persist
  private readonly _scopeEffect = effect(() => {
    const schoolId = this.scopeService.selectedSchoolId();
    untracked(() => {
      const table = this.tableRef();
      if (!table || !schoolId) return;
      this.selectedLevelId.set(null);
      table.updateFilters({ levelId: null, classId: null, status: null });
      table.refreshFromFirstPage();
    });
  });

  // ── Columns ───────────────────────────────────────────────────────────────
  private readonly columns = computed<DsResponsiveColumn<IClassAttendance>[]>(
    () => [
      {
        field: 'class',
        headerName: this.t('global.class.label'),
        pinned: 'start',
        lockPinned: true,
        mobile: { slot: 'title' },
      },
      {
        field: 'level',
        headerName: this.t('global.level.label'),
        mobile: { slot: 'subtitle' },
      },
      {
        field: 'date',
        headerName: this.t('global.date.title'),
        valueFormatter: (params) => {
          const v = params.value as string | null | undefined;
          if (!v) return '-';
          const d = new Date(v);
          return isNaN(d.getTime()) ? v : format(d, 'dd/MM/yyyy');
        },
        mobile: { slot: 'metadata' },
      },
      {
        field: 'markedBy',
        headerName: this.t('attendance.marked_by.title'),
        valueFormatter: (params) => (params.value as string) || '-',
        mobile: { slot: 'metadata' },
      },
      {
        field: 'status',
        headerName: this.t('attendance.attendance_status.title'),
        dsCell: {
          type: 'badge',
          badge: {
            variantMap: {
              [ClassAttendanceStatus.SUBMITTED]: 'success',
              [ClassAttendanceStatus.PENDING]: 'neutral',
              [ClassAttendanceStatus.IN_PROGRESS]: 'danger',
            },
            labelFn: (value) => this.t('enum.' + value),
          },
        },
        mobile: {
          slot: 'badge',
          badgeVariant: (value) => {
            if (value === ClassAttendanceStatus.SUBMITTED) return 'success';
            if (value === ClassAttendanceStatus.PENDING) return 'neutral';
            return 'danger';
          },
        },
      },
      {
        field: 'actions',
        headerName: this.t('global.actions.title'),
        actionButtons: {
          size: 'sm',
          actions: [
            {
              label: this.t('attendance.mark_attendance.title'),
              visible: (row: IClassAttendance) =>
                row.status === ClassAttendanceStatus.PENDING &&
                this.rbacService.hasPermission(
                  RESOURCE_PERMISSION.attendance.CREATE,
                ),
              disabled: (row: IClassAttendance) =>
                !(
                  this.attendanceService.isMarkAttendanceAllowed() &&
                  isSameDay(new Date(row.date), new Date())
                ),
              action: (row: IClassAttendance) =>
                this.navigateToMarkAttendance(row),
            },
            {
              label: this.t('global.edit.btn'),
              visible: (row: IClassAttendance) =>
                row.status !== ClassAttendanceStatus.PENDING &&
                this.rbacService.hasPermission(
                  RESOURCE_PERMISSION.attendance.UPDATE,
                ),
              action: (row: IClassAttendance) =>
                this.navigateToMarkAttendance(row),
            },
            {
              label: this.t('global.view.btn'),
              visible: (row: IClassAttendance) =>
                row.status !== ClassAttendanceStatus.PENDING &&
                !this.rbacService.hasPermission(
                  RESOURCE_PERMISSION.attendance.UPDATE,
                ) &&
                this.rbacService.hasPermission(
                  RESOURCE_PERMISSION.attendance.LIST,
                ),
              action: (row: IClassAttendance) =>
                this.navigateToMarkAttendance(row),
            },
          ] satisfies DsActionButtonConfig<IClassAttendance>[],
        },
        sortable: false,
        pinned: 'end',
        lockPinned: true,
        width: 200,
        minWidth: 200,
        suppressSizeToFit: true,
      },
    ],
  );

  // ── Filter options ────────────────────────────────────────────────────────
  private readonly levelOptions = computed(() =>
    this.schoolStructureListingService.levelsList().map((l) => ({
      value: l.id,
      displayedValue: l.name,
    })),
  );

  private readonly classOptions = computed(() => {
    const levelId = this.selectedLevelId();
    if (!levelId) return [];
    const level = this.schoolStructureListingService
      .levelsList()
      .find((l) => l.id === levelId);
    return (level?.children ?? []).map((cls) => ({
      value: cls.id,
      displayedValue: cls.name,
    }));
  });

  private readonly statusOptions = computed(() => [
    {
      value: ClassAttendanceStatus.PENDING,
      displayedValue: this.t('enum.' + ClassAttendanceStatus.PENDING),
    },
    {
      value: ClassAttendanceStatus.SUBMITTED,
      displayedValue: this.t('enum.' + ClassAttendanceStatus.SUBMITTED),
    },
  ]);

  // ── Filters ───────────────────────────────────────────────────────────────
  private readonly filters = computed<DsFilterConfig[]>(() => [
    {
      type: 'date' as const,
      key: 'date',
      label: this.t('global.date.title'),
      placeholder: this.t('global.date.title'),
      exposed: true,
      defaultValue: new Date(),
    },
    {
      type: 'chip-selector' as const,
      key: 'levelId',
      label: this.t('global.level.label'),
      options: this.levelOptions(),
      multiple: false,
      onChange: (value) => this.selectedLevelId.set((value as number) ?? null),
    },
    {
      type: 'chip-selector' as const,
      key: 'classId',
      label: this.t('global.class.label'),
      options: this.classOptions(),
      multiple: false,
      hidden: !this.selectedLevelId(),
      dependsOn: 'levelId',
    },
    {
      type: 'chip-selector' as const,
      key: 'status',
      label: this.t('attendance.attendance_status.title'),
      options: this.statusOptions(),
      multiple: false,
    },
  ]);

  // ── Table config ──────────────────────────────────────────────────────────
  readonly config = computed<DsResponsiveTableConfig<IClassAttendance>>(() => ({
    columns: this.columns(),
    dataSource: (req) => this.fetchAttendance(req),
    filters: this.filters(),
    initialFilters: { date: new Date() },
    emptyState: {
      imagePath: 'assets/illustrations/no_data.svg',
      title: this.t('attendance.no_recorded_attendance.txt'),
    },
    table: {
      autoSizeStrategy: { type: 'fitGridWidth' },
    },
    mobile: {
      showSortButton: false,
      footerTemplate: this.mobileFooterTemplateRef() ?? undefined,
    },
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  ionViewWillEnter() {
    this.attendanceService.viewAttendanceActive.set(true);
    // Refresh data when returning from mark-attendance (e.g. after submitting)
    this.tableRef()?.refresh();
  }

  ionViewWillLeave() {
    this.attendanceService.viewAttendanceActive.set(false);
  }

  // ── Data fetching ─────────────────────────────────────────────────────────
  private fetchAttendance(
    req: DsDataSourceRequest,
  ): Observable<DsDataSourceResponse<IClassAttendance>> {
    const schoolId = this.scopeService.selectedSchoolId();
    if (!schoolId) return of({ data: [] });

    this.attendanceService.checkMarkAttendanceStatus();

    const dateValue = req.filters['date'];
    const date =
      dateValue instanceof Date
        ? format(dateValue, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');

    const levelId = req.filters['levelId'] as number | null | undefined;
    const classId = req.filters['classId'] as number | null | undefined;
    const status = req.filters['status'] as
      | ClassAttendanceStatus
      | null
      | undefined;

    const params: classAttendanceListQueryParams = {
      schoolId,
      date,
      pageNumber: req.page,
      itemsPerPage: req.perPage,
      ...(levelId && { levelId }),
      ...(classId && { classId }),
      ...(status && { status }),
    };

    return this.attendanceService.getClassAttendanceList(params).pipe(
      map(() => ({
        data: this.attendanceService.classAttendanceList(),
        pagination:
          this.attendanceService.classAttendancePagination() ?? undefined,
      })),
    );
  }

  getMobileActionLabel(row: IClassAttendance): string {
    if (
      row.status === ClassAttendanceStatus.PENDING &&
      this.rbacService.hasPermission(RESOURCE_PERMISSION.attendance.CREATE)
    ) {
      return this.t('attendance.mark_attendance.title');
    }
    if (
      row.status !== ClassAttendanceStatus.PENDING &&
      this.rbacService.hasPermission(RESOURCE_PERMISSION.attendance.UPDATE)
    ) {
      return this.t('global.edit.btn');
    }
    return this.t('global.view.btn');
  }

  isMobileActionVisible(row: IClassAttendance): boolean {
    return (
      (row.status === ClassAttendanceStatus.PENDING &&
        this.rbacService.hasPermission(
          RESOURCE_PERMISSION.attendance.CREATE,
        )) ||
      (row.status !== ClassAttendanceStatus.PENDING &&
        this.rbacService.hasPermission(
          RESOURCE_PERMISSION.attendance.UPDATE,
        )) ||
      (row.status !== ClassAttendanceStatus.PENDING &&
        this.rbacService.hasPermission(RESOURCE_PERMISSION.attendance.LIST))
    );
  }

  isMobileActionDisabled(row: IClassAttendance): boolean {
    if (row.status === ClassAttendanceStatus.PENDING) {
      return !(
        this.attendanceService.isMarkAttendanceAllowed() &&
        isSameDay(new Date(row.date), new Date())
      );
    }
    return false;
  }

  onMobileActionClick(row: IClassAttendance): void {
    this.navigateToMarkAttendance(row);
  }

  private navigateToMarkAttendance(row: IClassAttendance) {
    this.attendanceService.viewAttendanceActive.set(false);
    this.attendanceService.updateSelectedDate(new Date(row.date));
    this.attendanceService.updateSelectedClass(row.classId);
    this.attendanceService.updateSelectedLevel(row.levelId);
    this.router.navigate(['attendance', 'mark']);
  }

  private t(key: string): string {
    return this.translocoService.t(key);
  }
}
