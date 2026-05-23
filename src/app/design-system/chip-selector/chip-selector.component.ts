import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsIcon } from '@ds/icon/icon.component';

export interface ChipSelectorOption {
  value: string | number;
  displayedValue: string;
  /** Icon to display at the start of the chip */
  icon?: DsIcon;
  /** Whether this specific option is disabled */
  disabled?: boolean;
}

@Component({
  selector: 'app-ds-chip-selector',
  templateUrl: './chip-selector.component.html',
  standalone: true,
  imports: [CommonModule, DsChipComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsChipSelectorComponent),
      multi: true,
    },
  ],
})
export class DsChipSelectorComponent implements ControlValueAccessor {
  @Input() options: ChipSelectorOption[] = [];
  @Input() multiple: boolean = false;
  @Input() disabled: boolean = false;
  @Input() displayType: 'pill' | 'card' = 'pill';

  selectedValues: (string | number)[] = [];

  onChange: (value: (string | number)[] | string | number | null) => void =
    () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (this.multiple) {
      this.selectedValues = Array.isArray(value) ? value : [];
    } else {
      this.selectedValues =
        value !== null && value !== undefined ? [value] : [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggleValue(value: string | number): void {
    if (this.disabled) {
      return;
    }

    // Check if the specific option is disabled
    const option = this.options.find((opt) => opt.value === value);
    if (option?.disabled) {
      return;
    }

    if (this.multiple) {
      // Handle multi-select mode
      if (this.selectedValues.includes(value)) {
        // Deselect if already selected
        this.selectedValues = this.selectedValues.filter((v) => v !== value);
      } else {
        // Select if not already selected
        this.selectedValues.push(value);
      }
      this.onChange([...this.selectedValues]); // Emit the updated array
    } else {
      // Handle single-select mode
      if (this.selectedValues.includes(value)) {
        // Deselect if already selected
        this.selectedValues = [];
        this.onChange(null); // Emit null for deselection
      } else {
        // Select if not already selected
        this.selectedValues = [value];
        this.onChange(value); // Emit the selected value
      }
    }
    this.onTouched();
  }

  isSelected(value: string | number): boolean {
    return this.selectedValues.includes(value);
  }
}
