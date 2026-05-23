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
import { IonContent, Platform } from '@ionic/angular/standalone';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { VcrAPIService } from '@pages/vcr/data-access/vcr.api-service';
import {
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
} from 'ag-grid-community';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import { LectureSessionTableCellComponent } from '@pages/vcr/components/lecture-session-table-cell/lecture-session-table-cell.component';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { AttendanceListStatusTableCellComponent } from '@pages/vcr/components/attendance-list-status-table-cell/attendance-list-status-table-cell.component';
import { faEdit, faEye } from '@fortawesome/pro-light-svg-icons';
import {
  AttendanceStatus,
  ManageAttendanceTableItem,
} from '@pages/vcr/data-access/attendance.dto';
import { ActivatedRoute, Router } from '@angular/router';
import { VCRAttendance } from '../data-access/attendance.interface';

@Component({
  selector: 'app-attendance-list',
  templateUrl: './attendance-list.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    HesTableComponent,
    TranslocoDirective,
  ],
})
export class AttendanceListPage implements OnInit {
  readonly vcrId = input<number>();
  private readonly router = inject(Router);
  private readonly translateService = inject(HesTranslateService);
  private readonly vcrApiService = inject(VcrAPIService);
  private readonly platform = inject(Platform);
  private readonly route = inject(ActivatedRoute);

  readonly autoSizeStrategy = signal<
    SizeColumnsToFitGridStrategy | SizeColumnsToContentStrategy | undefined
  >({ type: 'fitGridWidth' });
  readonly isLoading = signal<boolean>(false);
  readonly rowsData = signal<ManageAttendanceTableItem[]>([]);
  readonly colDef = computed<ITableCol<ManageAttendanceTableItem>[]>(() => {
    return [
      {
        field: 'lecture',
        sortable: false,
        filter: false,
        headerName: this.translate('virtual_classrooms.lecture.title'),
        cellRenderer: LectureSessionTableCellComponent,
      },
      {
        field: 'markedBy',
        sortable: false,
        filter: false,
        headerName: this.translate('attendance.marked_by.title'),
      },
      {
        field: 'status',
        sortable: false,
        filter: false,
        headerName: this.translate('attendance.attendance_status.title'),
        cellRenderer: AttendanceListStatusTableCellComponent,
      },
      {
        field: '',
        headerName: this.translate('global.actions.title'),
        sortable: false,
        filter: false,
        type: 'action',
        minWidth: 210,
        actions: this.actions(),
      },
    ];
  });

  readonly actions = computed<IAction<ManageAttendanceTableItem>[]>(() => {
    return [
      {
        hasPermission: (data) => {
          console.log(data);
          return data.status === AttendanceStatus.PENDING;
        },
        button: {
          label: this.translate('attendance.mark_attendance.title'),
        },
        text: this.translate('attendance.mark_attendance.title'),
        onClick: (rowData) => {
          this.router.navigate(['manage', rowData.id], {
            relativeTo: this.route,
            queryParams: { edit: true },
          });
        },
      },
      {
        hasPermission: (data) => {
          return data.status === AttendanceStatus.SUBMITTED;
        },
        iconProps: { icon: faEye },
        text: this.translate('view'),
        onClick: (data) => {
          this.router.navigate(['manage', data.id], {
            relativeTo: this.route,
            queryParams: { edit: false },
          });
        },
      },
      {
        hasPermission: (data) => {
          return data.status === AttendanceStatus.SUBMITTED;
        },
        text: this.translate('global.edit.btn'),
        iconProps: { icon: faEdit },
        onClick: (rowData) => {
          this.router.navigate(['manage', rowData.id], {
            relativeTo: this.route,
            queryParams: { edit: true },
          });
        },
      },
    ];
  });

  readonly noRowsOverlayComponentParams = signal<INoRowsOverlay>({
    imgSrc: 'assets/illustrations/no_data.svg',
    title: this.translate('No VCRs Added'),
  });

  ngOnInit() {
    this.platform.width() <= 1440
      ? this.autoSizeStrategy.set({ type: 'fitCellContents' })
      : this.autoSizeStrategy.set({ type: 'fitGridWidth' });
  }

  ionViewWillEnter() {
    this.fetchAttendances();
  }

  private fetchAttendances() {
    this.vcrApiService.fetchVCRAttendances(this.vcrId()!).subscribe((resp) => {
      this.rowsData.set(this.mapToTableRow(resp));
    });
  }

  private translate(key: string) {
    return this.translateService.t(key);
  }

  private mapToTableRow(data: VCRAttendance[]): ManageAttendanceTableItem[] {
    return data.map((item) => {
      return {
        id: item.id,
        status: item.status,
        lecture: { ...item.lecture, date: item.date },
        markedBy: item.displayMarkBy || null,
      };
    });
  }
}
