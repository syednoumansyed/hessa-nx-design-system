import {
  Component,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  FormControl,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonCheckbox } from '@ionic/angular/standalone';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { HesCheckboxModule } from '@ui-kit/hes-checkbox/hes-checkbox.module';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ICheckboxWithInputValue,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';

interface CheckboxInputState {
  checkboxValue: ISelectValue['value'];
  isChecked: boolean;
  inputControl: FormControl<string | null>;
  isDisabled: boolean;
}

@Component({
  selector: 'app-hes-checkbox-with-input-group',
  templateUrl: './hes-checkbox-with-input-group.component.html',
  styleUrls: ['./hes-checkbox-with-input-group.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HessaInputComponent,
    ReactiveFormsModule,
    IonCheckbox,
    HesCheckboxModule,
    TranslocoDirective,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HesCheckboxWithInputGroupComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HesCheckboxWithInputGroupComponent),
      multi: true,
    },
  ],
})
export class HesCheckboxWithInputGroupComponent implements ControlValueAccessor {
  checkboxOptions = input<ISelectValue[]>([]);
  readonly = input(false);
  showSelectAll = input(false);
  inputPlaceholder = input<string | undefined>(undefined);
  inputType = input<'text' | 'number' | 'email' | 'tel'>('text');
  maxLength = input<number | undefined>(undefined);
  inputRequired = input(false);
  noOfChild = input(1);

  disabled: boolean = false;
  checkboxInputStates = new Map<any, CheckboxInputState>();
  value: ICheckboxWithInputValue[] = [];
  selectAllChecked: boolean = false;
  selectAllIndeterminate: boolean = false;

  // Store pending value if writeValue is called before states are initialized
  private pendingValue: ICheckboxWithInputValue[] | null = null;
  private readonly destroyRef = inject(DestroyRef);

  onChange: (value: ICheckboxWithInputValue[]) => void = (
    _value: ICheckboxWithInputValue[],
  ) => {};
  onTouched: () => void = () => {};

  private readonly checkboxOptionsEffect = effect(() => {
    const options = this.checkboxOptions();
    this.initializeStates(options);

    // Apply pending value if it exists
    if (this.pendingValue !== null) {
      this.applyValue(this.pendingValue);
      this.pendingValue = null;
    }
  });

  private initializeStates(options: ISelectValue[]) {
    const currentValues = new Set(options.map((opt) => opt.value));
    this.checkboxInputStates.forEach((state, key) => {
      if (!currentValues.has(key)) {
        this.checkboxInputStates.delete(key);
      }
    });

    options.forEach((option) => {
      if (!this.checkboxInputStates.has(option.value)) {
        const inputControl = new FormControl({ value: '', disabled: true });

        inputControl.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.updateFormValue();
          });

        this.checkboxInputStates.set(option.value, {
          checkboxValue: option.value,
          isChecked: false,
          inputControl,
          isDisabled: option.disabled || false,
        });
      } else {
        const state = this.checkboxInputStates.get(option.value)!;
        state.isDisabled = option.disabled || false;
      }
    });
  }

  writeValue(value: ICheckboxWithInputValue[] | null): void {
    // If states haven't been initialized yet (checkboxOptions empty), store for later
    if (
      this.checkboxInputStates.size === 0 &&
      value &&
      Array.isArray(value) &&
      value.length > 0
    ) {
      this.pendingValue = value;
      return;
    }

    this.applyValue(value);
  }

  private applyValue(value: ICheckboxWithInputValue[] | null): void {
    if (value && Array.isArray(value) && value.length > 0) {
      this.value = [...value];

      this.checkboxInputStates.forEach((state, key) => {
        const matchingValue = value.find((v) => v.id === key);
        state.isChecked = !!matchingValue;
        state.inputControl.setValue(matchingValue?.inputValue || '', {
          emitEvent: false,
        });

        // Disable input if: form is disabled, readonly, checkbox not checked, or checkbox is disabled
        if (
          this.disabled ||
          this.readonly() ||
          !state.isChecked ||
          state.isDisabled
        ) {
          state.inputControl.disable({ emitEvent: false });
        } else {
          state.inputControl.enable({ emitEvent: false });
        }
      });
    } else {
      this.value = [];
      this.checkboxInputStates.forEach((state) => {
        state.isChecked = false;
        state.inputControl.setValue('', { emitEvent: false });
        state.inputControl.disable({ emitEvent: false });
      });
    }

    this.updateSelectAllState();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;

    this.checkboxInputStates.forEach((state) => {
      // Disable input if: form is disabled, readonly, checkbox not checked, or checkbox is disabled
      if (
        isDisabled ||
        this.readonly() ||
        !state.isChecked ||
        state.isDisabled
      ) {
        state.inputControl.disable({ emitEvent: false });
      } else {
        state.inputControl.enable({ emitEvent: false });
      }
    });
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.inputRequired()) {
      return null;
    }

    const value = control.value as ICheckboxWithInputValue[];
    if (!value || !Array.isArray(value)) {
      return null;
    }

    const hasEmptyInput = value.some((item) => {
      const trimmedValue = item.inputValue?.trim();
      return !trimmedValue;
    });

    if (hasEmptyInput) {
      return { checkboxInputRequired: true };
    }

    return null;
  }

  private updateFormValue() {
    const newValue: ICheckboxWithInputValue[] = [];

    this.checkboxInputStates.forEach((state) => {
      if (state.isChecked) {
        newValue.push({
          id: state.checkboxValue,
          inputValue: state.inputControl.value || '',
        });
      }
    });

    this.value = newValue;
    this.onChange([...this.value]);
    this.onTouched();
  }

  handleCheckboxChange(checkboxValue: any, event: CustomEvent) {
    if (this.readonly()) {
      return;
    }

    const state = this.checkboxInputStates.get(checkboxValue);
    if (state) {
      state.isChecked = event.detail.checked;

      if (state.isChecked && !this.disabled && !this.readonly()) {
        state.inputControl.enable({ emitEvent: false });
      } else {
        state.inputControl.disable({ emitEvent: false });
      }
    }

    this.updateFormValue();
    this.updateSelectAllState();
  }

  handleSelectAllChange(event: CustomEvent) {
    if (this.readonly()) {
      return;
    }

    const isChecked = event.detail.checked;

    this.checkboxOptions().forEach((option) => {
      if (!option.disabled) {
        const state = this.checkboxInputStates.get(option.value);
        if (state) {
          state.isChecked = isChecked;

          if (isChecked && !this.disabled && !this.readonly()) {
            state.inputControl.enable({ emitEvent: false });
          } else {
            state.inputControl.disable({ emitEvent: false });
          }
        }
      }
    });

    this.updateFormValue();
    this.updateSelectAllState();
  }

  private updateSelectAllState() {
    if (!this.showSelectAll()) {
      return;
    }

    const enabledOptions = this.checkboxOptions().filter(
      (opt) => !opt.disabled,
    );
    const checkedCount = Array.from(this.checkboxInputStates.values()).filter(
      (state) => state.isChecked && !state.isDisabled,
    ).length;

    if (checkedCount === enabledOptions.length && enabledOptions.length > 0) {
      this.selectAllChecked = true;
      this.selectAllIndeterminate = false;
    } else if (checkedCount > 0) {
      this.selectAllChecked = false;
      this.selectAllIndeterminate = true;
    } else {
      this.selectAllChecked = false;
      this.selectAllIndeterminate = false;
    }
  }

  isCheckboxChecked(checkboxValue: any): boolean {
    return this.checkboxInputStates.get(checkboxValue)?.isChecked || false;
  }

  getInputControl(checkboxValue: any): FormControl<string | null> | null {
    return this.checkboxInputStates.get(checkboxValue)?.inputControl || null;
  }
}
