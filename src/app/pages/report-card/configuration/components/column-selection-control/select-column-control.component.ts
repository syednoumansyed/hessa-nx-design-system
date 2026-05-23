import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faCircle,
  faCircleDot,
} from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { Idropdown } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';

@Component({
  selector: 'app-select-column',
  templateUrl: './select-column-control.component.html',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslocoDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectColumnControlComponent),
      multi: true,
    },
  ],
})
export class SelectColumnControlComponent implements ControlValueAccessor {
  /**
   * Whether this control should allow multiple selections.
   */
  isMultiple = input<boolean>(false);
  showEmptyPlaceholder = input<boolean>(false);
  isRequired = input<boolean>(false);
  label = input<string | null>(null);

  /**
   * The list of columns (options) to display.
   */
  columnsList = input<Array<Idropdown>>([]);

  /**
   * Internal model of the control’s value.
   * Always stored as an array.
   */
  private _value: ObjId[] = [];

  /**
   * Track whether the control is disabled.
   */
  isDisabled = false;

  /**
   * Callbacks for ControlValueAccessor
   */
  private onChange: (val: ObjId[]) => void = () => {};
  private onTouched: () => void = () => {};

  protected multipleSelectIcon = faCheckCircle;
  protected selectSignalSelectIcon = faCircleDot;
  protected signalSelectIcon = faCircle;

  // ---------------------------------
  // ControlValueAccessor requirements
  // ---------------------------------

  writeValue(value: string | string[] | null): void {
    if (Array.isArray(value)) {
      this._value = value;
    } else if (value) {
      this._value = [value];
    } else {
      this._value = [];
    }
  }

  registerOnChange(fn: (val: ObjId[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // ---------------------------------
  // Custom logic
  // ---------------------------------

  /**
   * Handle item selection toggle.
   * - In multi-select, we add or remove the item from the array.
   * - In single-select, we ensure the value is always an array (with either one element or empty).
   */
  toggleSelection(itemValue: ObjId): void {
    if (this.isDisabled) return;

    if (this.isMultiple()) {
      const index = this._value.indexOf(itemValue);
      if (index === -1) {
        // Not selected yet, so add it.
        this._value.push(itemValue);
      } else {
        // Already selected, remove it.
        this._value.splice(index, 1);
      }
    } else {
      // Single-select: toggle the selection (as an array).
      if (this._value[0] === itemValue) {
        this._value = [];
      } else {
        this._value = [itemValue];
      }
    }

    // Notify Angular forms of the updated value.
    this.onChange(this._value);
    this.onTouched();
  }

  /**
   * Check if an item is selected.
   */
  isSelected(itemValue: ObjId): boolean {
    return this._value.includes(itemValue);
  }
}
