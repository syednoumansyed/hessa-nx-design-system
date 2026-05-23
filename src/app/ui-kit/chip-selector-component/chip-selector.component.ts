import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { Idropdown } from '@shared/interfaces';

@Component({
  selector: 'app-hes-chip-selector',
  templateUrl: './chip-selector.component.html',
  imports: [CommonModule],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HesChipSelectorComponent),
      multi: true,
    },
  ],
})
export class HesChipSelectorComponent implements ControlValueAccessor {
  @Input() options: ISelectValue[] = [];
  @Input() multiple: boolean = false; // Allow single or multiple selection

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

  toggleValue(value: string | number): void {
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
