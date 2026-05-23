import {
  Component,
  DestroyRef,
  isSignal,
  OnInit,
  Signal,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  model,
  signal,
} from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { localizedPairValidator } from '@shared/form-validators/description-pair.validator';
import { NgClass, NgStyle, NgIf } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DsInputComponent } from '@ds/input/input.component';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';
import { DsSelectComponent } from '@ds/select/select.component';
import { DsSelectConfig, DsSelectOption } from '@ds/select/select.interface';
import { DsRadioGroupComponent } from '@ds/radio-button/radio-group/radio-group.component';
import { DsRadioComponent } from '@ds/radio-button/radio/radio.component';
import { DsCheckboxGroupComponent } from '@ds/checkbox-group/checkbox-group.component';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import { DsSwitchComponent } from '@ds/switch/switch.component';
import {
  DsChipSelectorComponent,
  ChipSelectorOption,
} from '@ds/chip-selector/chip-selector.component';
import { HesAttachmentFormControlComponent } from '@ui-kit/hes-attachment-form-control/hes-attachment-form-control.component';
import { HesEditorComponent } from '@ui-kit/hes-editor/hes-editor.component';
import { isMobile } from '@shared/utils/platform';
import { ObjId } from '@shared/interfaces/common.interface';
import { DsSchoolStructureControlComponent } from '../../../design-system/school-structure-control/ds-school-structure-control.component';
import { DsIconChooserComponent } from '@ds/icon-chooser/icon-chooser.component';
import { TuiInputDateModule, TuiInputDateRangeModule } from '@taiga-ui/kit';
import {
  TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
  TuiLabelModule,
  TuiTextfieldControllerModule,
  TuiDialogModule,
} from '@taiga-ui/core';
import { TuiMobileCalendarDialogModule } from '@taiga-ui/addon-mobile';
import { HesTranslateService } from '@shared/services/hes-translate.service';

import {
  DsFormControl,
  DsSelectValue,
  DsInputControl,
  DsTextareaControl,
  DsSearchableSelectControl,
  DsRadioControl,
  DsCheckboxControl,
  DsSwitchControl,
  DsChipSelectorControl,
  DsFileControl,
  DsEditorControl,
  DsIconChooserControl,
  DsPickerSelectControl,
} from './ds-form-control-generator.model';
import {
  DsPickerSelectComponent,
  DsPickerSelectConfig,
} from '@ds/picker-select';

@Component({
  selector: 'app-ds-form-control-generator',
  templateUrl: './ds-form-control-generator.component.html',
  styleUrl: './ds-form-control-generator.component.scss',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TranslocoDirective,
    NgClass,
    NgStyle,
    NgIf,
    DsInputComponent,
    DsTextareaComponent,
    DsSelectComponent,
    DsRadioGroupComponent,
    DsRadioComponent,
    DsCheckboxGroupComponent,
    DsCheckboxComponent,
    DsSwitchComponent,
    DsChipSelectorComponent,
    HesAttachmentFormControlComponent,
    HesEditorComponent,
    DsSchoolStructureControlComponent,
    DsIconChooserComponent,
    // Taiga UI date components
    TuiInputDateModule,
    TuiLabelModule,
    TuiTextfieldControllerModule,
    TuiDialogModule,
    TuiMobileCalendarDialogModule,
    TuiInputDateRangeModule,
    DsPickerSelectComponent,
  ],
  providers: [
    {
      provide: TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
      useValue: { appearance: 'hes-textfield' },
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class DsFormControlGeneratorComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly t = inject(HesTranslateService);

  form!: FormGroup;
  ErrorText = signal<string | undefined>(undefined);
  noOfChild = signal(isMobile() ? 2 : 3);

  readonly control = model.required<DsFormControl>();

  // Local search control for searchable-checkbox-select
  searchControl = new FormControl<string>('');
  searchTerm = signal<string>('');

  // Filtered options for searchable-checkbox-select
  filteredSearchableCheckboxOptions = computed(() => {
    const ctrl = this.searchableCheckboxSelectControl();
    if (!ctrl) return [];
    const term = (this.searchTerm() || '').toLowerCase().trim();
    const values = ctrl.selectValues ?? [];
    if (!term) return values;
    return values.filter((v: DsSelectValue) =>
      (v?.displayedValue || '').toLowerCase().includes(term),
    );
  });

  dsSelectOptions = computed<DsSelectOption[]>(() => {
    const control = this.control();
    if (control.type !== 'searchable-select') {
      return [];
    }

    const mergedValues: Array<DsSelectValue> = [
      ...(control.initSelectValues ?? []),
      ...(control.selectValues ?? []),
    ];

    const uniqueOptions = new Map<ObjId, DsSelectOption>();

    mergedValues.forEach((item) => {
      if (!item) {
        return;
      }

      const value = item.value as ObjId;
      if (uniqueOptions.has(value)) {
        return;
      }

      uniqueOptions.set(value, {
        id: value,
        display: item.displayedValue,
        disabled: item.disabled,
      });
    });

    return Array.from(uniqueOptions.values());
  });

  // Helper to resolve required value (supports both boolean and Signal<boolean>)
  resolvedRequired = computed(() => {
    const req = this.control().required;
    if (req === undefined || req === null) return false;
    return isSignal(req) ? req() : req;
  });

  dsSelectConfig = computed<DsSelectConfig | null>(() => {
    const control = this.control();
    if (control.type !== 'searchable-select') {
      return null;
    }

    const isMultiple = control.isMultiple ?? false;
    const baseConfig: DsSelectConfig = {
      label: control.label,
      placeholder: control.placeholder,
      isMultiple,
      chips: isMultiple, // only show chips for multi-select; single-select shows value in the input field
      options: this.dsSelectOptions(),
      required: this.resolvedRequired(),
    };

    if (control.dsSelectConfig) {
      return {
        ...baseConfig,
        ...control.dsSelectConfig,
        options: control.dsSelectConfig.options ?? baseConfig.options,
      };
    }

    return baseConfig;
  });

  inputControl = computed(() =>
    this.control().type === 'input' ? (this.control() as DsInputControl) : null,
  );
  textareaControl = computed(() =>
    this.control().type === 'textarea'
      ? (this.control() as DsTextareaControl)
      : null,
  );
  searchableSelectControl = computed(() =>
    this.control().type === 'searchable-select'
      ? (this.control() as DsSearchableSelectControl)
      : null,
  );
  radioControl = computed(() =>
    this.control().type === 'radio' ? (this.control() as DsRadioControl) : null,
  );
  checkboxControl = computed(() =>
    this.control().type === 'checkbox'
      ? (this.control() as DsCheckboxControl)
      : null,
  );
  switchControl = computed(() =>
    this.control().type === 'switch'
      ? (this.control() as DsSwitchControl)
      : null,
  );
  chipSelectorControl = computed(() =>
    this.control().type === 'chip-selector'
      ? (this.control() as DsChipSelectorControl)
      : null,
  );

  // Computed: map DsSelectValue[] to ChipSelectorOption[] for chip-selector
  chipSelectorOptions = computed<ChipSelectorOption[]>(() => {
    const ctrl = this.chipSelectorControl();
    if (!ctrl) return [];

    return (ctrl.selectValues ?? []).map((v) => ({
      value: v.value,
      displayedValue: v.displayedValue,
      icon: v.icon?.name, // Map from DsSelectValueIcon to DsIcon
      disabled: v.disabled,
    }));
  });

  fileControl = computed(() =>
    this.control().type === 'file' ? (this.control() as DsFileControl) : null,
  );
  editorControl = computed(() =>
    this.control().type === 'editor'
      ? (this.control() as DsEditorControl)
      : null,
  );
  schoolStructureControl = computed(() =>
    this.control().type === 'school-structure' ? (this.control() as any) : null,
  );
  constTimePickerControl = computed(() =>
    this.control().type === 'time-picker' ? (this.control() as any) : null,
  );
  // New getters
  dateControl = computed(() =>
    this.control().type === 'date' ? (this.control() as any) : null,
  );
  dateRangeControl = computed(() =>
    this.control().type === 'date-range' ? (this.control() as any) : null,
  );
  searchableCheckboxSelectControl = computed(() =>
    this.control().type === 'searchable-checkbox-select'
      ? (this.control() as any)
      : null,
  );
  iconChooserControl = computed(() =>
    this.control().type === 'icon-chooser'
      ? (this.control() as DsIconChooserControl)
      : null,
  );
  pickerSelectControl = computed(() =>
    this.control().type === 'picker-select'
      ? (this.control() as DsPickerSelectControl)
      : null,
  );

  // Computed config for picker-select
  pickerSelectConfig = computed<DsPickerSelectConfig | null>(() => {
    const ctrl = this.pickerSelectControl();
    if (!ctrl) return null;

    return {
      options: (ctrl.selectValues ?? []).map((v) => ({
        id: v.value,
        display: v.displayedValue,
        disabled: v.disabled,
      })),
      label: ctrl.label,
      placeholder: ctrl.placeholder,
      isMultiple: ctrl.isMultiple ?? true,
      required: this.resolvedRequired(),
      disabled: ctrl.disabled ?? false,
      itemLabel: ctrl.itemLabel,
      selectButtonText: ctrl.selectButtonText,
    };
  });

  constructor(public controlContainer: ControlContainer) {
    effect(() => {
      const currentControl = this.formControl;
      const config = this.control();

      // Disable the control if:
      // 1. The disabled property is explicitly set to true, OR
      // 2. The readonly property is true for searchable-select or switch types
      const shouldDisable =
        !!config?.disabled ||
        (!!config?.readonly &&
          (config?.type === 'searchable-select' || config?.type === 'switch'));

      if (!currentControl) {
        return;
      }

      if (shouldDisable && !currentControl.disabled) {
        currentControl.disable({ emitEvent: false });
      }

      if (!shouldDisable && currentControl.disabled) {
        currentControl.enable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.form = this.controlContainer.control as FormGroup;
    this.setupLocalizedPairValidation();
    this.registerControlSubscriptions();
    // subscribe to local search control
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.searchTerm.set(val ?? ''));
  }

  /**
   * Sets up localized pair validation if the control has a localizedPair config.
   * This adds the validator to the form and subscribes to form value changes.
   */
  private setupLocalizedPairValidation(): void {
    const config = this.control();
    if (!config.localizedPair || !config.formControlName) return;

    const thisControlName = config.formControlName;
    const pairedControlName = config.localizedPair;

    // Create a unique key for this pair (sorted to ensure same key regardless of which control is processed first)
    const pairKey = [thisControlName, pairedControlName].sort().join('_');

    // Use a static map to track which pairs have been processed
    const processedPairs =
      (this.form as any).__localizedPairs ||
      ((this.form as any).__localizedPairs = new Set<string>());

    // Only add validator once per pair
    if (!processedPairs.has(pairKey)) {
      processedPairs.add(pairKey);

      // Determine which is English and which is Arabic based on control name prefix
      const enControlName = thisControlName.startsWith('en')
        ? thisControlName
        : pairedControlName;
      const arControlName = thisControlName.startsWith('ar')
        ? thisControlName
        : pairedControlName;

      // Add the validator to the form
      const existingValidators = this.form.validator;
      const newValidator = localizedPairValidator(enControlName, arControlName);

      if (existingValidators) {
        this.form.setValidators([existingValidators, newValidator]);
      } else {
        this.form.setValidators(newValidator);
      }
      this.form.updateValueAndValidity();
    }

    // Subscribe to form value changes for this control
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateErrorText();
      });
  }

  private registerControlSubscriptions(): void {
    const control = this.formControl;
    if (!control) {
      this.ErrorText.set(undefined);
      return;
    }

    this.updateErrorText();

    control.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateErrorText();
      });

    // Listen to form value changes for cross-field validation
    // This ensures errors update when sibling controls change
    if (this.control().formLevelErrors) {
      this.form.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.updateErrorText();
        });
    }

    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.control().onValueChange?.(value, control);
      });
  }

  private updateErrorText(): void {
    const control = this.formControl;
    const config = this.control();

    // First check control-level errors
    if (control?.errors) {
      const firstKey = Object.keys(control.errors)[0];
      if (firstKey && config.errorMessage?.[firstKey]) {
        this.ErrorText.set(config.errorMessage[firstKey]);
        return;
      }
    }

    // Then check form-level errors (cross-field validation)
    if (config.formLevelErrors && this.form?.errors) {
      for (const errorKey of Object.keys(config.formLevelErrors)) {
        if (this.form.hasError(errorKey)) {
          this.ErrorText.set(config.formLevelErrors[errorKey]);
          return;
        }
      }
    }

    // Check for localized pair validation errors (auto-generated)
    if (config.localizedPair && config.formControlName && this.form?.errors) {
      const thisControlName = config.formControlName;
      const errorKey = `${thisControlName}Required`;

      if (this.form.hasError(errorKey)) {
        // Generate error message based on the paired control
        const isArabic = thisControlName.startsWith('ar');
        const errorMessage = isArabic
          ? this.t.t('support.form.validation.arabic_required_with_english')
          : this.t.t('support.form.validation.english_required_with_arabic');
        this.ErrorText.set(errorMessage);
        return;
      }
    }

    this.ErrorText.set(undefined);
  }

  private get formControlName(): string | null {
    return this.control().formControlName ?? null;
  }

  get formControl(): FormControl | null {
    const controlName = this.formControlName;
    if (!controlName || !this.form) {
      return null;
    }

    return this.form.controls[controlName] as FormControl;
  }
}
