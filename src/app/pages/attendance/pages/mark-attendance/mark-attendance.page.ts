import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { DsModalService } from '@ds/modal/modal.service';
import { DsResponsiveMenuSheetComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AttendanceService } from '@pages/attendance/data-access/attendance.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HesAlertComponent } from '../../../../ui-kit/hes-alert/hes-alert.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import {
  AttendanceStatus,
  ClassAttendanceStatus,
  ExistingStudentsAttendance,
} from '@pages/attendance/data-access/attendance.dto';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { Observable, of, skip } from 'rxjs';
import { LayoutService } from '@layout/layout.service';
import { format, getDate, getYear, isSameDay, parseISO } from 'date-fns';
import { Language } from '@shared/enums';
import { arSA, enUS } from 'date-fns/locale';
import {
  DsResponsiveTableComponent,
  DsHeaderPrefixDirective,
  DsResponsiveTableConfig,
  DsResponsiveColumn,
  DsDataSourceRequest,
  DsDataSourceResponse,
  DsMobileFooterContext,
} from '@ds/ds-responsive-table';
import { IStudentAttendance } from '@pages/attendance/data-access/attendance.interface';
import { StudentAttendanceStatusCellComponent } from '@pages/attendance/components/student-attendance-status-cell/student-attendance-status-cell.component';
import { DsAgGridTitleSubtitleCellComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-cell.component';
import { DsAgGridTitleSubtitleHeaderComponent } from '@ds/ag-grid-table/ds-ag-grid-title-subtitle-header.component';
import { openMarkedLeaveReasonModal } from '@pages/attendance/components/marked-leave-reason-dialog/marked-leave-reason-dialog';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faChevronDown } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-mark-attendance',
  templateUrl: './mark-attendance.page.html',
  standalone: true,
  styles: [
    `
      :host ::ng-deep ds-mobile-list .ds-mobile-list-content {
        --padding-bottom: 0;
      }
      :host ::ng-deep ion-content.ds-page-content {
        --padding-bottom: 0px !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    HesAlertComponent,
    TranslocoDirective,
    DsResponsiveTableComponent,
    DsHeaderPrefixDirective,
    DsButtonComponent,
    DsIconComponent,
  ],
  providers: [],
})
export class MarkStudentsAttendanceListPage implements OnInit {
  readonly ClassAttendanceStatus = ClassAttendanceStatus;
  readonly faChevronDown = faChevronDown;
  readonly markAttendancePermissions = [RESOURCE_PERMISSION.attendance.CREATE];
  readonly updateAttendancePermissions = [
    RESOURCE_PERMISSION.attendance.UPDATE,
  ];

  private readonly attendanceService = inject(AttendanceService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  readonly destroyRef = inject(DestroyRef);
  private readonly toastrService = inject(ToastrService);
  private readonly translocoService = inject(HesTranslateService);
  private readonly router = inject(Router);
  readonly layout = inject(LayoutService);
  private readonly modalService = inject(DsModalService);

  private readonly mobileFooterTemplateRef = viewChild<
    TemplateRef<DsMobileFooterContext<IStudentAttendance>>
  >('mobileAttendanceFooter');

  private readonly responsiveTable = viewChild<
    DsResponsiveTableComponent<IStudentAttendance>
  >(DsResponsiveTableComponent);

  readonly classAttendance = computed(
    () => this.attendanceService.classAttendanceList()?.[0],
  );
  readonly classAttendanceDate = signal<{
    day: string | number;
    month: string;
    year: number;
  }>({ day: '', month: '', year: 0 });
  readonly isLoading = signal(false);

  readonly isPrimaryBtnDisabled = computed(
    () =>
      this.isLoading() ||
      this.attendanceService.studentAttendanceList().length === 0,
  );

  readonly selectedSchoolId = computed(() => {
    const item = this.schoolScopeService.selectedSchoolStructureItem();
    return item?.type === 'school' ? item.id : null;
  });

  // ── Columns ───────────────────────────────────────────────────────────────
  private readonly columns = computed<DsResponsiveColumn<IStudentAttendance>[]>(
    () => [
      {
        field: 'name',
        headerName: this.t('global.student_name.title'),
        headerComponent: DsAgGridTitleSubtitleHeaderComponent,
        headerComponentParams: {
          title: this.t('global.student_name.title'),
          subtitle: this.t('global.national_id.title'),
        },
        sortable: true,
        pinned: 'start',
        lockPinned: true,
        minWidth: 280,
        cellRenderer: DsAgGridTitleSubtitleCellComponent,
        cellRendererParams: {
          titleField: 'name',
          subtitleField: 'nationalId',
        },
        mobile: { slot: 'title' },
      },
      // Hidden on desktop — drives the mobile badge slot
      {
        field: 'nationalId',
        headerName: this.t('global.national_id.title'),
        sortable: false,
        hide: true,
        excludeFromCustomization: true,
        mobile: { slot: 'badge', badgeVariant: 'info' },
      },
      {
        field: 'attendance',
        headerName: this.t('attendance.daily_attendance.title'),
        sortable: false,
        cellRenderer: StudentAttendanceStatusCellComponent,
        fitContent: true,
        minWidth: 400,
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
        headerName: this.t('attendance.reason.title'),
        sortable: false,
        valueFormatter: (params) => (params.value as string) || '-',
        mobile: { slot: 'metadata' },
      },
    ],
  );

  // ── Table config ──────────────────────────────────────────────────────────
  readonly config = computed<DsResponsiveTableConfig<IStudentAttendance>>(
    () => ({
      columns: this.columns(),
      dataSource: (req) => this.fetchData(req),
      filters: [
        {
          type: 'search' as const,
          key: 'search',
          label: this.t('attendance.search_by_student_data.placeholder'),
          placeholder: this.t('attendance.search_by_student_data.placeholder'),
          exposed: true,
        },
      ],
      emptyState: {
        imagePath: 'assets/illustrations/no_data.svg',
        title: this.t('attendance.no_recorded_attendance.txt'),
      },
      table: {
        autoSizeStrategy: { type: 'fitGridWidth' },
      },
      mobile: {
        footerTemplate: this.mobileFooterTemplateRef() ?? undefined,
      },
      persistState: false,
    }),
  );

  constructor() {
    toObservable(this.selectedSchoolId)
      .pipe(takeUntilDestroyed(), skip(1))
      .subscribe(() => {
        this.router.navigate(['attendance', 'list']);
      });
  }

  ngOnInit(): void {
    this.setClassAttendanceDate();
  }

  setClassAttendanceDate(): void {
    const lang = this.translocoService.getActiveLang();
    const locale = lang === Language.ARABIC ? arSA : enUS;
    const dateStr = this.classAttendance()?.date;
    if (!dateStr) return;
    const date = parseISO(dateStr);
    this.classAttendanceDate.set({
      day: getDate(date),
      year: getYear(date),
      month: format(date, 'MMMM', { locale }),
    });
  }

  onPrimaryBtnClick(): void {
    this.isLoading.set(true);
    this.layout.showProgressBar();
    this.attendanceService.markAttendance(this.selectedSchoolId()!).subscribe({
      next: (data: any) => {
        if (data.messageRef && data?.data?.existingAttendance) {
          this.toastrService.warning(
            '',
            this.translocoService.translate(data.messageRef, {
              students: data.data.existingAttendance
                .map((s: ExistingStudentsAttendance) => s.studentName)
                .join(', '),
            }),
          );
        } else {
          this.toastrService.success(
            '',
            this.translocoService.translate(
              'virtual_classrooms.attendance_successfully_submitted.txt',
            ),
          );
        }
        this.router.navigate(['attendance', 'list']);
        this.layout.hideProgressBar();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastrService.error(
          '',
          err.error.messageRef
            ? this.translocoService.translate(err.error.messageRef)
            : err.error.message,
        );
        this.layout.hideProgressBar();
        this.isLoading.set(false);
      },
    });
  }

  getMobileStatusLabel(studentId: number): string {
    const status = this.attendanceService
      .studentAttendanceList()
      .find((s) => s.id === studentId)?.attendance;
    return status ? this.t('enum.' + status) : '-';
  }

  getMobileStatusClass(studentId: number): string {
    const status = this.attendanceService
      .studentAttendanceList()
      .find((s) => s.id === studentId)?.attendance;
    const base =
      'flex w-full items-center justify-center gap-1 rounded-xl border-2 border-black/[0.08] px-3 py-2 text-sm font-semibold transition-colors';
    if (status === AttendanceStatus.PRESENT)
      return `${base} bg-success-50 text-gray-900`;
    if (status === AttendanceStatus.ABSENT)
      return `${base} bg-error-50 text-gray-900`;
    if (status === AttendanceStatus.ON_LEAVE)
      return `${base} bg-[#EEF4FF] text-gray-900`;
    if (status === AttendanceStatus.EXCUSED)
      return `${base} bg-[#F0F9FF] text-gray-900`;
    if (status === AttendanceStatus.LATE_ARRIVAL)
      return `${base} bg-warning-50 text-gray-900`;
    return `${base} bg-gray-100 text-gray-600`;
  }

  async openStatusSheet(student: IStudentAttendance): Promise<void> {
    const isMarkingAllowed = this.attendanceService.isMarkAttendanceAllowed();
    const currentStudent = this.attendanceService
      .studentAttendanceList()
      .find((s) => s.id === student.id);
    const currentStatus = currentStudent?.attendance ?? null;
    const rowDataDate = student.date ? new Date(student.date) : new Date();
    const isToday = isSameDay(rowDataDate, new Date());

    // Same disable logic as StudentAttendanceStatusCellComponent
    let disabledMap: Record<string, boolean> = {};
    if (!isMarkingAllowed) {
      if (currentStatus === AttendanceStatus.PRESENT) {
        disabledMap = {
          [AttendanceStatus.ABSENT]: true,
          ...(isToday ? {} : { [AttendanceStatus.EXCUSED]: true }),
          [AttendanceStatus.LATE_ARRIVAL]: true,
          [AttendanceStatus.ON_LEAVE]: true,
        };
      } else if (isToday) {
        disabledMap = { [AttendanceStatus.PRESENT]: true };
      } else if (currentStatus === AttendanceStatus.ABSENT) {
        disabledMap = {
          [AttendanceStatus.PRESENT]: true,
          [AttendanceStatus.EXCUSED]: true,
          [AttendanceStatus.LATE_ARRIVAL]: true,
        };
      } else {
        disabledMap = {
          [AttendanceStatus.PRESENT]: true,
          [AttendanceStatus.ABSENT]: true,
          [AttendanceStatus.ON_LEAVE]: true,
          [AttendanceStatus.EXCUSED]: true,
          [AttendanceStatus.LATE_ARRIVAL]: true,
        };
      }
    }

    const statuses = [
      AttendanceStatus.PRESENT,
      AttendanceStatus.ABSENT,
      AttendanceStatus.ON_LEAVE,
      AttendanceStatus.EXCUSED,
      AttendanceStatus.LATE_ARRIVAL,
    ];

    const items: PopupItem[] = statuses.map((status) => ({
      id: status,
      title: this.t('enum.' + status),
      selected: currentStatus === status,
      disabled: !!disabledMap[status],
    }));

    const modalRef = await this.modalService.open({
      component: DsResponsiveMenuSheetComponent,
      componentProps: {
        items,
        closeOnSelect: true,
        onItemSelected: (item: PopupItem) => {
          const status = item.id as AttendanceStatus;
          if (status === AttendanceStatus.ON_LEAVE) {
            openMarkedLeaveReasonModal({
              reason: student.reason ?? null,
              modalService: this.modalService,
              t: (key) => this.t(key),
              onSubmit: (reason) => {
                this.attendanceService.updateStudentAttendance(
                  student.id,
                  status,
                  reason,
                );
                this.responsiveTable()?.refresh();
              },
            });
          } else {
            this.attendanceService.updateStudentAttendance(student.id, status);
            this.responsiveTable()?.refresh();
          }
        },
      },
      size: 'sm',
      contentClass: 'p-0',
      backdropDismiss: true,
      mobileHandle: true,
      mobileBreakpoints: [0, 1],
      mobileBreakpoint: 1,
    });

    await modalRef.onDismiss();
  }

  private fetchData(
    req: DsDataSourceRequest,
  ): Observable<DsDataSourceResponse<IStudentAttendance>> {
    const allData = this.attendanceService.studentAttendanceList();
    const searchTerm = ((req.filters['search'] as string) ?? '')
      .toLowerCase()
      .trim();
    let result = searchTerm
      ? allData.filter(
          (s) =>
            s.name.toLowerCase().includes(searchTerm) ||
            s.nationalId.toLowerCase().includes(searchTerm),
        )
      : [...allData];

    // Client-side sort
    if (req.sort?.field) {
      const field = req.sort.field as keyof IStudentAttendance;
      const dir = req.sort.direction === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const va = (a[field] as string) ?? '';
        const vb = (b[field] as string) ?? '';
        return va.localeCompare(vb) * dir;
      });
    }

    return of({ data: result });
  }

  private t(key: string): string {
    return this.translocoService.t(key);
  }
}
