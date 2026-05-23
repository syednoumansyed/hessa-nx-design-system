import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, ModalController } from '@ionic/angular/standalone';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { map, Observable, of } from 'rxjs';
import { format } from 'date-fns';
import { AttendanceService } from '@pages/attendance/data-access/attendance.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { LayoutService } from '@layout/layout.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import {
  AttendanceStatus,
  ConfirmationStatus,
} from '@pages/attendance/data-access/attendance.dto';
import { IClassAttendanceAbsence } from '@pages/attendance/data-access/attendance.interface';
import {
  DsResponsiveTableComponent,
  DsResponsiveTableConfig,
  DsResponsiveColumn,
  DsDataSourceRequest,
  DsDataSourceResponse,
  DsBulkActionEvent,
  DsMobileFooterContext,
} from '@ds/ds-responsive-table';
import { DsAgGridTitleSubtitleCellComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-cell.component';
import { AttendanceCellComponent } from '@pages/attendance/components/attendance-cell/attendance-cell.component';
import { DsFilterConfig } from '@ds/filter-panel/ds-filter-panel.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { finalize } from 'rxjs';
import { openAttendanceHistoryModal } from '@pages/attendance/components/attendance-history-dialog/attendance-history-dialog';

@Component({
  selector: 'app-confirm-absence',
  templateUrl: './confirm-absence.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    IonContent,
    DsTranslatePipe,
    NoSelectedScopeCardComponent,
    DsResponsiveTableComponent,
    FaIconComponent,
  ],
  providers: [SchoolStructureListingService],
})
export class ConfirmAbsencePage {
  readonly requiredScopes: HesScope[] = ['school'];

  private readonly attendanceService = inject(AttendanceService);
  private readonly scopeService = inject(SchoolStructureScopeService);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly translocoService = inject(HesTranslateService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly toastrService = inject(HesToasterService);
  private readonly layout = inject(LayoutService);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  protected readonly displayContent = signal(false);
  private readonly totalStudents = signal(0);
  private readonly selectableCount = signal(0);
  private readonly selectedLevelId = signal<number | null>(null);
  private readonly tableRef = viewChild(DsResponsiveTableComponent);
  private readonly mobileFooter =
    viewChild<TemplateRef<DsMobileFooterContext<IClassAttendanceAbsence>>>(
      'mobileFooter',
    );
  private readonly modalCtrl = inject(ModalController);
  protected readonly faCircleInfo = faCircleInfo;

  // Re-fetch when school scope changes — reset filters so stale IDs don't persist
  private readonly _scopeEffect = effect(() => {
    this.scopeService.selectedSchoolId();
    untracked(() => {
      const table = this.tableRef();
      if (!table) return;
      this.selectedLevelId.set(null);
      table.updateFilters({ levelId: null, classId: null, attendance: null });
      table.refreshFromFirstPage();
    });
  });

  // ── Columns ───────────────────────────────────────────────────────────────
  private readonly columns = computed<
    DsResponsiveColumn<IClassAttendanceAbsence>[]
  >(() => [
    {
      field: 'fullName',
      headerName: this.t('global.student_name.title'),
      headerComponentParams: {
        title: this.t('global.student_name.title'),
        subtitle:
          this.t('global.level.title') + ' - ' + this.t('global.class.title'),
      },
      cellRenderer: DsAgGridTitleSubtitleCellComponent,
      cellRendererParams: {
        titleField: 'fullName',
        subtitleFields: ['level', 'class'],
        subtitleSeparator: ' - ',
      },
      sortable: false,
      pinned: 'start',
      lockPinned: true,
      minWidth: 250,
      mobile: { slot: 'title' },
    },
    {
      field: 'level',
      headerName: this.t('global.level.title'),
      hide: true,
      excludeFromCustomization: true,
      mobile: { slot: 'badge', badgeVariant: 'info' },
    },
    {
      field: 'class',
      headerName: this.t('global.class.title'),
      hide: true,
      excludeFromCustomization: true,
      mobile: { slot: 'badge', badgeVariant: 'default' },
    },
    {
      field: 'attendance',
      headerName: this.t('global.attendance.title'),
      sortable: false,
      cellRenderer: AttendanceCellComponent,
      fitContent: true,
      minWidth: 220,
      mobile: {}, // Rendered in footer template with chips + info icon
    },
    {
      field: 'guardian',
      headerName: this.t('global.guardian_name.title'),
      sortable: false,
      valueFormatter: (params) =>
        (params.value as string)?.replace(/<br>/g, ', ') || '-',
      mobile: { slot: 'metadata' },
    },
    {
      field: 'phone',
      headerName: this.t('global.phone_number.title'),
      sortable: false,
      dsCell: { type: 'phone' },
      valueFormatter: (params) =>
        (params.value as string)?.replace(/<br>/g, ', ') || '-',
      mobile: { slot: 'metadata' },
    },
    {
      field: 'status',
      headerName: this.t('attendance.confirmation_status.title'),
      sortable: false,
      dsCell: {
        type: 'badge',
        badge: {
          variantMap: {
            [ConfirmationStatus.CONFIRMED]: 'success',
            [ConfirmationStatus.PENDING]: 'warning',
          },
          labelFn: (value) => this.t('enum.' + value),
        },
      },
      mobile: {
        slot: 'badge',
        badgeVariant: (value) => {
          if (value === ConfirmationStatus.CONFIRMED) return 'success';
          return 'warning';
        },
      },
    },
    {
      field: 'type',
      headerName: this.t('global.type.title'),
      sortable: false,
      valueFormatter: (params) => {
        const v = params.value as string | null | undefined;
        return v ? this.t('enum.' + v) : '-';
      },
      mobile: { slot: 'metadata' },
    },
  ]);

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

  private readonly attendanceStatusOptions = computed(() =>
    Object.values(AttendanceStatus)
      .filter((s) => s !== AttendanceStatus.PRESENT)
      .map((s) => ({
        value: s,
        displayedValue: this.t('enum.' + s),
      })),
  );

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
      key: 'attendance',
      label: this.t('global.status.title'),
      options: this.attendanceStatusOptions(),
      multiple: false,
    },
  ]);

  // ── Table config ──────────────────────────────────────────────────────────
  readonly config = computed<DsResponsiveTableConfig<IClassAttendanceAbsence>>(
    () => ({
      columns: this.columns(),
      dataSource: (req) => this.fetchData(req),
      filters: this.filters(),
      initialFilters: { date: new Date() },
      emptyState: {
        imagePath: 'assets/illustrations/no_data.svg',
        title: this.scopeService.selectedSchoolId()
          ? this.t('global.no_data.txt')
          : this.t('attendance.no_recorded_attendance.txt'),
      },
      bulkActions: [
        {
          id: 'confirm',
          label: this.t('global.confirm.btn'),
          icon: faCheck,
          activeLabel: this.t('global.confirm.btn'),
          disabled: this.selectableCount() === 0,
          disabledReason:
            this.selectableCount() === 0
              ? this.totalStudents() === 0
                ? this.t('attendance.no_records_to_confirm.txt')
                : this.t('attendance.all_records_confirmed.txt')
              : undefined,
        },
      ],
      selection: {
        entityLabel: '',
        selectionLabel: this.t('attendance.select_from_students.txt', {
          total: this.totalStudents(),
        }),
        isRowSelectable: (row) => row.status !== ConfirmationStatus.CONFIRMED,
      },
      table: {
        autoSizeStrategy: { type: 'fitGridWidth' },
        showPagination: false,
      },
      mobile: {
        showSortButton: false,
        footerTemplate: this.mobileFooter() ?? undefined,
      },
      persistState: false,
    }),
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  ionViewWillEnter() {
    this.tableRef()?.refresh();
  }

  onBulkActionClick(event: DsBulkActionEvent<IClassAttendanceAbsence>) {
    if (event.action.id === 'confirm' && event.rows.length > 0) {
      this.showConfirmationModal(event.rows);
    }
  }

  // ── Data fetching ─────────────────────────────────────────────────────────
  private fetchData(
    req: DsDataSourceRequest,
  ): Observable<DsDataSourceResponse<IClassAttendanceAbsence>> {
    const schoolId = this.scopeService.selectedSchoolId();
    if (!schoolId) return of({ data: [] });

    const dateValue = req.filters['date'];
    const date =
      dateValue instanceof Date
        ? format(dateValue, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');

    const levelId = req.filters['levelId'] as number | null | undefined;
    const classId = req.filters['classId'] as number | null | undefined;
    const attendance = req.filters['attendance'] as string | null | undefined;

    return this.attendanceService
      .getConfirmAttendanceList({
        schoolId,
        date,
        academicYearId:
          this.academicYearScopeService.selectedAcademicYear()?.id,
        ...(levelId && { levelId }),
        ...(classId && { classId }),
      })
      .pipe(
        map(() => {
          let data = this.attendanceService.absenceAttendanceList();
          // Apply client-side attendance status filter
          if (attendance) {
            data = data.filter(
              (item) =>
                item.attendance.toLowerCase() === attendance.toLowerCase(),
            );
          }
          this.totalStudents.set(data.length);
          this.selectableCount.set(
            data.filter((row) => row.status !== ConfirmationStatus.CONFIRMED)
              .length,
          );
          return { data };
        }),
      );
  }

  // ── Confirm flow ──────────────────────────────────────────────────────────
  private showConfirmationModal(rows: IClassAttendanceAbsence[]) {
    const ids = rows.map((s) => s.id);

    this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: this.translocoService.t('global.are_you_sure.title'),
        modalMessage: this.translocoService.t('attendance.confirm_absence.txt'),
        primaryBtnStr: this.translocoService.t('attendance.send_sms.btn'),
        secondaryBtnStr: this.translocoService.t(
          'attendance.confirm_without_sms.btn',
        ),
        stackButtons: true,
      },
      () => this.onConfirmAbsent(ids, true),
      () => this.onConfirmAbsent(ids, false),
    );
  }

  private onConfirmAbsent(ids: number[], notify: boolean) {
    this.layout.showProgressBar();

    this.attendanceService
      .markAbsent(ids, notify)
      .pipe(
        finalize(() => {
          this.layout.hideProgressBar();
        }),
      )
      .subscribe({
        next: () => {
          this.toastrService.success(
            '',
            this.translocoService.t(
              notify
                ? 'attendance.sms_successfully_sent.txt'
                : 'attendance.absence_successfully_confirmed.txt',
            ),
          );
          this.tableRef()?.clearSelection();
          this.tableRef()?.refresh();
        },
        error: (err) => {
          this.toastrService.showBackendError(err);
        },
      });
  }

  // ── Mobile footer helpers ───────────────────────────────────────────────
  protected getAttendanceChipClass(status: string): string {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'bg-success-50 text-success-700';
      case AttendanceStatus.ABSENT:
        return 'bg-error-50 text-error-700';
      case AttendanceStatus.EXCUSED:
        return 'bg-info-50 text-info-700';
      case AttendanceStatus.ON_LEAVE:
        return 'bg-indigo-50 text-indigo-700';
      case AttendanceStatus.LATE_ARRIVAL:
        return 'bg-warning-50 text-warning-700';
      default:
        return '';
    }
  }

  protected onViewHistory(row: IClassAttendanceAbsence): void {
    const history = row.statusHistory ?? [];
    if (history.length > 0) {
      openAttendanceHistoryModal({
        modalCtrl: this.modalCtrl,
        statusHistory: history,
        closeModal: () => this.modalCtrl.dismiss(),
      });
    }
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translocoService.t(key, params);
  }
}
