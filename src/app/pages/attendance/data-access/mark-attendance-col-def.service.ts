import { Injectable, computed, inject } from '@angular/core';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import { IClassAttendance } from './attendance.interface';
import { TranslocoService } from '@jsverse/transloco';
import { StudentAttendanceStatusCellComponent } from '../components/student-attendance-status-cell/student-attendance-status-cell.component';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { Idropdown } from '@shared/interfaces';
import { AttendanceService } from './attendance.service';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';

@Injectable()
export class MarkAttendanceColDefService {
  private readonly translocoService = inject(TranslocoService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly attendanceService = inject(AttendanceService);

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

  studentsAttendanceListingColumns = computed<ITableCol<IClassAttendance>[]>(
    () => [
      {
        field: 'name',
        headerName: this.translocoService.translate(
          'global.student_name.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'text',
      },
      {
        field: 'nationalId',
        headerName: this.translocoService.translate('global.national_id.title'),
        sortable: false,
        filter: true,
        filterType: 'text',
        cellStyle: {
          'font-weight': 'bold',
        },
      },
      {
        field: 'checkIn',
        headerName: this.translocoService.translate(
          'attendance.check_in.title',
        ),
        sortable: false,
        filter: false,
        type: 'time',
      },
      {
        field: 'checkOut',
        headerName: this.translocoService.translate(
          'attendance.check_out.title',
        ),
        sortable: false,
        filter: false,
        type: 'time',
      },
      {
        field: 'attendance',
        headerName: this.translocoService.translate(
          'attendance.daily_attendance.title',
        ),
        sortable: false,
        filter: false,
        cellRenderer: StudentAttendanceStatusCellComponent,
        cellRendererParams: {},
        minWidth: 382,
      },
      {
        field: 'attendanceType',
        headerName: this.translocoService.translate(
          'attendance.attendance_type.title',
        ),
        sortable: false,
        filter: false,
        type: 'enum',
      },
      {
        field: 'reason',
        headerName: this.translocoService.translate('attendance.reason.title'),
        sortable: false,
        filter: false,
      },
    ],
  );

  noRowsOverlayComponentParams = computed<INoRowsOverlay>(() => {
    return {
      imgSrc: 'assets/illustrations/no_data.svg',
      title: this.translocoService.translate(
        'attendance.no_recorded_attendance.txt',
      ),
    };
  });

  listingDropdownFilters = computed<
    Array<IControl & { initVal?: string | number | null }>
  >(() => {
    return [
      {
        formControlName: 'levelId',
        placeholder: this.translocoService.translate('global.level.label'),
        selectValues: this.levelOptions(),
        initVal: this.attendanceService.selectedLevel(),
        required: false,
        type: 'searchable-select',
      },
      {
        formControlName: 'classId',
        placeholder: this.translocoService.translate('global.class.label'),
        selectValues: this.classOptions(),
        initVal: this.attendanceService.selectedClass(),
        required: false,
        type: 'searchable-select',
      },
    ];
  });

  constructor() {}
}
