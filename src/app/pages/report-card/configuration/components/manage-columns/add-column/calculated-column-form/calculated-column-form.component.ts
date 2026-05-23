import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ReportCardCalculatedFunctionEnum } from '@pages/report-card/configuration/data-access/report-card-configuration.enum';
import {
  FormControlGeneratorComponent,
  ICheckboxWithInputValue,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import {
  ReportCardColumnFormBase,
  ReportCardCalculatedRestPayload,
} from '../report-card-column-form-base.interface';
import {
  ReportCardCalculatedFormPayload,
  ReportCardColumnFormPayload,
  SubjectWithMaxMarks,
} from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { Idropdown } from '@shared/interfaces';
import { toNumberOrNull } from '@shared/utils/to-number-or-null.util';

@Component({
  selector: 'app-calculated-column-form',
  templateUrl: './calculated-column-form.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormControlGeneratorComponent],
})
export class CalculatedColumnFormComponent
  implements OnInit, OnDestroy, ReportCardColumnFormBase
{
  // #region Inputs
  parentForm = input.required<FormGroup>();
  subjectList = input.required<ISelectValue[]>();
  // #endregion
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translateService = inject(HesTranslateService);

  constructor() {}

  ngOnInit() {
    this.parentForm().addControl('calculatedColumn', this.form);
  }

  protected readonly form = this.fb.group(
    {
      functionType: this.fb.control<ReportCardCalculatedFunctionEnum | null>(
        null,
        Validators.required,
      ),
      maxMarks: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(1),
      ]),
      minEntries: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(1),
      ]),
      maxEntries: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(1),
      ]),
      subjectIds: this.fb.control<ICheckboxWithInputValue[]>(
        [],
        Validators.required,
      ),
    },
    {
      validators: maxMinEntriesValidator(),
    },
  );

  protected readonly formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translateService.t('grade_management.function.title'),
        formControlName: 'functionType',
        type: 'searchable-select',
        selectValues: [
          {
            displayedValue: this.translateService.t(
              'grade_management.sum.dropdown',
            ),
            value: ReportCardCalculatedFunctionEnum.SUM,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.average.dropdown',
            ),
            value: ReportCardCalculatedFunctionEnum.AVERAGE,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.weighted_average.dropdown',
            ),
            value: ReportCardCalculatedFunctionEnum.WEIGHTED_AVERAGE,
          },
        ],
        required: true,
      },
      {
        label: this.translateService.t('grade_management.max_mark.title'),
        placeholder: this.translateService.t(
          'grade_management.enter_max_mark.placeholder',
        ),
        formControlName: 'maxMarks',
        type: 'input',
        required: true,
        inputType: 'number',
      },
      {
        label: this.translateService.t('grade_management.min_entries.title'),
        placeholder: this.translateService.t(
          'grade_management.enter_min_entry.placeholder',
        ),
        formControlName: 'minEntries',
        type: 'input',
        required: true,
        inputType: 'number',
      },
      {
        label: this.translateService.t('grade_management.max_entries.title'),
        placeholder: this.translateService.t(
          'grade_management.enter_max_entry.placeholder',
        ),
        formControlName: 'maxEntries',
        type: 'input',
        required: true,
        inputType: 'number',
      },
      {
        label: this.translateService.t(
          'grade_management.applicable_subjects.title',
        ),
        formControlName: 'subjectIds',
        type: 'checkbox',
        selectValues: this.subjectList(),
        required: true,
        allowSelectAll: true,
        checkboxInputConfig: {
          placeholder: this.translateService.t(
            'grade_management.enter_max_mark.placeholder',
          ),
          inputType: 'number',
          maxLength: 10,
          required: false,
        },
      },
    ];
  });

  patchForm(value: ReportCardColumnFormPayload) {
    const calculatedValue = value as ReportCardCalculatedFormPayload;

    // API returns 'subjects', but form uses 'subjectIds'
    const subjectsArray =
      calculatedValue.subjects || calculatedValue.subjectIds || [];

    // Transform SubjectWithMaxMarks[] to ICheckboxWithInputValue[]
    const transformedSubjectIds: ICheckboxWithInputValue[] = subjectsArray.map(
      (subject) => ({
        id: subject.id,
        inputValue: subject.maxMarks?.toString() || '',
      }),
    );

    this.form.patchValue({
      ...calculatedValue,
      subjectIds: transformedSubjectIds,
    });
  }

  getRestPayload(): ReportCardCalculatedRestPayload {
    const form = this.form.value;

    // Transform ICheckboxWithInputValue[] to SubjectWithMaxMarks[]
    const transformedSubjects: SubjectWithMaxMarks[] = (
      form.subjectIds ?? []
    ).map((subject) => {
      const maxMarks = toNumberOrNull(subject.inputValue);
      return maxMarks !== null
        ? { id: subject.id, maxMarks }
        : { id: subject.id };
    });

    return {
      functionType: form.functionType!,
      maxMarks: toNumberOrNull(form.maxMarks),
      minEntries: toNumberOrNull(form.minEntries),
      maxEntries: toNumberOrNull(form.maxEntries),
      subjects: transformedSubjects,
    };
  }

  ngOnDestroy(): void {
    this.parentForm().removeControl('calculatedColumn');
  }
}

function maxMinEntriesValidator() {
  return (group: AbstractControl): { [key: string]: any } | null => {
    const minEntries = group.get('minEntries')?.value;
    const maxEntries = group.get('maxEntries')?.value;

    if (minEntries != null && maxEntries != null && +maxEntries < +minEntries) {
      return { maxLessThanMin: true };
    }
    return null;
  };
}
