import { Injectable, computed, inject, signal } from '@angular/core';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import { IClassAttendance } from './attendance.interface';
import { TranslocoService } from '@jsverse/transloco';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { faEye, faPen } from '@fortawesome/pro-regular-svg-icons';
import { AttendanceStatusCellComponent } from '../components/class-attendance-status-cell/class-attendance-status-cell.component';
import { AttendanceActionsCellComponent } from '../components/attendance-actions-cell/attendance-actions-cell.component';
import { Idropdown } from '@shared/interfaces';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { ClassAttendanceStatus } from './attendance.dto';
import { AttendanceService } from './attendance.service';
import { Router } from '@angular/router';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';
import { isSameDay } from 'date-fns';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

@Injectable()
export class AttendanceColDefService {
  private readonly translocoService = inject(TranslocoService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly router = inject(Router);

  readonly actions = computed<IAction<IClassAttendance>[]>(() => {
    return [
      {
        iconProps: { icon: faEye },
        text: this.translocoService.translate('global.view.btn'),
        hasPermission: (data) => {
          return (
            !this.attendanceService.isMarkAttendanceAllowed() &&
            !this.rbacService.hasPermission(
              RESOURCE_PERMISSION.attendance.UPDATE,
            )
          );
        },
        onClick: (data) => {
          this.attendanceService.updateSelectedClass(data.classId);
          this.attendanceService.updateSelectedLevel(data.levelId);
          this.navigateToMarkAttendanceView();
        },
        permissionIds: [RESOURCE_PERMISSION.attendance.LIST],
      },
      {
        iconProps: { icon: faPen },
        text: this.translocoService.translate('global.edit.btn'),
        onClick: (data) => {
          this.attendanceService.updateSelectedClass(data.classId);
          this.attendanceService.updateSelectedLevel(data.levelId);
          this.navigateToMarkAttendanceView();
        },
        permissionIds: [RESOURCE_PERMISSION.attendance.UPDATE],
      },
    ];
  });

  classAttendanceListingColumns = computed<ITableCol<IClassAttendance>[]>(
    () => [
      {
        field: 'class',
        headerName: this.translocoService.translate('global.class.label'),
        sortable: false,
        filter: false,
      },
      {
        field: 'level',
        headerName: this.translocoService.translate('global.level.label'),
        sortable: false,
        filter: false,
      },
      {
        field: 'date',
        headerName: this.translateGlobal('global.date.title'),
        sortable: false,
        filter: false,
        type: 'dateDay',
      },
      {
        field: 'markedBy',
        headerName: this.translocoService.translate(
          'attendance.marked_by.title',
        ),
        sortable: false,
        filter: false,
      },
      {
        field: 'status',
        headerName: this.translocoService.translate(
          'attendance.attendance_status.title',
        ),
        sortable: false,
        filter: false,
        cellRenderer: AttendanceStatusCellComponent,
      },
      {
        field: 'actions',
        headerName: this.translateGlobal('global.actions.title'),
        sortable: false,
        filter: false,
        cellRenderer: AttendanceActionsCellComponent,
        cellRendererParams: {
          onMarkAttendance: (data: IClassAttendance) => {
            this.attendanceService.updateSelectedLevel(data.levelId);
            this.attendanceService.updateSelectedClass(data.classId);
            this.navigateToMarkAttendanceView();
          },
          onMarkAttendancePermissionId: [RESOURCE_PERMISSION.attendance.CREATE],
          actions: this.actions(),
        },
      },
    ],
  );

  noRowsOverlayComponentParams = signal<INoRowsOverlay>({
    imgSrc: 'assets/illustrations/no_data.svg',
    subTitle: this.translocoService.translate(
      'attendance.no_recorded_attendance.txt',
    ),
  }).asReadonly();

  levelOptions = computed<Idropdown[]>(() => {
    return this.schoolStructureListingService.levelsList().map((level) => ({
      value: level.id,
      displayedValue: level.name,
    }));
  });
  classOptions = computed<Idropdown[]>(() => {
    return this.schoolStructureListingService
      .classesList()
      .map((classData) => ({
        value: classData.id,
        displayedValue: classData.name,
      }));
  });
  statusOptions = signal<Idropdown[]>([
    {
      value: ClassAttendanceStatus.PENDING,
      displayedValue: this.translocoService.translate(
        ClassAttendanceStatus.PENDING,
        {},
        'enum',
      ),
    },
    {
      value: ClassAttendanceStatus.IN_PROGRESS,
      displayedValue: this.translocoService.translate(
        ClassAttendanceStatus.IN_PROGRESS,
        {},
        'enum',
      ),
    },
    {
      value: ClassAttendanceStatus.SUBMITTED,
      displayedValue: this.translocoService.translate(
        ClassAttendanceStatus.SUBMITTED,
        {},
        'enum',
      ),
    },
  ]);
  selectedLevel = this.schoolStructureListingService.selectedLevel;
  selectedClass = this.schoolStructureListingService.selectedClass;

  listingDropdownFilters = computed<IControl[]>(() => {
    return [
      {
        name: 'levelId',
        placeholder: this.translocoService.translate('global.level.label'),
        options: this.levelOptions,
        required: false,
        type: 'searchable-select',
      },
      {
        name: 'classId',
        placeholder: this.translocoService.translate('global.class.label'),
        options: this.classOptions,
        initVal: this.classOptions(),
        required: false,
        type: 'searchable-select',
      },
      {
        name: 'status',
        placeholder: this.translocoService.translate(
          'attendance.select_status.dropdown',
        ),
        options: this.statusOptions,
        required: false,
        type: 'searchable-select',
      },
    ];
  });

  listingDropdownControls = computed<Array<IControl>>(() => {
    return [
      {
        formControlName: 'levelId',
        placeholder: this.translocoService.translate('global.level.label'),
        required: false,
        type: 'searchable-select',
        SchoolStructureListingType: 'level',
      },
      {
        formControlName: 'classId',
        placeholder: this.translocoService.translate('global.class.label'),
        required: false,
        type: 'searchable-select',
        SchoolStructureListingType: 'class',
      },
      {
        formControlName: 'status',
        placeholder: this.translocoService.translate(
          'attendance.select_status.dropdown',
        ),
        selectValues: this.statusOptions(),
        required: false,
        type: 'searchable-select',
      },
    ];
  });

  constructor() {}

  private navigateToMarkAttendanceView() {
    // this will make sure that events are not triggered when the user leaves list page
    this.attendanceService.viewAttendanceActive.set(false);
    this.router.navigate(['attendance', 'mark']);
  }

  private translateGlobal(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
