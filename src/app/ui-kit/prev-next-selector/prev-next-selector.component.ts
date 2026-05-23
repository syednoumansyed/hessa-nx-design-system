import { NgClass } from '@angular/common';
import { Component, Input, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleLeft, faAngleRight } from '@fortawesome/pro-regular-svg-icons';
import { Idropdown } from '@shared/interfaces';
import { ObjId } from '@shared/interfaces/common.interface';
import { isRtl } from '@shared/utils/platform';

export interface NavigationItem extends Idropdown {}

@Component({
  selector: 'app-prev-next-selector',
  templateUrl: './prev-next-selector.component.html',
  standalone: true,
  imports: [FontAwesomeModule, NgClass],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PrevNextSelectorComponent),
      multi: true,
    },
  ],
})
export class PrevNextSelectorComponent implements ControlValueAccessor {
  items = input<NavigationItem[]>([]);
  containerClasses = input<string>('');
  protected readonly faAngleLeft = faAngleLeft;
  protected readonly faAngleRight = faAngleRight;
  protected isRtl = isRtl();
  // Internal value tracking
  private _selectedValue: ObjId | null = null;

  // Function to call when the value changes.
  onChange: (value: any) => void = () => {};

  // Function to call when the control is touched.
  onTouched: () => void = () => {};

  // Computes the current index based on the selected value.
  get currentIndex(): number {
    const idx = this.items().findIndex(
      (item) => item.value == this._selectedValue,
    );
    // If no matching value is found, default to the first item.
    return idx >= 0 ? idx : 0;
  }

  get currentDisplayedValue() {
    return this.items()[this.currentIndex]?.displayedValue;
  }
  // Writes a new value from the form model into the view.
  writeValue(value: any): void {
    this._selectedValue = value;
  }

  // Registers a callback function that is called when the control's value changes in the UI.
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // Registers a callback function that is called by the forms API on initialization to update the form model on blur.
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Optionally handle the control’s disabled state.
  setDisabledState?(isDisabled: boolean): void {
    // You can implement this to disable buttons if needed.
  }

  // Navigates to the previous item.
  previous(): void {
    if (this.currentIndex > 0) {
      const newIndex = this.currentIndex - 1;
      this._selectedValue = this.items()[newIndex].value;
      this.onChange(this._selectedValue);
      this.onTouched();
    }
  }

  // Navigates to the next item.
  next(): void {
    if (this.currentIndex < this.items().length - 1) {
      const newIndex = this.currentIndex + 1;
      this._selectedValue = this.items()[newIndex].value;
      this.onChange(this._selectedValue);
      this.onTouched();
    }
  }
}
