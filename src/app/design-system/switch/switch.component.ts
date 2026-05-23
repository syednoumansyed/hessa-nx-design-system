import {
  Component,
  EventEmitter,
  forwardRef,
  input,
  OnInit,
  output,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

/**
 * @ai-hint
 * component: DsSwitchComponent
 * selector: app-ds-switch
 * intent: Toggle control with two modes — boolean on/off (default) and two-way string option switching; used for settings toggles and A/B mode selectors
 * do: Use type="boolean" for simple on/off; use type="two-way" with option1/option2 inputs for labelled two-state selectors; bind with Angular FormControl or listen to selectedOptionChange output; customize track color via onColor/offColor with CSS variable strings or hex values
 * dont: Don't use for more than two options (use DsSelectComponent or DsTabsComponent); don't rely on the selectedOption input for reactive updates after init — it is only read in ngOnInit for two-way mode
 * device: No structural device differences
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Toggle thumb direction inherits from host dir; no explicit RTL overrides in this component
 * alternatives: DsCheckboxComponent for explicit opt-in; DsSegmentedControlComponent for 2–3 labelled segment choices
 */
@Component({
  selector: 'app-ds-switch',
  templateUrl: './switch.component.html',
  standalone: true,
  imports: [FormsModule, NgClass],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsSwitchComponent),
      multi: true,
    },
  ],
})
export class DsSwitchComponent implements OnInit, ControlValueAccessor {
  /* ─── inputs ─── */
  option1 = input<string>('Option 1');
  option2 = input<string>('Option 2');
  selectedOption = input<string>('option1');
  type = input<'two-way' | 'boolean'>('boolean'); // default flavour
  onColor = input<string>('var(--surface-success-light)');
  offColor = input<string>('var(--surface-secondary)');

  /* ─── internal value ─── */
  selected: boolean | string = false;

  /* ─── outputs (template bindings) ─── */
  selectedOptionChange = output<string | boolean>();

  /* ─── ControlValueAccessor plumbing ─── */
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};
  isDisabled = false;

  constructor() {}

  ngOnInit() {
    if (this.type() === 'two-way') {
      this.selected = this.selectedOption();
    }
  }

  /* ───── UI → value ───── */
  setOption(): void {
    if (this.isDisabled) return;

    if (this.type() === 'boolean') {
      this.selected = !this.selected;
    } else {
      this.selected =
        this.selected === this.option1() ? this.option2() : this.option1();
    }

    /* propagate */
    this.onChange(this.selected);
    this.onTouched();
    this.selectedOptionChange.emit(this.selected);
  }

  /* ───── ControlValueAccessor interface ───── */
  writeValue(obj: any): void {
    this.selected = obj;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  protected resolveTrackColorClass(): string | null {
    const value = this.selected ? this.onColor() : this.offColor();
    return this.isCssColor(value) ? null : value;
  }

  protected resolveTrackColorStyle(): string | null {
    const value = this.selected ? this.onColor() : this.offColor();
    return this.isCssColor(value) ? value : null;
  }

  private isCssColor(value: string | null | undefined): boolean {
    if (!value) {
      return false;
    }

    const normalized = value.trim().toLowerCase();
    return (
      normalized.startsWith('#') ||
      normalized.startsWith('rgb') ||
      normalized.startsWith('hsl') ||
      normalized.startsWith('var(')
    );
  }
}
