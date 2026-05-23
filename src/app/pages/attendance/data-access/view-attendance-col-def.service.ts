import { Injectable, computed, inject } from '@angular/core';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import { TranslocoService } from '@jsverse/transloco';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { Idropdown } from '@shared/interfaces';
import { InfiniteScrollCustomEvent } from '@ionic/angular/standalone';
import { StudentAttendanceService } from '../pages/student-attendance/data-access/student-attendance.service';
import { AttendanceStatus } from './attendance.dto';
import { IStudentAttendanceListingItem } from './attendance.interface';
import { AttendanceCellComponent } from '../components/attendance-cell/attendance-cell.component';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';

@Injectable()
export class ViewAttendanceColDefService {
  private readonly translocoService = inject(TranslocoService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly studentAttendanceService = inject(StudentAttendanceService);

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

  studentAttendanceListingColumns = computed<
    ITableCol<IStudentAttendanceListingItem>[]
  >(() => [
    {
      field: 'date',
      headerName: this.translocoService.translate('global.date.title'),
      sortable: false,
      filter: false,
      type: 'dateDay',
    },
    {
      field: 'checkIn',
      headerName: this.translocoService.translate('attendance.check_in.title'),
      sortable: false,
      filter: false,
      type: 'time',
    },
    {
      field: 'checkOut',
      headerName: this.translocoService.translate('attendance.check_out.title'),
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
      cellRenderer: AttendanceCellComponent,
      cellRendererParams: {},
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
      headerName: this.translocoService.translate(
        'attendance.reason_for_leave.title',
      ),
      sortable: false,
      filter: false,
    },
  ]);

  listingDropdownFilters = computed<
    Array<IControl & { initVal?: string | number | null }>
  >(() => {
    return [
      {
        formControlName: 'levelId',
        placeholder: this.translocoService.translate(
          'global.select_level.dropdown',
        ),
        selectValues: this.levelOptions(),
        initVal: this.studentAttendanceService.selectedLevel()?.id,
        required: false,
        type: 'searchable-select',
        SchoolStructureListingType: 'level',
      },
      {
        formControlName: 'classId',
        placeholder: this.translocoService.translate(
          'global.select_class.dropdown',
        ),
        selectValues: this.classOptions(),
        initVal: this.studentAttendanceService.selectedClass()?.id,
        required: false,
        type: 'searchable-select',
        SchoolStructureListingType: 'class',
      },
      {
        formControlName: 'studentId',
        placeholder: this.translocoService.translate(
          'global.select_student.btn',
        ),
        selectValues: this.studentAttendanceService.studentOptions(),
        pagination: this.studentAttendanceService.studentOptionsPagination,
        required: false,
        type: 'searchable-select',
        initVal: this.studentAttendanceService.selectedStudent(),
        searchableSelectObject: {
          searchable: true,
          onLoadMore: (event: InfiniteScrollCustomEvent) => {
            this.studentAttendanceService
              .populateStudentOptions(
                {
                  pageNumber:
                    this.studentAttendanceService.studentOptionsPagination()!
                      .pageNumber + 1,
                  studentClassStatus: 'ACTIVE',
                },
                true,
                event,
              )
              .subscribe();
          },
          onSearchChanged: (value: string) => {
            if (value) {
              this.studentAttendanceService.updateStudentsListSearchText(value);
            } else
              this.studentAttendanceService.updateStudentsListSearchText(
                undefined,
              );
            this.studentAttendanceService
              .populateStudentOptions({ studentClassStatus: 'ACTIVE' })
              .subscribe();
          },
        },
      },
    ];
  });

  statusOptions = computed(() => [
    {
      value: null,
      displayedValue: this.translocoService.translate(
        'attendance.total_attendance.title',
      ),
      hesIcon: {
        src: 'assets/icons/profile-2user.svg',
      },
    },
    {
      value: AttendanceStatus.PRESENT,
      displayedValue: this.translocoService.translate(
        'attendance.presents.title',
      ),
      hesIcon: {
        src: 'assets/icons/user-tick.svg',
      },
    },
    {
      value: AttendanceStatus.ABSENT,
      displayedValue: this.translocoService.translate(
        'attendance.absents.title',
      ),
      hesIcon: {
        src: 'assets/icons/user-remove.svg',
      },
    },
    {
      value: AttendanceStatus.ON_LEAVE,
      displayedValue: this.translocoService.translate(
        'attendance.leaves.title',
      ),
      hesIcon: {
        src: 'assets/icons/user-minus.svg',
      },
    },
    {
      value: AttendanceStatus.EXCUSED,
      displayedValue: this.translateEnum(AttendanceStatus.EXCUSED),
      hesIcon: {
        src: 'assets/icons/user-tick.svg',
      },
    },
    {
      value: AttendanceStatus.LATE_ARRIVAL,
      displayedValue: this.translocoService.translate(
        'attendance.late_arrivals.title',
      ),

      hesIcon: {
        src: 'assets/icons/user-clock.svg',
      },
    },
  ]);

  noRowsOverlayComponentParams = computed<INoRowsOverlay>(() => {
    return {
      imgSrc: 'assets/illustrations/no_data.svg',
      subTitle: this.translocoService.translate('global.no_data.txt'),
    };
  });

  constructor() {}

  translateEnum(key: string, params: object = {}): string {
    return this.translocoService.translate('enum.' + key, params);
  }
}
