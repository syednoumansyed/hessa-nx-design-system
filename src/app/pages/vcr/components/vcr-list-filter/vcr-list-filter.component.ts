import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { SchoolService } from '@pages/school-structure/pages/school/school.service';
import {
  IControl,
  FormControlGeneratorComponent,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { Idropdown } from '@shared/interfaces';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { IonButton } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { VirtualClassroomFilterBy } from '@pages/vcr/data-access/vcr.enum';
import { VCRColDefService } from '@pages/vcr/vcr-col-def.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  startWith,
} from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { VirtualClassroomRequestPayload } from '@pages/vcr/data-access/vcr.dto';
import { getUnixTime, startOfDay, endOfDay } from 'date-fns';
import { isEqual } from 'lodash';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { isMobile } from '@shared/utils/platform';
import { faPlus } from '@fortawesome/pro-light-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseSubject } from '@pages/course-management/data-access/course-management.interface';

@Component({
  selector: 'app-vcr-list-filter',
  templateUrl: './vcr-list-filter.component.html',
  standalone: true,
  imports: [
    IonButton,
    CommonModule,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    HesButtonModule,
    RbacDirective,
  ],
  providers: [SchoolStructureListingService],
})
export class VcrListFilterComponent implements OnInit {
  //region injection
  private readonly translationService = inject(HesTranslateService);
  private readonly courseService = inject(CourseManagementService);
  private readonly schoolService = inject(SchoolService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  // #endregion

  // #region  private properties
  private readonly subjectDropdown = signal<Idropdown[]>([]);
  private readonly teacherDropdown = signal<Idropdown[]>([]);
  // #endregion

  // #endregion input & output
  readonly filterChange = output<VCRFilterParam>({});
  readonly addVrcsPermissionId = RESOURCE_PERMISSION.VCR.CREATE.ADD;
  readonly isMobile = isMobile();
  // #endregion

  // #region public properties
  readonly isAdvanceFilter = computed<boolean>(() =>
    this.rbacService.hasPermission(
      RESOURCE_PERMISSION.VCR.READ.VIEW_ADVANCED_FILTERS,
    ),
  );
  readonly faPlus = faPlus;
  // #endregion

  // #region filter config
  readonly advanceFiltersForm = this.getAdvanceForm();
  readonly commonFiltersForm = this.getCommonFilter();
  readonly commonFiltersConfig = computed<Array<IControl>>(() => {
    return [
      {
        formControlName: 'filterBy',
        selectValues: this.vcrOptions(),
        required: false,
        type: 'searchable-select',
        searchableSelectObject: {
          condensed: true,
          fill: 'outline',
        },
      },
      {
        type: 'date-range',
        required: false,
        formControlName: 'dateRange',
        placeholder: this.translate('global.select_date.placeholder'),
      },
    ];
  });
  readonly advanceFilterFormConfig = computed<IControl[]>(() => {
    return [
      {
        placeholder: this.translate('global.teacher.title'),
        type: 'searchable-select',
        formControlName: 'teacher',
        selectValues: this.teacherDropdown(),
        required: false,
        searchableSelectObject: {
          condensed: true,
          fill: 'outline',
        },
      },
      {
        placeholder: this.translate('global.subject.title'),
        type: 'searchable-select',
        formControlName: 'subject',
        selectValues: this.subjectDropdown(),
        required: false,
        searchableSelectObject: {
          condensed: true,
          fill: 'outline',
        },
      },
      {
        placeholder: this.translate('global.select_level.dropdown'),
        type: 'searchable-select',
        formControlName: 'level',
        required: false,
        SchoolStructureListingType: 'level',
        searchableSelectObject: {
          condensed: true,
          fill: 'outline',
        },
      },
      {
        placeholder: this.translate(
          'course_management.select_classes.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'class',
        required: false,
        isMultiple: false,
        SchoolStructureListingType: 'class',
        searchableSelectObject: {
          condensed: true,
          fill: 'outline',
        },
      },
    ];
  });
  // #endregion

  // #region public methods
  constructor() {
    combineLatest([
      toObservable(this.schoolScopeService.selectedSchoolId),
      toObservable(this.academicYearScope.selectedAcademicYear),
      toObservable(this.academicYearScope.selectedSemester),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([schoolId]) => {
        if (schoolId) {
          this.getSchoolTeachers(schoolId);
        }
      });
  }

  ngOnInit() {
    this.getAllSubjects();
    this.setupTeacherChangeSubscription();
    this.filterChangeSubscripiton();
  }
  onAddVCR() {
    this.router.navigate(['add'], {
      relativeTo: this.route,
    });
  }
  // #endregion

  // #region private methods
  private translate(value: string) {
    return this.translationService.t(value);
  }

  private getAllSubjects() {
    return this.courseService.getAllSubjects().subscribe({
      next: (data) => {
        this.subjectDropdown.set(data);
      },
    });
  }

  private getSubjectsByPersonnel(personnelId: number) {
    return this.courseService.getSubjectsByPersonnelId(personnelId).subscribe({
      next: (data) => {
        this.subjectDropdown.set(data);
      },
    });
  }

  private setupTeacherChangeSubscription() {
    this.advanceFiltersForm.controls.teacher.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged())
      .subscribe((teacherId) => {
        // Reset subject selection when teacher changes
        this.advanceFiltersForm.controls.subject.setValue(undefined, {
          emitEvent: false,
        });

        if (teacherId) {
          // Fetch subjects for selected teacher
          this.getSubjectsByPersonnel(teacherId);
        } else {
          // Show all subjects when no teacher is selected
          this.getAllSubjects();
        }
      });
  }

  private getSchoolTeachers(schoolId: number) {
    return this.schoolService.getAllSchoolTeachers(schoolId).subscribe({
      next: (data) => {
        const dropdownOptions = data.sort((a: any, b: any) =>
          a.displayedValue.localeCompare(b.displayedValue),
        );
        this.teacherDropdown.set(dropdownOptions);
      },
    });
  }

  private getAdvanceForm() {
    return this.fb.group({
      level: this.fb.control<number | undefined>(
        undefined,
        Validators.required,
      ),
      class: this.fb.control<number | undefined>(
        undefined,
        Validators.required,
      ),
      subject: this.fb.control<number | undefined>(
        undefined,
        Validators.required,
      ),
      teacher: this.fb.control<number | undefined>(
        undefined,
        Validators.required,
      ),
    });
  }

  private getCommonFilter() {
    return this.fb.group({
      dateRange: this.fb.control<{ from: Date; to: Date } | null>(null),
      filterBy: [VirtualClassroomFilterBy.ALL],
    });
  }

  private vcrOptions() {
    return [
      {
        value: VirtualClassroomFilterBy.ALL,
        displayedValue: this.translate('virtual_classrooms.all_vcrs.btn'),
      },
      {
        value: VirtualClassroomFilterBy.UPCOMING,
        displayedValue: this.translate('virtual_classrooms.upcoming_vcrs.btn'),
      },
      {
        value: VirtualClassroomFilterBy.PAST,
        displayedValue: this.translate('virtual_classrooms.past_vcrs.btn'),
      },
    ];
  }

  private filterChangeSubscripiton() {
    // Track changes on 'filterBy' and 'dateRange' to update each other as needed
    this.commonFiltersForm.controls.filterBy.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged(isEqual))
      .subscribe((filterByValue) => {
        if (
          filterByValue === VirtualClassroomFilterBy.UPCOMING ||
          filterByValue === VirtualClassroomFilterBy.PAST
        ) {
          // Reset the date range if 'Upcoming' or 'Past' VCRs are selected
          this.commonFiltersForm.controls.dateRange.setValue(null, {
            emitEvent: false,
          });
        }
      });

    this.commonFiltersForm.controls.dateRange.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged(isEqual))
      .subscribe((dateRange) => {
        if (dateRange.from || dateRange.to) {
          // If any date is selected, switch to 'All VCRs'
          this.commonFiltersForm.controls.filterBy.setValue(
            VirtualClassroomFilterBy.ALL,
            { emitEvent: false },
          );
        }
      });
    combineLatest([
      this.advanceFiltersForm.valueChanges.pipe(
        startWith(this.advanceFiltersForm.value),
      ),
      this.commonFiltersForm.valueChanges.pipe(
        startWith(this.commonFiltersForm.value),
      ),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(500),
        distinctUntilChanged(isEqual),
      )
      .subscribe(([advanceFormValue, commonFilterValue]) => {
        const filter = {
          classId: advanceFormValue.class,
          levelId: advanceFormValue.level,
          subjectId: advanceFormValue.subject,
          personnelId: advanceFormValue.teacher,
          filterBy: commonFilterValue.filterBy,
          ...getDateRangeOrSingleDate(commonFilterValue.dateRange!),
        };
        this.filterChange.emit(filter);
      });
  }
  // #endregion
}

// #endregion internal
export type VCRFilterParam = Partial<
  Omit<
    VirtualClassroomRequestPayload,
    'pageNumber' | 'itemPerPage' | 'academicYearId' | 'schoolId'
  >
>;

function getDateRangeOrSingleDate(dateRange: {
  from: Date | null;
  to: Date | null;
}): {
  startDate: number | undefined;
  endDate: number | undefined;
} {
  const { from, to } = dateRange || {};

  // Check if either date is null or undefined
  if (!from || !to) {
    return {
      startDate: undefined,
      endDate: undefined,
    };
  }

  return {
    startDate: getUnixTime(startOfDay(from)),
    endDate: getUnixTime(endOfDay(to)),
  };
}

// #endregion
