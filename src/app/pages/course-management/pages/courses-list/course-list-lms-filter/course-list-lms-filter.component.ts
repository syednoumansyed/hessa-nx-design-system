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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CourseSubjectListItem } from '@pages/course-management/data-access/courses-list.interface';
import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';
import { merge } from 'rxjs';

@Component({
  selector: 'app-course-list-lms-filter',
  templateUrl: './course-list-lms-filter.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormControlGeneratorComponent],
})
export class CourseListLmsFilterComponent implements OnInit {
  // #region Outputs
  readonly filterChange = output<CourseListFilterParams>();
  // #endregion

  // #region Injects
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translocoService = inject(HesTranslateService);
  private readonly courseListService = inject(CourseListService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  // #endregion

  // #region Private properties
  private readonly subjectFiltersMap = new Map<number, ISelectValue>();
  private readonly teacherFiltersMap = new Map<
    number,
    ISelectValue<{ courses: Map<number, ISelectValue> }>
  >();

  private readonly teacherFilterOptions = signal<ISelectValue[]>([]);
  private readonly subjectFilterOptions = signal<ISelectValue[]>([]);
  // #endregion

  // #region Public properties
  readonly form = this.createForm();
  readonly controlsConfig = computed<Array<IControl>>(() =>
    this.buildControlsConfig(),
  );
  // #endregion

  // #region Public methods
  ngOnInit() {
    this.initializeFilter();
    this.listenForFormChanges();
  }
  // #endregion

  // #region Private methods
  private createForm() {
    return this.fb.group({
      personnelId: this.fb.control<number | null>(null),
      subjectId: this.fb.control<number | null>(null),
    });
  }

  private buildControlsConfig(): Array<IControl> {
    const personnelOptions = this.teacherFilterOptions();
    const isTeacher = this.authService.user()?.type === UserType.PERSONNEL;
    const filters: IControl[] = [];

    if (!isTeacher && personnelOptions.length > 0) {
      filters.push({
        formControlName: 'personnelId',
        placeholder: this.translocoService.t('course_management.teacher.title'),
        required: false,
        type: 'searchable-select',
        selectValues: personnelOptions,
        searchableSelectObject: {
          condensed: true,
          fill: 'outline',
        },
      });
    }

    filters.push({
      formControlName: 'subjectId',
      placeholder: this.translocoService.t('resource.course'),
      required: false,
      type: 'searchable-select',
      selectValues: this.subjectFilterOptions(),
      searchableSelectObject: {
        condensed: true,
        fill: 'outline',
      },
    });

    return filters;
  }

  private initializeFilter() {
    this.courseListService.getLMSCourses().subscribe((courses) => {
      this.populateFilters(courses);
      this.subjectFilterOptions.set(
        Array.from(this.subjectFiltersMap.values()),
      );
      this.teacherFilterOptions.set(
        Array.from(this.teacherFiltersMap.values()),
      );
    });
  }

  private populateFilters(courses: CourseSubjectListItem[]) {
    courses.forEach((course) => {
      const { subject, personnel: teacher, coPersonnel: coTeacher } = course;

      this.addToFilterMap(
        this.subjectFiltersMap,
        subject.id,
        subject.displayName,
      );
      this.addTeacherFilter(this.teacherFiltersMap, teacher, course);
      if (coTeacher?.id)
        this.addTeacherFilter(this.teacherFiltersMap, coTeacher, course);
    });
  }

  private addToFilterMap(
    map: Map<number, ISelectValue>,
    id: number,
    name: string,
  ) {
    if (!map.has(id)) {
      map.set(id, { value: id, displayedValue: name });
    }
  }

  private addTeacherFilter(
    map: Map<number, ISelectValue<{ courses: Map<number, ISelectValue> }>>,
    teacher: CourseSubjectListItem['personnel'],
    course: CourseSubjectListItem,
  ) {
    if (!map.has(teacher.id)) {
      map.set(teacher.id, {
        value: teacher.id,
        displayedValue: teacher.displayName,
        extraData: { courses: new Map() },
      });
    }
    map.get(teacher.id)?.extraData?.courses.set(course.id, {
      value: course.subject.id,
      displayedValue: course.subject.displayName,
    });
  }

  private listenForFormChanges() {
    const { subjectId, personnelId } = this.form.controls;

    merge(subjectId.valueChanges, personnelId.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitFilterChange());

    personnelId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (id) {
          subjectId.setValue(null);
          const subjects = Array.from(
            this.teacherFiltersMap.get(id)?.extraData?.courses.values() || [],
          );
          this.subjectFilterOptions.set(subjects);
        } else {
          this.subjectFilterOptions.set(
            Array.from(this.subjectFiltersMap.values()),
          );
        }
      });
  }

  private emitFilterChange() {
    const { subjectId, personnelId } = this.form.controls;
    this.filterChange.emit({
      ...(subjectId.value && { subjectId: subjectId.value }),
      ...(personnelId.value && { personnelId: personnelId.value }),
    });
  }
  // #endregion
}

// #region Types
interface CourseListFilterParams {
  personnelId?: number;
  subjectId?: number;
}
// #endregion
