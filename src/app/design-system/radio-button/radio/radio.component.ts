import { CommonModule } from '@angular/common';
import {
  Component,
  forwardRef,
  input,
  OnInit,
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

type RadioSize = 'sm' | 'lg';

@Component({
  selector: 'app-ds-radio',
  templateUrl: './radio.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsRadioComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DsRadioComponent),
      multi: true,
    },
  ],
})
export class DsRadioComponent implements ControlValueAccessor, OnInit {
  /* ───── inputs ───── */
  title = input<string>('');
  size = input<RadioSize>('lg');
  value = input<any>(); // radio value
  required = input<boolean>(false);
  disabled = input<boolean>(false);

  /* ───── state ───── */
  readonly checked = signal(false);
  readonly isDisabled = signal(false);
  readonly isHovered = signal(false);
  readonly isFocused = signal(false);

  /* ───── output ───── */
  readonly checkedChange = output<any>();

  /* CVA plumbing */
  private onChange = (_: any) => {};
  private onTouched = () => {};

  /* ─­ life-cycle ─ */
  ngOnInit(): void {
    this.isDisabled.set(this.disabled());
  }

  /* ─­ CVA ─ */
  writeValue(isSelected: boolean): void {
    this.checked.set(isSelected);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(dis: boolean): void {
    this.isDisabled.set(dis);
  }

  validate(_: AbstractControl): ValidationErrors | null {
    return this.required() && !this.checked() ? { required: true } : null;
  }

  /* ── interaction ─ */
  select(): void {
    if (this.isDisabled()) return;

    this.checked.set(true); // the group will clear others
    this.checkedChange.emit(this.value()); // Emit the radio value, not just true
    this.onChange(this.value()); // Pass the radio value to the form
    this.onTouched();
  }
}
