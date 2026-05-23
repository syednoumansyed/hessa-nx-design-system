import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { faSolidCheck, faSolidMinus } from '@ng-icons/font-awesome/solid';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { DsIconComponent } from '@ds/icon/icon.component';

type CheckboxSize = 'sm' | 'lg';
type CheckboxVariant = 'determinate' | 'indeterminate';
type IconPlacement = 'start' | 'end';

/**
 * @ai-hint
 * component: DsCheckboxComponent
 * selector: app-ds-checkbox
 * intent: Boolean form control for opt-in selections; supports indeterminate state for "select all" parent rows
 * do: Use variantInput="indeterminate" for partial-selection parent checkboxes; bind with FormControl or use checkedChange output; supply helperText for additional context below the label
 * dont: Don't use for mutually exclusive choices (use DsRadioGroupComponent instead); don't rely on the title input alone — add helperText when the label needs clarification
 * device: No structural device differences
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Label and icon placement use logical start/end ordering; inherits dir from host
 * alternatives: DsRadioGroupComponent for single-choice sets; DsSwitchComponent for immediate on/off actions
 */
@Component({
  selector: 'app-ds-checkbox',
  templateUrl: './checkbox.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, DsIconComponent],
  providers: [
    provideIcons({ faSolidCheck, faSolidMinus }),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsCheckboxComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DsCheckboxComponent),
      multi: true,
    },
  ],
})
export class DsCheckboxComponent implements ControlValueAccessor {
  defaultValue = input<boolean>(false);
  title = input<string>('');
  variantInput = input<CheckboxVariant>('determinate');
  readonly variant = signal<CheckboxVariant>('determinate');
  size = input<CheckboxSize>('lg');
  required = input<boolean>(false);

  value = input<any>();

  // Icon inputs for label
  labelIcon = input<IconDefinition | null>(null);
  labelIconPlacement = input<IconPlacement>('end');

  // Helper text displayed below the checkbox label
  helperText = input<string | null>(null);

  private initializedByForm = false;

  constructor() {
    // React to variantInput changes dynamically
    effect(() => {
      this.variant.set(this.variantInput());
    });
  }

  readonly checkedChange = output<boolean>();
  readonly checked = signal(false);

  disabled = input<boolean>(false); // keep for external use if needed
  readonly isDisabled = signal(false); // single source of truth

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required() && !this.checked()) {
      return { required: true };
    }
    return null;
  }

  writeValue(value: boolean): void {
    this.initializedByForm = true;
    this.checked.set(value ?? false);
  }

  ngOnInit(): void {
    if (!this.initializedByForm) {
      this.checked.set(this.defaultValue());
    }
    this.isDisabled.set(this.disabled());
    this.variant.set(this.variantInput());
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  toggleCheck(): void {
    if (!this.isDisabled()) {
      const newState = !this.checked();
      this.checked.set(newState);
      this.checkedChange.emit(newState);
      this.onChange(newState);
      this.onTouched();
    }
  }

  get iconName(): string {
    return this.variant() === 'indeterminate' ? 'faSolidMinus' : 'faSolidCheck';
  }
}
