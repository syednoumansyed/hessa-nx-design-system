import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { TranslocoService } from '@jsverse/transloco';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import { SchoolService } from '@pages/school-structure/pages/school/school.service';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { merge, skip } from 'rxjs';

@Component({
  selector: 'app-course-list-filter',
  templateUrl: './course-list-filter.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormControlGeneratorComponent],
  providers: [SchoolStructureListingService],
})
export class CourseListFilterComponent implements OnInit {
  // Dependency injections for various services
  private readonly courseManagementService = inject(CourseManagementService);
  private readonly schoolService = inject(SchoolService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly translocoService = inject(TranslocoService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );

  // Signals to hold selected school ID and personnel list
  selectedSchoolId = this.schoolScopeService.selectedSchoolId;
  private readonly personnelsList = signal<ISelectValue[]>([]);
  private readonly filtersValue = signal({});

  // Form control configuration for school structure and filter controls
  schoolStructureControlsConfig = computed<Array<IControl>>(() => [
    {
      formControlName: 'levelId',
      placeholder: this.translocoService.translate('global.level.label'),
      required: false,
      type: 'searchable-select',
      SchoolStructureListingType: 'level',
      searchableSelectObject: {
        condensed: true,
        fill: 'outline',
      },
    },
    {
      formControlName: 'classId',
      placeholder: this.translocoService.translate('global.class.label'),
      required: false,
      type: 'searchable-select',
      SchoolStructureListingType: 'class',
      searchableSelectObject: {
        condensed: true,
        fill: 'outline',
      },
    },
  ]);

  controlsConfig = computed<Array<IControl>>(() => {
    const subjectOptions = this.courseManagementService.teacherAndSubjectList();
    const personnelOptions = this.personnelsList();
    const filters: IControl[] = [];
    if (this.personnelsList().length > 1) {
      filters.push({
        formControlName: 'personnelId',
        placeholder: this.translocoService.translate(
          'course_management.teacher.title',
        ),
        required: false,
        type: 'searchable-select',
        selectValues: personnelOptions.length ? personnelOptions : [],
        searchableSelectObject: {
          condensed: true,
          fill: 'outline',
        },
      });
    }

    filters.push({
      formControlName: 'subjectId',
      placeholder: this.translocoService.translate('resource.course'),
      required: false,
      type: 'searchable-select',
      selectValues: subjectOptions.length ? subjectOptions : [],
      searchableSelectObject: {
        condensed: true,
        fill: 'outline',
      },
    });

    return filters;
  });

  // Reactive form initialization
  form = this.createForm();

  // Output to emit filter change events
  filterChange = output<CourseListFilterParams>();

  // Destroy reference for unsubscribing from observables
  destroyRef = inject(DestroyRef);

  constructor() {
    this.schoolStructureFilterSetup();
  }

  ngOnInit() {
    const schoolId = this.selectedSchoolId();
    if (schoolId) {
      this.updateTeacherList(schoolId);
    }

    // Listen for changes in course and personnel fields
    merge(
      this.form.controls.subjectId.valueChanges,
      this.form.controls.personnelId.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onFilterChange();
      });
  }

  // Setup for handling school structure changes
  private schoolStructureFilterSetup() {
    toObservable(
      this.schoolStructureListingService!.selectedSchoolStructureModelId,
    )
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        this.filtersValue.update((oldValue) => {
          const newFilter = {
            ...oldValue,
            ...v,
          };

          // Clean filter to remove undefined or null values
          const cleanedFilter = Object.fromEntries(
            Object.entries(newFilter).filter(
              ([_key, value]) => value != undefined && value != null,
            ),
          );
          return cleanedFilter;
        });
        this.onFilterChange();
      });
  }

  // Handle filter change events
  private onFilterChange() {
    const subjectId = this.form.controls.subjectId.value;
    const personnelId = this.form.controls.personnelId.value;

    this.filterChange.emit({
      ...(subjectId && { subjectId }),
      ...(personnelId && { personnelId }),
      ...this.filtersValue(),
    });
  }

  // Fetch and update the teacher list based on the selected school
  private updateTeacherList(schoolId?: number) {
    if (schoolId) {
      this.schoolService
        .getAllSchoolTeachers(schoolId)
        .subscribe((response) => {
          this.personnelsList.set(response);
        });
    } else {
      this.personnelsList.set([]);
    }
  }

  // Create the reactive form
  private createForm() {
    return this.fb.group({
      levelId: this.fb.control<number | null>(null),
      classId: this.fb.control<number | null>(null),
      personnelId: this.fb.control<number | null>(null),
      subjectId: this.fb.control<number | null>(null),
    });
  }
}

// Interface for course list filter parameters
export interface CourseListFilterParams {
  companyId?: number;
  campusId?: number;
  schoolId?: number;
  levelId?: number;
  classId?: number;
  personnelId?: number;
  subjectId?: number;
}
