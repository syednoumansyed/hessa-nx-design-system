import {
  Component,
  forwardRef,
  input,
  output,
  signal,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  IonPicker,
  IonPickerColumn,
  IonPickerColumnOption,
} from '@ionic/angular/standalone';

// NOTE: Component works with string form values only.
// Preferred Format (current): HH:MM AM/PM
//  - HH is 01-12 (12 used for midnight/noon as per common 12h clock conventions)
//  - MM is 00-59
//  - Space before AM/PM
//  Examples: 12:05 AM, 07:30 PM, 12:00 PM
// Also accepted (input only):
//  - H:MM AM/PM (single digit hour without leading zero) e.g., 7:05 PM
// Backward compatibility: also accepts legacy pattern HH:MM:AM|PM (colon before suffix)
// Legacy (previous): 00:05:AM (00 meant 12) -> now normalized to 12:05 AM

@Component({
  selector: 'ds-time-picker',
  standalone: true,
  imports: [CommonModule, IonPicker, IonPickerColumn, IonPickerColumnOption],
  templateUrl: './time-picker.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsTimePickerComponent),
      multi: true,
    },
  ],
})
export class DsTimePickerComponent implements ControlValueAccessor {
  // Inputs
  minuteStep = input<number>(1); // step size for minute selection
  disabled = input(false);

  private disabledInternal = signal(false);

  // Language-based direction (if lang provided) with fallback to Directionality service
  lang = input<string>('en'); // e.g., 'en', 'ar', 'fa'
  private destroyRef = inject(DestroyRef);
  // Only support 'ar' and 'en' for now; anything else coerced to 'en'
  normalizedLang = computed<'ar' | 'en'>(() => {
    const lang = this.lang();
    if (!lang) return 'en';
    return lang === 'ar' ? 'ar' : 'en';
  });

  isAr = computed(() => this.normalizedLang() === 'ar');

  /**
   * Emits on every picker change, including intermediate selections.
   * Use this event to react to live changes as the user interacts with the picker.
   */
  valueChange = output<string>();

  // Internal state
  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  // Exposed to template (cannot be private when strict template type checking is enabled)
  hourSignal = signal<number | null>(null);
  minuteSignal = signal<number | null>(null);
  isPmSignal = signal<boolean>(false);
  private _initializedFromNull = false;

  // Attempt to initialize picker with the current system time (12h) when the first null value is written.
  // Returns true if initialization occurred, false otherwise.
  private tryInitializeFromNull(): boolean {
    if (this._initializedFromNull) return false;
    this._initializedFromNull = true;
    const now = new Date();
    let h24 = now.getHours();
    const step = Math.min(Math.max(this.minuteStep(), 1), 30);
    let minutes = now.getMinutes();
    // Round to nearest configured minute step
    const rounded = Math.round(minutes / step) * step;
    if (rounded === 60) {
      minutes = 0;
      h24 = (h24 + 1) % 24;
    } else {
      minutes = rounded;
    }
    const isPm = h24 >= 12;
    const base12 = h24 % 12; // 0-11
    const hour12 = base12 === 0 ? 12 : base12; // 0 -> 12 for 12h clock
    this.hourSignal.set(hour12);
    this.minuteSignal.set(minutes);
    this.isPmSignal.set(isPm);
    const internal = this.getInternalValue();
    if (internal) {
      // Emit value so external form receives the default (do not mark touched)
      this.onChange(internal);
      this.valueChange.emit(internal);
    }
    return true;
  }

  protected get hourOptions(): number[] {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  protected get minuteOptions(): number[] {
    const step = Math.min(Math.max(this.minuteStep(), 1), 30); // clamp
    const arr: number[] = [];
    for (let i = 0; i < 60; i += step) arr.push(i);
    return arr;
  }

  writeValue(value: string | null): void {
    if (!value) {
      // Try to seed current time (only first null). If already seeded, clear signals.
      if (!this.tryInitializeFromNull()) {
        this.hourSignal.set(null);
        this.minuteSignal.set(null);
        this.isPmSignal.set(false);
      }
      return;
    }
    const parsed = this.parseTimeString(value);
    if (!parsed) {
      // invalid format -> reset
      this.hourSignal.set(null);
      this.minuteSignal.set(null);
      this.isPmSignal.set(false);
      return;
    }
    const { hour24, minute } = parsed;
    this.isPmSignal.set(hour24 >= 12);
    const hour12 = hour24 % 12; // 0-11
    this.hourSignal.set(hour12 === 0 ? 12 : hour12);
    this.minuteSignal.set(minute);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledInternal.set(isDisabled);
  }

  confirm() {
    const value = this.getInternalValue();
    if (value) {
      this.onChange(value); // propagate to form model
      this.valueChange.emit(value); // keep valueChange in sync with final value
    }
    this.onTouched();
  }

  private getInternalValue(): string | null {
    const h = this.hourSignal();
    const m = this.minuteSignal();
    if (h === null || m === null) return null;
    // Display hour stays 1-12 (12 represents both midnight/noon depending on suffix)
    const hourToken = h.toString().padStart(2, '0');
    const minuteToken = m.toString().padStart(2, '0');
    const suffix = this.isPmSignal() ? 'PM' : 'AM';
    return `${hourToken}:${minuteToken} ${suffix}`;
  }

  private parseTimeString(
    val: string,
  ): { hour24: number; minute: number } | null {
    const trimmed = val.trim();
    // New preferred pattern: HH:MM AM|PM (HH can be 01-12)
    const reNew = /^(\d{1,2}):(\d{2})\s(AM|PM)$/i; // allow 1 or 2 digit hour
    // Legacy pattern: HH:MM:AM|PM (also allowed) where 00 meant 12
    const reLegacy = /^(\d{1,2}):(\d{2}):(AM|PM)$/i;
    let match = trimmed.match(reNew);
    let legacy = false;
    if (!match) {
      match = trimmed.match(reLegacy);
      if (match) legacy = true;
    }
    if (!match) return null;
    let [, hhStr, mmStr, suffix] = match;
    const mm = Number(mmStr);
    let hhNum = Number(hhStr); // may be 0 (legacy) or 1-12
    if (legacy && hhNum === 0) hhNum = 12; // legacy 00 -> 12
    // In new format 00 is invalid
    if (hhNum < 1 || hhNum > 12 || mm < 0 || mm > 59) return null;
    const base = hhNum % 12; // 0-11
    const hour24 = base + (suffix.toUpperCase() === 'PM' ? 12 : 0);
    return { hour24, minute: mm };
  }

  // Event handlers for picker changes
  onHourChange(ev: CustomEvent) {
    const val = Number(ev.detail.value);
    this.hourSignal.set(val);
    this.handleIntermediateChange();
  }

  onMinuteChange(ev: CustomEvent) {
    this.minuteSignal.set(Number(ev.detail.value));
    this.handleIntermediateChange();
  }

  onAmPmChange(ev: CustomEvent) {
    this.isPmSignal.set(ev.detail.value === 'pm');
    this.handleIntermediateChange();
  }

  // Localized labels (simple heuristic: if RTL and no custom label -> Arabic short forms)
  get amDisplay() {
    return this.normalizedLang() === 'ar' ? 'ص' : 'AM';
  }
  get pmDisplay() {
    return this.normalizedLang() === 'ar' ? 'م' : 'PM';
  }

  private handleIntermediateChange() {
    const value = this.getInternalValue();
    if (value) {
      // Always emit valueChange for intermediate updates
      this.valueChange.emit(value);
      this.confirm();
    }
  }
}
