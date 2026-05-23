import {
  Component,
  computed,
  effect,
  EventEmitter,
  forwardRef,
  input,
  Input,
  model,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { faSearch } from '@fortawesome/pro-solid-svg-icons';
import { IonCheckbox } from '@ionic/angular/standalone';
import { NgClass } from '@angular/common';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
} from '@angular/forms';

export interface CheckboxOption {
  label: string;
  value: any;
  checked: boolean;
}

@Component({
  selector: 'app-searchable-checkbox-select',
  templateUrl: './hes-searchable-checkbox-select.component.html',
  styleUrls: ['./hes-searchable-checkbox-select.component.scss'],
  imports: [HessaInputComponent, IonCheckbox, NgClass, FormsModule],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HesSearchableCheckboxSelectComponent),
      multi: true,
    },
  ],
})
export class HesSearchableCheckboxSelectComponent
  implements OnInit, OnChanges, ControlValueAccessor
{
  @Input() label?: string = '';
  @Input() placeholder?: string = '';
  @Input() required?: boolean = false;
  @Output() selected = new EventEmitter<any[]>();
  initSelectedValues = input<ISelectValue[]>();

  // Input options provided from parent
  _selections = signal<CheckboxOption[]>([]);
  selectOptions = input<ISelectValue[]>();
  disabled = model(false);
  // Transform incoming select options to CheckboxOption with a checked property
  options = computed(() => {
    return (
      this.selectOptions()?.map((option) => {
        return {
          label: option.displayedValue,
          value: option.value,
          // Check if this option is in _selections by comparing values
          checked: this._selections().some(
            (selected) => selected.value === option.value && selected.checked,
          ),
        };
      }) ?? []
    );
  });

  searchIcon = faSearch;

  // For search functionality
  searchQuery = '';

  // Tracks whether all items are selected
  allSelected = computed(
    () =>
      this._selections().length === this.options().length ||
      this.options().every((option) => option.checked),
  );

  // --- ControlValueAccessor callbacks ---
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      // write all selected values to form control
      const selectedValues = this.options()
        .filter((opt) => opt.checked)
        .map((opt) => opt.value);
      this.selected.emit(selectedValues);
      this.onChange(selectedValues);
      this.onTouched();
    });
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    // Only update if 'initSelectedValues' has changed
    if (changes['initSelectedValues']) {
      const newInitial: ISelectValue[] =
        changes['initSelectedValues'].currentValue;

      // Map the new initial values into options with checked set to true
      const initialOptions: CheckboxOption[] =
        newInitial?.map((option) => ({
          label: option.displayedValue,
          value: option.value,
          checked: true,
        })) ?? [];

      // Merge with existing selections without removing ones not in the new initial values
      const mergedOptions = [
        ...initialOptions,
        ...this._selections().filter(
          (selectedOption) =>
            !initialOptions.some(
              (option) => option.value === selectedOption.value,
            ),
        ),
      ];

      this._selections.set(mergedOptions);
    }
  }

  // Returns filtered options based on the search query
  filteredOptions(): CheckboxOption[] {
    if (!this.searchQuery) {
      return this.options();
    }
    const q = this.searchQuery.toLowerCase();
    const options = this.options().filter((item) =>
      item.label.toLowerCase().includes(q),
    );
    if (options.length === 0) {
      //uncheck all checkboxes and send update to form control
      this.options().forEach((item) => (item.checked = false));
      this.selected.emit([]);
      this.onChange([]);
      this.onTouched();
    }

    return options;
  }

  // Toggle a single item; updates its checked status
  toggleItem(item: CheckboxOption, event: any) {
    item.checked = event.detail.checked;
    const selectedValues = this.options()
      .filter((opt) => opt.checked)
      .map((opt) => opt.value);
    const options = this.options().filter((option) => {
      return selectedValues.includes(option.value);
    });
    this._selections.set(options);
    this.selected.emit(selectedValues);
    this.onChange(selectedValues);
    this.onTouched();
  }

  // Toggle all items at once
  toggleSelectAll(event: any) {
    const checked = event.detail.checked;
    this.options().forEach((item) => (item.checked = checked));
    const selectedValues = this.options()
      .filter((opt) => opt.checked)
      .map((opt) => opt.value);
    this._selections.set(checked ? this.options() : []);
    this.selected.emit(selectedValues);
    this.onChange(selectedValues);
    this.onTouched();
  }

  // --- ControlValueAccessor Implementation ---
  writeValue(value: any): void {
    // Expecting value to be an array of IDs.
    if (value && Array.isArray(value)) {
      const selectedIds = value;
      this.options().forEach((option) => {
        option.checked = selectedIds.includes(option.value);
      });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
