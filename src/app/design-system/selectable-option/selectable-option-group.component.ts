import { Component, input, output, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectableOptionComponent } from './selectable-option.component';
import {
  SelectableOptionConfig,
  SelectableOptionGroupConfig,
} from './selectable-option.types';

@Component({
  selector: 'app-ds-selectable-option-group',
  standalone: true,
  imports: [CommonModule, SelectableOptionComponent],
  templateUrl: './selectable-option-group.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectableOptionGroupComponent),
      multi: true,
    },
  ],
})
export class SelectableOptionGroupComponent implements ControlValueAccessor {
  config = input<SelectableOptionGroupConfig>({
    options: [],
    mode: 'attempt',
    revealAnswer: false,
    correctOptionValue: null,
  });
  selectionChange = output<SelectableOptionConfig['value']>();

  selectedValue = signal<string | number | undefined>(undefined);

  onChange: (value: string | number | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | number): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Optionally add group disabled logic if needed
  }

  selectOption(value: SelectableOptionConfig['value']) {
    this.selectedValue.set(value);
    this.selectionChange.emit(value);
    this.onChange(value);
  }
}
