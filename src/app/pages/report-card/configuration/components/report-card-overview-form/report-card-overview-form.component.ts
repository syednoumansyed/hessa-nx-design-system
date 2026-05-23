import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import {
  IControl,
  FormControlGeneratorComponent,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { Idropdown } from '@shared/interfaces';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { StructureDepth } from '@shared/utils/school-structure';
import { TranslocoDirective } from '@jsverse/transloco';
import { ManageReportCardContextService } from '../../services/manage-report-card-context.service';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { map } from 'rxjs';
import { toDropdown } from '@shared/utils/to-dropdown';
import { TuiDay } from '@taiga-ui/cdk';
import { AcademicYearApiService } from '@pages/academic-year/data-access/academic-year-api.service';
import { ReportCardDetail } from '../../data-access/report-card-configuration.interface';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';

@Component({
  selector: 'app-report-card-overview-form',
  templateUrl: './report-card-overview-form.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    CommonModule,
    TranslocoDirective,
  ],
  providers: [SchoolStructureListingService, HesDatePipe],
})
export class ReportCardOverviewFormComponent implements OnInit {
  // #region Inputs
  form = input.required<FormGroup>();
  reportCard = input<ReportCardDetail | null>();
  // #endregion

  // #region Injectable
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translateService = inject(HesTranslateService);
  private readonly academicYearApiService = inject(AcademicYearApiService);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly academicYearDropdown = signal<Idropdown[]>([]);
  private readonly contextService = inject(ManageReportCardContextService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly datePipe = inject(HesDatePipe);
  private endDateMin = signal<TuiDay>(TuiDay.currentLocal());
  // #endregion

  // #region Protected properties
  protected readonly isView = this.contextService.isView;
  protected readonly formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translateService.t('global.title.label'),
        placeholder: this.translateService.t(
          'grade_management.report_card_title.title',
        ),
        formControlName: 'title',
        type: 'input',
        required: true,
      },
      {
        label: this.translateService.t('global.school.title'),
        placeholder: this.translateService.t('global.select_school.dropdown'),
        type: 'school-structure',
        formControlName: 'schoolIds',
        required: true,
        isMultiple: false,
        schoolStructureControlConfig: {
          depth: StructureDepth.SCHOOL,
          allowedSelections: ['school'],
        },
      },
      {
        label: this.translateService.t('global.level.title'),
        placeholder: this.translateService.t('global.select_level.dropdown'),
        formControlName: 'levelIds',
        type: 'searchable-select',
        required: true,
        selectValues: this.levelSelectValues(),
        isMultiple: true,
      },
      {
        label: this.translateService.t('global.academic_year.title'),
        placeholder: this.translateService.t('global.select_academic_year.btn'),
        formControlName: 'academicYearId',
        type: 'searchable-select',
        required: true,
        selectValues: this.academicYearDropdown(),
      },
      {
        label: this.translateService.t('global.semester.title'),
        placeholder: this.translateService.t('global.select_semester.btn'),
        formControlName: 'semesterId',
        type: 'searchable-select',
        required: false,
        selectValues: this.semesters(),
      },
      {
        label: this.translateService.t(
          'grade_management.start_date_teacher.label',
        ),
        placeholder: this.translateService.t(
          'global.select_start_date.placeholder',
        ),
        formControlName: 'startDate',
        type: 'date',
        required: true,
      },
      {
        label: this.translateService.t(
          'grade_management.end_date_teacher.label',
        ),
        placeholder: this.translateService.t(
          'global.select_end_date.placeholder',
        ),
        formControlName: 'endDate',
        type: 'date',
        datePickerConfig: {
          min: this.endDateMin(),
        },
        required: true,
      },
    ];
  });

  protected viewReportCard = computed<ViewReportCardTitleValue[]>(() => {
    const detail = this.reportCard();
    return [
      {
        title: this.translateService.t('global.title.label'),
        value: detail?.title,
      },
      {
        title: this.translateService.t('global.school.title'),
        value: detail?.displaySchool,
      },
      {
        title: this.translateService.t('global.level.title'),
        value: detail?.levels.map((level) => level.displayName).join(', '),
      },
      {
        title: this.translateService.t('global.academic_year.title'),
        value: detail?.academicYear.name,
      },
      {
        title: this.translateService.t('global.semester.title'),
        value: detail?.semester?.name,
      },
      {
        title: this.translateService.t('global.start_date.label'),
        value: this.datePipe.transform(detail?.startDate),
      },
      {
        title: this.translateService.t('global.end_date.title'),
        value: this.datePipe.transform(detail?.endDate),
      },
    ];
  });
  // #endregion

  // #region Private properties
  private readonly levelSelectValues = signal<ISelectValue[]>([]);
  private readonly semesters = signal<Idropdown[]>([]);
  // #endregion
  constructor() {}

  // #region Angular methods
  ngOnInit(): void {
    this.getAcademicYears();
    this.subscribeToSchoolSelection();
    this.subscribeToAcademicYearSelection();

    this.form()
      .get('academicYearId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form().get('semesterId')?.setValue(null);
      });

    this.form()
      .get('startDate')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date: Date) => {
        const tuiDay = TuiDay.fromLocalNativeDate(new Date(date));
        this.endDateMin.set(tuiDay.append({ day: 1 }));
      });
  }
  // #endregion

  // #region Private methods
  private getAcademicYears() {
    return this.academicYearApiService.getAllAcademicYears(false).subscribe({
      next: (data) => {
        const dropdownOptions = data.data.map((ay) => ({
          value: ay.id,
          displayedValue: `${ay.name} `,
        }));
        this.academicYearDropdown.set(dropdownOptions);
      },
    });
  }

  private subscribeToSchoolSelection(): void {
    const schoolControl = this.form().get('schoolIds');
    if (!schoolControl) return;

    schoolControl.valueChanges.subscribe((selectedSchools: any[]) => {
      this.form().get('levelIds')?.setValue([]);
      if (!selectedSchools || !selectedSchools.length) {
        // Clear level values if no schools are selected
        this.levelSelectValues.set([]);
        return;
      }
      // Map selected schools to their IDs
      const schoolIds = selectedSchools.map((school) => school.id);
      // Retrieve levels directly from the school structure by passing schoolIds
      const levels =
        this.schoolStructureScopeService.getLevelsBySchoolIds(schoolIds);

      // Reduce the levels array to unique level options (based on level.id)
      const uniqueLevelOptions = levels.reduce((acc, level) => {
        if (!acc.some((option) => option.value === level.id)) {
          acc.push({
            value: level.id,
            displayedValue: level.name,
          });
        }
        return acc;
      }, [] as ISelectValue[]);

      this.levelSelectValues.set(uniqueLevelOptions);
    });
  }

  private subscribeToAcademicYearSelection(): void {
    const form = this.form();
    // Subscribe to the academicYearId value changes
    form
      .get('academicYearId')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        map((id) => {
          if (!id) return [];
          const getSemestersByAcademicYearId =
            this.academicYearScopeService.createSemestersByAcademicYearId();
          return toDropdown(getSemestersByAcademicYearId(id));
        }),
      )
      .subscribe((semesters) => {
        this.semesters.set(semesters);
      });
  }
  // #endregion
}

export interface ViewReportCardTitleValue {
  title: string;
  value?: string | number | null;
}
