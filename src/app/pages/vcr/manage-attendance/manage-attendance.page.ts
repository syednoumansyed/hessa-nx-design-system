import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { format, parseISO, isValid, parse } from 'date-fns';
import { formatWithLocale } from '@shared/utils/time-format.util';
import { IonButton, IonContent, Platform } from '@ionic/angular/standalone';
import {
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
} from 'ag-grid-community';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ManageRecordingTableItem } from '@pages/vcr/manage-recordings/manage-recordings.page';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { VcrAPIService } from '@pages/vcr/data-access/vcr.api-service';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { StudentVCRAttendanceTableItem } from '@pages/vcr/data-access/attendance.dto';
import { AttendanceLinkClickCellComponent } from '@pages/vcr/components/attendance-link-click-cell/attendance-link-click-cell.component';
import { MarkAttendanceCellComponent } from '@pages/vcr/components/mark-attendance-cell/mark-attendance-cell.component';
import { ClassAttendanceStatus } from '@pages/attendance/data-access/attendance.dto';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { Router } from '@angular/router';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { AttendanceLinkClickTimeCellComponent } from '@pages/vcr/components/attendance-link-click-time-cell/attendance-link-click-time-cell.component';
import { StudentAttendanceStatus } from '@shared/enums';
import { StudentVCRAttendance } from '../data-access/attendance.interface';

@Component({
  selector: 'app-manage-attendance',
  templateUrl: './manage-attendance.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    HesTableComponent,
    TranslocoDirective,
    IonButton,
    HessaBtnDirective,
  ],
})
export class ManageAttendancePage implements OnInit {
  protected readonly ClassAttendanceStatus = ClassAttendanceStatus;
  readonly vcrId = input<number>();
  readonly lectureId = input<number>();
  private readonly translateService = inject(HesTranslateService);
  private readonly router = inject(Router);
  private readonly vcrApiService = inject(VcrAPIService);
  private readonly platform = inject(Platform);
  private readonly toaster = inject(HesToasterService);
  isButtonDisabled = signal(true);
  isEditable = signal<boolean>(true);
  isUpdate = signal<boolean>(false);
  autoSizeStrategy = signal<
    SizeColumnsToFitGridStrategy | SizeColumnsToContentStrategy | undefined
  >({ type: 'fitGridWidth' });
  readonly startDate = computed(() => {
    if (this.rowsData().length === 0) return '';
    return this.rowsData()[0].startDate + ' ' + this.rowsData()[0].startTime;
  });
  readonly isLoading = signal<boolean>(false);
  private readonly studentAttendanceMap = signal<
    Map<number, StudentVCRAttendanceTableItem>
  >(new Map<number, StudentVCRAttendanceTableItem>());
  readonly rowsData = computed<StudentVCRAttendanceTableItem[]>(() => {
    const studentAttendanceMap = this.studentAttendanceMap();
    return Array.from(studentAttendanceMap.values());
  });
  readonly subject = computed(() => {
    if (this.rowsData().length === 0) return '';
    return this.rowsData()[0]?.subject ?? '';
  });

  readonly grade = computed(() => {
    if (this.rowsData().length === 0) return '';
    return this.rowsData()[0]?.className ?? '';
  });

  readonly colDef = computed<ITableCol<StudentVCRAttendanceTableItem>[]>(() => {
    return [
      {
        field: 'name',
        sortable: false,
        filter: false,
        headerName: this.translate('global.name.title'),
      },
      {
        field: 'className',
        sortable: false,
        filter: false,
        headerName: this.translate('global.class.title'),
      },
      {
        field: 'clickStatus',
        sortable: false,
        filter: false,
        headerName: this.translate(
          'virtual_classrooms.link_click_status.title',
        ),
        cellRenderer: AttendanceLinkClickCellComponent,
      },
      {
        field: 'clickTime',
        sortable: false,
        filter: false,
        headerName: this.translate('virtual_classrooms.click_time.title'),
        cellRenderer: AttendanceLinkClickTimeCellComponent,
      },
      {
        field: 'attendance',
        headerName: this.translate('resource.attendance'),
        sortable: false,
        filter: false,
        cellRenderer: MarkAttendanceCellComponent,
        cellRendererParams: {
          onMarkAttendance: (id: number, status: StudentAttendanceStatus) => {
            if (!this.isUpdate() || (this.isUpdate() && this.isEditable())) {
              this.studentAttendanceMap.update((map) => {
                this.isButtonDisabled.set(false);
                const row = map.get(id);
                if (row) {
                  row.attendance = status;
                  map.set(id, row);
                }
                return new Map(map);
              });
            }
          },
        },
      },
    ];
  });

  readonly actions = computed<IAction<ManageRecordingTableItem>[]>(() => {
    return [];
  });

  readonly noRowsOverlayComponentParams = signal<INoRowsOverlay>({
    imgSrc: 'assets/illustrations/no_data.svg',
    title: this.translate('global.no_data.txt'),
  });

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.queryParams) {
      this.isEditable.set(navigation.extras.queryParams['edit']);
    }
    this.platform.width() <= 1440
      ? this.autoSizeStrategy.set({ type: 'fitCellContents' })
      : this.autoSizeStrategy.set({ type: 'fitGridWidth' });
    this.fetchStudentAttendances();
  }

  fetchStudentAttendances() {
    this.isLoading.set(true);
    this.vcrApiService
      .fetchVCRAttendancesByLectureId(this.vcrId()!, this.lectureId()!)
      .subscribe({
        next: (resp) => {
          const isUpdating = resp.some(
            (item) => item.attendance?.attendanceStatus,
          );
          this.isUpdate.set(isUpdating);
          this.isButtonDisabled.set(isUpdating);
          this.mapToTableRow(resp).forEach((item) => {
            this.studentAttendanceMap.update((map) => {
              map.set(item.id, item);
              return new Map(map);
            });
          });
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toaster.error(
            this.translate('virtual_classrooms.attendance_fetch_error.txt'),
          );
          this.isLoading.set(false);
        },
      });
  }

  translate(key: string) {
    return this.translateService.t(key);
  }

  submitAttendances() {
    const data = this.rowsData()
      .filter((f) => f.attendance !== null && f.attendance !== undefined)
      .map((item) => {
        return {
          studentId: item.id,
          status: item.attendance as StudentAttendanceStatus,
        };
      });
    const payload = {
      attendanceData: data,
    };
    this.vcrApiService
      .markAttendance(this.vcrId()!, this.lectureId()!, payload)
      .subscribe(() => {
        this.toaster.success(
          this.translate(
            'virtual_classrooms.attendance_successfully_submitted.txt',
          ),
        );
        this.fetchStudentAttendances();
      });
  }

  private mapToTableRow(
    data: StudentVCRAttendance[],
  ): StudentVCRAttendanceTableItem[] {
    return data.map((item) => {
      const date = item.virtualClassroomLecture?.date;
      const formattedDate =
        date && isValid(parseISO(date))
          ? format(parseISO(date), 'dd-MM-yyyy')
          : '';
      const time = item.lecture?.startTime;
      let formattedTime = '';
      if (time) {
        formattedTime = formatWithLocale(
          parse(time, 'HH:mm', new Date()),
          'hh:mm a',
        );
      }
      let clickDate = '';
      let clickTime = '';
      if (item?.attendance?.clickTime) {
        const parsedDate = parseISO(item.attendance.clickTime);
        clickDate = format(parsedDate, 'dd-MM-yyyy');
        clickTime = formatWithLocale(parsedDate, 'hh:mm a');
      }

      return {
        id: item.id,
        name: item.displayName,
        className: item.class.displayName,
        clickStatus: item?.attendance?.isLinkClicked ?? false,
        clickTime: clickTime,
        clickDate: clickDate,
        attendance:
          item?.attendance?.attendanceStatus ??
          (item?.attendance?.isLinkClicked
            ? StudentAttendanceStatus.PRESENT
            : StudentAttendanceStatus.ABSENT),
        subject: item.subject?.displayName ?? '',
        startDate: formattedDate,
        startTime: formattedTime,
      };
    });
  }
}
