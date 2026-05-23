import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { SelectColumnControlComponent } from '../../../column-selection-control/select-column-control.component';
import {
  ReportCardCalculatedFunctionEnum,
  ReportCardHorizontalFunctionEnum,
} from '@pages/report-card/configuration/data-access/report-card-configuration.enum';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Idropdown } from '@shared/interfaces';
import {
  ReportCardColumnDetailDTO,
  ReportCardColumnFormPayload,
  ReportCardHorizontalFormPayload,
  SubjectWithMaxMarks,
} from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { ObjId } from '@shared/interfaces/common.interface';
import { toDropdown } from '@shared/utils/to-dropdown';
import { NgClass } from '@angular/common';
import {
  ReportCardColumnFormBase,
  ReportCardHorizontalRestPayload,
} from '../report-card-column-form-base.interface';
import { toBoolean } from '@shared/utils/to-boolean.util';
import { TranslocoDirective } from '@jsverse/transloco';
import { ReportCardDetail } from '@pages/report-card/configuration/data-access/report-card-configuration.interface';

@Component({
  selector: 'app-horizental-calculated-form',
  templateUrl: './horizental-calculated-form.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    SelectColumnControlComponent,
    NgClass,
    TranslocoDirective,
  ],
})
export class HorizentalCalculatedFormComponent
  implements OnInit, OnDestroy, ReportCardColumnFormBase
{
  // #region Inputs
  parentForm = input.required<FormGroup>();
  subjectList = input.required<Idropdown[]>();
  reportCard = input.required<ReportCardDetail>();
  currentColumn = input<ReportCardColumnDetailDTO | null>(null);
  // #endregion
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translateService = inject(HesTranslateService);
  private readonly destroyRef$ = inject(DestroyRef);

  constructor() {}

  ngOnInit() {
    this.parentForm().addControl('horizontalColumn', this.form);
    this.listenForValidator();
    this.form.controls.additionalSettings.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((additionalSettings) => {
        const isCalculatePercentage = additionalSettings?.includes(
          ADDITIONAL_SETTING_KEYS.IS_CALCULATE_PERCENTAGE,
        );
        if (isCalculatePercentage) {
          this.form.controls.sumAggregate.setValue('true');
          this.form.controls.sumAggregate.disable();
        } else {
          this.form.controls.sumAggregate.enable();
        }
      });
  }

  protected isMultipeSelectedColumn = signal<boolean>(true);
  protected readonly form = this.fb.group({
    functionType: this.fb.control<ReportCardHorizontalFunctionEnum | null>(
      ReportCardHorizontalFunctionEnum.SUM,
      Validators.required,
    ),
    selectedColumns: this.fb.control<ObjId[] | ObjId>([], Validators.required),
    subjectIds: this.fb.control<ObjId[]>([], Validators.required),
    sumAggregate: this.fb.control<string | null>(null),
    scaleTo: this.fb.control<number | null>(null),
    additionalSettings: this.fb.control<ObjId[]>([]),
  });

  // Assume we have a signal for the function control value:
  protected readonly functionValueSignal = toSignal(
    this.form.controls.functionType!.valueChanges,
    { initialValue: this.form.get('functionType')!.value },
  );

  protected isCreatedHoursFunction = computed(
    () =>
      this.functionValueSignal() ===
      ReportCardHorizontalFunctionEnum.CREDIT_HOUR,
  );

  protected readonly formConfig = computed<IControl[]>(() => {
    const controls: IControl[] = [
      {
        label: this.translateService.t('grade_management.function.title'),
        formControlName: 'functionType',
        type: 'searchable-select',
        isMultiple: false,
        selectValues: [
          {
            displayedValue: this.translateService.t(
              'grade_management.sum.dropdown',
            ),
            value: ReportCardHorizontalFunctionEnum.SUM,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.average.dropdown',
            ),
            value: ReportCardHorizontalFunctionEnum.AVERAGE,
          },
          {
            displayedValue: this.translateService.t(
              'function_settings.selection_section.letter_grade_option',
            ),
            value: ReportCardHorizontalFunctionEnum.LETTER_GRADE,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.scale.dropdown',
            ),
            value: ReportCardHorizontalFunctionEnum.SCALE,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.numeric_grade.dropdown',
            ),
            value: ReportCardHorizontalFunctionEnum.NUMERIC_GRADE,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.credit_hours.dropdown',
            ),
            value: ReportCardHorizontalFunctionEnum.CREDIT_HOUR,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.grade_point.dropdown',
            ),
            value: ReportCardHorizontalFunctionEnum.GRADE_POINT,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.numeric_grade_average.dropdown',
            ),
            value: ReportCardHorizontalFunctionEnum.NUMERIC_GRADE_AVERAGE,
          },
        ],
        required: true,
      },
    ];

    const currentFunction = this.functionValueSignal();
    if (currentFunction && ALLOW_SCALE_TO_FUNCTION.includes(currentFunction)) {
      controls.push({
        label: this.translateService.t('Scale to'),
        placeholder: this.translateService.t('Add value to scale'),
        formControlName: 'scaleTo',
        type: 'input',
        required: true,
        inputType: 'number',
      });
    }

    if (
      currentFunction &&
      ALLOW_SUM_AGGREGATE_FUNCTION.includes(currentFunction)
    ) {
      controls.push(
        this.getRadioControl(
          'sumAggregate',
          this.translateService.t('grade_management.aggregate.title'),
        ),
      );
    }

    return controls;
  });

  protected readonly subjectsConfig = computed<IControl>(() => ({
    label: this.translateService.t(
      'grade_management.applicable_subjects.title',
    ),
    formControlName: 'subjectIds',
    type: 'checkbox',
    allowSelectAll: true,
    selectValues: this.subjectList(),
    required: true,
  }));
  protected readonly columnsList = computed(() => {
    const columns = [
      ...(this.reportCard()?.columns ?? []),
      ...(this.reportCard()?.existingColumns ?? []),
    ];
    const currentFunction = this.functionValueSignal();

    if (!columns || !currentFunction) return [];

    const exclusions = functionExclusions[currentFunction];
    const currentColumnId = this.currentColumn()?.id;

    const filteredColumns = columns.filter((col) => {
      if (col.id === currentColumnId) return false;
      const colFunctionType =
        'functionType' in col ? col.functionType : undefined;
      if (colFunctionType) {
        return !exclusions.includes(colFunctionType);
      }
      return true;
    });

    return toDropdown(filteredColumns, 'title');
  });

  additionalSettingsConfig = computed<Idropdown[]>(() => {
    const currentFunction = this.functionValueSignal();
    if (
      currentFunction &&
      ALLOW_GPA_PERCENTAGE_FUNCTION.includes(currentFunction)
    ) {
      return [
        {
          displayedValue: this.translateService.t(
            'grade_management.percentage.txt',
          ),
          value: ADDITIONAL_SETTING_KEYS.IS_CALCULATE_PERCENTAGE,
        },
        {
          displayedValue: this.translateService.t(
            'grade_management.calculate_gpa.txt',
          ),
          value: ADDITIONAL_SETTING_KEYS.IS_CALCULATE_GPA,
        },
      ];
    }
    return [];
  });

  columnSelection = new FormControl('assignment');
  patchForm(value: ReportCardColumnFormPayload) {
    let {
      sumAggregate,
      isCalculatePercentage,
      isCalculateGpa,
      subjectIds,
      subjects,
      ...rest
    } = value as ReportCardHorizontalFormPayload;

    const additionalSettings = [];
    if (isCalculatePercentage) {
      additionalSettings.push(ADDITIONAL_SETTING_KEYS.IS_CALCULATE_PERCENTAGE);
    }
    if (isCalculateGpa) {
      additionalSettings.push(ADDITIONAL_SETTING_KEYS.IS_CALCULATE_GPA);
    }

    // API returns 'subjects', but form uses 'subjectIds'
    const subjectsArray = subjects || subjectIds || [];

    const transformedSubjectIds = subjectsArray.map((subject) =>
      typeof subject === 'object' && subject !== null && 'id' in subject
        ? subject.id
        : subject,
    );

    this.form.patchValue({
      ...rest,
      sumAggregate: sumAggregate?.toString() ?? null,
      additionalSettings,
      subjectIds: transformedSubjectIds,
    });
  }

  getRestPayload(): ReportCardHorizontalRestPayload {
    const {
      functionType,
      sumAggregate,
      additionalSettings,
      selectedColumns,
      subjectIds,
      scaleTo,
    } = this.form.getRawValue();
    const selectedColumnsId = Array.isArray(selectedColumns)
      ? selectedColumns
      : !!selectedColumns
        ? [selectedColumns]
        : [];

    const existingSelectedColumnIds =
      this.getExistingSelectedColumnIds(selectedColumnsId);

    const isCalculatePercentage = additionalSettings?.includes(
      ADDITIONAL_SETTING_KEYS.IS_CALCULATE_PERCENTAGE,
    );

    const isCalculateGpa = additionalSettings?.includes(
      ADDITIONAL_SETTING_KEYS.IS_CALCULATE_GPA,
    );

    // Get other column IDs (not in exexistingSelectedColumnIds)
    const otherColumnIds = selectedColumnsId.filter(
      (id) => !existingSelectedColumnIds.includes(id),
    );

    const transformedSubjects: SubjectWithMaxMarks[] = (subjectIds ?? []).map(
      (subjectId) => ({ id: subjectId }),
    );

    const payload: ReportCardHorizontalRestPayload = {
      functionType: functionType!,
      sumAggregate: sumAggregate != null ? toBoolean(sumAggregate) : null,
      ...(otherColumnIds.length && { selectedColumns: otherColumnIds }),
      subjects: transformedSubjects,
      scaleTo: scaleTo ?? null,
      ...(existingSelectedColumnIds.length && { existingSelectedColumnIds }),
      isCalculatePercentage,
      isCalculateGpa,
    };

    return payload;
  }

  private getExistingSelectedColumnIds(selectedIds: ObjId[]) {
    return (
      selectedIds.filter((id) =>
        this.reportCard().existingColumns?.some((col) => col.id === id),
      ) ?? []
    );
  }

  ngOnDestroy(): void {
    this.parentForm().removeControl('horizontalColumn');
  }

  private getRadioControl(formControlName: string, label: string): IControl {
    return {
      label,
      type: 'radio',
      formControlName,
      required: false,
      selectValues: [
        {
          displayedValue: this.translateService.globalTObj.yes,
          value: 'true',
        },
        {
          displayedValue: this.translateService.globalTObj.no,
          value: 'false',
        },
      ],
    };
  }

  private listenForValidator() {
    this.form.controls.functionType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((functionType) => {
        this.resetSumAggregate();
        this.resetAdditionalSettings();
        if (functionType) {
          this.isMultipeSelectedColumn.set(
            isMultipleSelectColumn(functionType),
          );
        }

        const { subjectIds, selectedColumns } = this.form.controls;
        if (functionType === ReportCardHorizontalFunctionEnum.CREDIT_HOUR) {
          subjectIds.clearValidators();
          selectedColumns.clearValidators();
        } else {
          subjectIds.setValidators(Validators.required);
          selectedColumns.setValidators(Validators.required);
        }
        subjectIds.updateValueAndValidity();
        selectedColumns.updateValueAndValidity();
      });
  }

  private resetSumAggregate() {
    this.form.controls.sumAggregate.enable();
    this.form.controls.sumAggregate.setValue(null);
  }

  private resetAdditionalSettings() {
    this.form.controls.additionalSettings.setValue([]);
  }
}

const ALLOW_SUM_AGGREGATE_FUNCTION = [
  ReportCardHorizontalFunctionEnum.SUM,
  ReportCardHorizontalFunctionEnum.AVERAGE,
  ReportCardHorizontalFunctionEnum.SCALE,
  ReportCardHorizontalFunctionEnum.NUMERIC_GRADE,
];

const ALLOW_SCALE_TO_FUNCTION = [ReportCardHorizontalFunctionEnum.SCALE];

const ALLOW_GPA_PERCENTAGE_FUNCTION = [
  ReportCardHorizontalFunctionEnum.SUM,
  ReportCardHorizontalFunctionEnum.AVERAGE,
  ReportCardHorizontalFunctionEnum.SCALE,
];

function isMultipleSelectColumn(value: ReportCardHorizontalFunctionEnum) {
  return [
    ReportCardHorizontalFunctionEnum.SUM,
    ReportCardHorizontalFunctionEnum.AVERAGE,
  ].includes(value);
}

const commonExcludeType = [
  ReportCardHorizontalFunctionEnum.GRADE_POINT,
  ReportCardHorizontalFunctionEnum.NUMERIC_GRADE,
  ReportCardHorizontalFunctionEnum.NUMERIC_GRADE_AVERAGE,
  ReportCardHorizontalFunctionEnum.LETTER_GRADE,
  ReportCardHorizontalFunctionEnum.CREDIT_HOUR,
];
const functionExclusions: Record<
  ReportCardHorizontalFunctionEnum,
  (ReportCardHorizontalFunctionEnum | ReportCardCalculatedFunctionEnum)[]
> = {
  [ReportCardHorizontalFunctionEnum.NUMERIC_GRADE_AVERAGE]: [
    ...commonExcludeType,
  ],
  [ReportCardHorizontalFunctionEnum.GRADE_POINT]: [...commonExcludeType],
  [ReportCardHorizontalFunctionEnum.CREDIT_HOUR]: [],
  [ReportCardHorizontalFunctionEnum.NUMERIC_GRADE]: [...commonExcludeType],
  [ReportCardHorizontalFunctionEnum.SCALE]: [...commonExcludeType],
  [ReportCardHorizontalFunctionEnum.LETTER_GRADE]: [...commonExcludeType],
  [ReportCardHorizontalFunctionEnum.AVERAGE]: [...commonExcludeType],
  [ReportCardHorizontalFunctionEnum.SUM]: [...commonExcludeType],
};

export const ADDITIONAL_SETTING_KEYS = {
  IS_CALCULATE_PERCENTAGE: 'isCalculatePercentage',
  IS_CALCULATE_GPA: 'isCalculateGpa',
} as const;
