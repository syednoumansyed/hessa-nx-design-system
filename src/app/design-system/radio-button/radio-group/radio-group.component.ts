import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit,
  forwardRef,
  signal,
  effect,
  inject,
  runInInjectionContext,
  Injector,
  input,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  NG_VALIDATORS,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DsRadioComponent } from '../radio/radio.component';

/**
 * @ai-hint
 * component: DsRadioGroupComponent
 * selector: app-ds-radio-group
 * intent: Container that wires a set of DsRadioComponent children into a single mutually-exclusive form control
 * do: Nest <app-ds-radio> elements as direct children; bind the group with FormControl; set required input for built-in required validation
 * dont: Don't mix DsRadioComponent children from different groups under one host; don't set checked state directly on child radios — control through the group's writeValue or FormControl
 * device: No structural device differences
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Layout direction inherits from host; individual radio children handle their own label alignment
 * alternatives: DsCheckboxComponent for multi-select; DsSwitchComponent for two-state binary toggle
 */
@Component({
  selector: 'app-ds-radio-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<ng-content></ng-content>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsRadioGroupComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DsRadioGroupComponent),
      multi: true,
    },
  ],
})
export class DsRadioGroupComponent
  implements ControlValueAccessor, AfterContentInit
{
  @ContentChildren(DsRadioComponent) radios!: QueryList<DsRadioComponent>;

  selected = signal<any | null>(null);
  injector = inject(Injector);
  required = input<boolean>(false);

  // Add this to track initialization
  private initialized = false;

  private onChange = (_: any) => {};
  private onTouched = () => {};

  ngAfterContentInit(): void {
    this.initialized = true;

    // If there's a pending value to set
    if (this.selected() !== null) {
      this.updateRadios(this.selected());
    }

    this.radios.forEach((radio) => {
      // Subscribe to the radio's checkedChange output event
      radio.checkedChange.subscribe((value) => {
        this.selected.set(value);
        this.updateRadios(value);
        this.onChange(value);
        this.onTouched();
      });

      // Keep individual radios synced with group's selected signal
      runInInjectionContext(this.injector, () => {
        effect(
          () => {
            const selectedValue = this.selected();
            if (selectedValue !== null) {
              radio.writeValue(selectedValue === radio.value());
            }
          },
          {
            allowSignalWrites: true,
          },
        );
      });
    });
  }

  private updateRadios(selectedValue: any): void {
    // Only update radios if they are initialized
    if (!this.initialized || !this.radios) {
      return;
    }

    this.radios.forEach((radio) => {
      radio.writeValue(radio.value() === selectedValue);
    });
  }

  writeValue(value: any): void {
    this.selected.set(value);
    // Only call updateRadios if radios are initialized
    if (this.initialized) {
      this.updateRadios(value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(dis: boolean): void {
    this.radios?.forEach((r) => r.setDisabledState(dis));
  }

  /* validation */
  validate(_: AbstractControl): ValidationErrors | null {
    return this.required() && this.selected() == null
      ? { required: true }
      : null;
  }
}
