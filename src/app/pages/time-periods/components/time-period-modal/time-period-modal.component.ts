import { Component, Input, computed, signal, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  FormBuilder,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { faClose } from '@fortawesome/pro-solid-svg-icons';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { Idropdown } from '@shared/interfaces';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { formatToHesDate } from '@shared/utils/date';
import { Subject, Subscription } from 'rxjs';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TimePeriodModalService } from '@pages/time-periods/utils/time-period-modal.service';
import { ITimePeriodQueryParams } from '@shared/dto-transformation/time-period/time-period.interface';
import { TimePeriodService } from '@pages/time-periods/data-access/time-periods.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { AcademicYearApiService } from '@pages/academic-year/data-access/academic-year-api.service';
import {
  AcademicYearDTO,
  AcademicYearsResponseDTO,
} from '@pages/academic-year/data-access/academic-year.dto';

@Component({
  selector: 'app-time-period-modal',
  templateUrl: './time-period-modal.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    HesButtonModule,
    CommonModule,
    FormControlGeneratorComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [SchoolStructureListingService],
})
export class TimePeriodModalComponent implements OnInit {
  faClose = faClose;
  currentLang: string = '';
  @Input() closeModal: () => void;
  @Input() onRefresh: Subject<void>;
  private academicYearDropdown = signal<Idropdown[]>([]);

  selectedSchoolStructureItem =
    this.schoolScopeService.selectedSchoolStructureItem;

  private readonly subscription = new Subscription();

  timePeriodForm = this.fb.group({
    company: this.fb.control<number | null>(
      this.schoolStructureListingService.selectedCompany()?.id ?? null,
      Validators.required,
    ),
    campus: this.fb.control<number | null>(
      this.schoolStructureListingService.selectedCampus()?.id ?? null,
      Validators.required,
    ),
    school: this.fb.control<number | null>(
      this.schoolStructureListingService.selectedSchool()?.id ?? null,
      Validators.required,
    ),
    level: this.fb.control<number | null>(null, Validators.required),
    class: this.fb.control<number | null>(null, Validators.required),
    academicYear: this.nonNullablefb.control(-1, Validators.required),
  });

  constructor(
    private fb: FormBuilder,
    private nonNullablefb: NonNullableFormBuilder,
    private translocoService: TranslocoService,
    private academicYearApiService: AcademicYearApiService,
    private schoolScopeService: SchoolStructureScopeService,
    private academicYearScope: AcademicYearsScopeService,
    private hesTranslationService: HesTranslateService,
    private schoolStructureListingService: SchoolStructureListingService,
    private timePeriodModalService: TimePeriodModalService,
    private timePeriodService: TimePeriodService,
    private hesToasterService: HesToasterService,
  ) {
    this.currentLang = this.translocoService.getActiveLang();
  }

  ngOnInit() {
    this.getAcademicYears();
  }

  getAcademicYears() {
    return this.academicYearApiService.getAllAcademicYears(false).subscribe({
      next: (data: AcademicYearsResponseDTO) => {
        const dropdownOptions = data.data.map((ay: AcademicYearDTO) => ({
          value: ay.id,
          displayedValue: `${ay.name} (${formatToHesDate(ay.startDate)} - ${formatToHesDate(ay.endDate)})`,
        }));
        this.academicYearDropdown.set(dropdownOptions);
        const defAcademicYear =
          this.academicYearScope.selectedAcademicYear()?.id;
        if (defAcademicYear) {
          this.timePeriodForm.get('academicYear')?.setValue(+defAcademicYear);
        }
      },
    });
  }

  timePeriodFormConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.hesTranslationService.t('global.company.title'),
        placeholder: this.hesTranslationService.t(
          'global.select_company.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'company',
        required: true,
        SchoolStructureListingType: 'company',
        readonly: true,
      },
      {
        label: this.hesTranslationService.t('global.campus.title'),
        placeholder: this.hesTranslationService.t(
          'global.select_campus.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'campus',
        required: true,
        SchoolStructureListingType: 'campus',
        readonly: true,
      },
      {
        label: this.hesTranslationService.t('global.school.title'),
        placeholder: this.hesTranslationService.t(
          'global.select_school.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'school',
        required: true,
        SchoolStructureListingType: 'school',
        readonly: true,
      },
      {
        label: this.hesTranslationService.t('global.level.title'),
        placeholder: this.hesTranslationService.t(
          'global.select_level.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'level',
        required: true,
        SchoolStructureListingType: 'level',
      },
      {
        label: this.hesTranslationService.t('global.class.title'),
        placeholder: this.hesTranslationService.t(
          'global.select_class.dropdown',
        ),
        type: 'searchable-select',
        formControlName: 'class',
        required: true,
        SchoolStructureListingType: 'class',
      },
      {
        label: this.hesTranslationService.t('global.academic_year.title'),
        placeholder: this.hesTranslationService.t(
          'global.select_academic_year.txt',
        ),
        type: 'searchable-select',
        formControlName: 'academicYear',
        selectValues: this.academicYearDropdown(),
        required: true,
      },
    ];
  });

  makeTimePeriodPayload() {
    const formValues = this.timePeriodForm.getRawValue();
    const payload = {
      schoolId: formValues.school,
      levelId: formValues.level,
      classId: formValues.class,
      academicYearId: formValues.academicYear,
    };
    return payload;
  }

  onProceedTimePeriod() {
    const formValues = this.timePeriodForm.getRawValue();
    if (
      formValues.school === null ||
      formValues.level === null ||
      formValues.class === null
    ) {
      return;
    }

    const payload: ITimePeriodQueryParams = {
      schoolId: formValues.school,
      levelId: formValues.level,
      classId: formValues.class,
      academicYearId: formValues.academicYear,
    };

    this.closeModal();
    this.timePeriodModalService.onAddPeriodDuration(payload);
  }
}
