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
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormControlGeneratorComponent,
  ICheckboxWithInputValue,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { Idropdown } from '@shared/interfaces';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import {
  ReportCardCalculatedRestPayload,
  ReportCardColumnFormBase,
  ReportCardHorizontalRestPayload,
  ReportCardSignalEntryRestPayload,
} from '../report-card-column-form-base.interface';
import {
  ReportCardColumnFormPayload,
  ReportCardSignalEntryFormPayload,
  SubjectWithMaxMarks,
} from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { toNumberOrNull } from '@shared/utils/to-number-or-null.util';

@Component({
  selector: 'app-single-entry-form',
  templateUrl: './single-entry-form.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormControlGeneratorComponent],
})
export class SingleEntryFormComponent
  implements OnInit, OnDestroy, ReportCardColumnFormBase
{
  // #region Inputs
  parentForm = input.required<FormGroup>();
  subjectList = input.required<Idropdown[]>();
  // #endregion
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translateService = inject(HesTranslateService);
  constructor() {}

  ngOnDestroy(): void {
    this.parentForm().removeControl('signalEntryColumn');
  }

  ngOnInit() {
    this.parentForm().addControl('signalEntryColumn', this.form);
  }

  protected readonly form = this.fb.group({
    maxMarks: this.fb.control<number | null>(null, Validators.required),
    subjectIds: this.fb.control<ICheckboxWithInputValue[]>(
      [],
      Validators.required,
    ),
  });

  protected readonly formConfig = computed<IControl[]>(() => {
    return [
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
    const signalEntryValue = value as ReportCardSignalEntryFormPayload;

    // API returns 'subjects', but form uses 'subjectIds'
    const subjectsArray =
      signalEntryValue.subjects || signalEntryValue.subjectIds || [];

    // Transform SubjectWithMaxMarks[] to ICheckboxWithInputValue[]
    const transformedSubjectIds: ICheckboxWithInputValue[] = subjectsArray.map(
      (subject) => ({
        id: subject.id,
        inputValue: subject.maxMarks?.toString() || '',
      }),
    );

    this.form.patchValue({
      ...signalEntryValue,
      subjectIds: transformedSubjectIds,
    });
  }

  getRestPayload(): ReportCardSignalEntryRestPayload {
    const { maxMarks, subjectIds } = this.form.value;

    // Transform ICheckboxWithInputValue[] to SubjectWithMaxMarks[]
    const transformedSubjects: SubjectWithMaxMarks[] = (subjectIds ?? []).map(
      (subject) => {
        const maxMarks = toNumberOrNull(subject.inputValue);
        return maxMarks !== null
          ? { id: subject.id, maxMarks }
          : { id: subject.id };
      },
    );

    return { maxMarks, subjects: transformedSubjects };
  }
}
