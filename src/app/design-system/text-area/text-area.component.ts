import {
  Component,
  forwardRef,
  Input,
  signal,
  computed,
  input,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
import { NgClass } from '@angular/common';

/**
 * @ai-hint
 * component: DsTextareaComponent
 * selector: app-ds-textarea
 * intent: Multi-line text input with label, optional character count, hint text (left/right), and built-in required/maxLength validation
 * do: Set rows for the visible line height; enable showCharacterCount with maxLength for user feedback; use hintLeft for help text and hintRight for character guidelines; bind via FormControl or [disabled] attribute
 * dont: Don't use for single-line entry (use DsInputComponent); don't set maxLength in both the @Input and a Validators.maxLength — they will conflict
 * device: No structural device differences; maxLength is enforced programmatically on input to handle Android's inconsistent native maxlength behavior
 * student-theme: YES — textarea element has student:border-[4px] student:border-b-[8px] matching the DsInputComponent border style
 * rtl: Inherits host dir; text alignment and hint layout follow logical CSS
 * alternatives: DsInputComponent for single-line; rich-text editor components for formatted content
 */
@Component({
  selector: 'app-ds-textarea',
  standalone: true,
  templateUrl: './text-area.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsTextareaComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DsTextareaComponent),
      multi: true,
    },
  ],
  imports: [NgClass],
})
export class DsTextareaComponent implements ControlValueAccessor {
  /* ── public signals ─────────────────────────────────────── */
  label = input<string | null>(null);
  id = input<string>(`input-${Math.random().toString(36).substring(2, 11)}`);
  placeholder = input<string | null>(null);
  required = input<boolean>(false);
  hintRight = input<string | null>(null);
  hintLeft = input<string | null>(null);
  showCharacterCount = input<boolean>(false);
  /* ── public inputs ─────────────────────────────────────── */
  @Input() rows = 4;
  @Input() maxLength?: number;

  /* external `[disabled]` binding */
  @Input() set disabled(v: boolean) {
    this._inputDisabled = v;
    this._syncDisabled();
  }

  /* internal reactive state */
  protected valueSig = signal<string>('');
  private _inputDisabled = false; // from [disabled]
  private _formDisabled = false; // from setDisabledState
  disabledSig = signal<boolean>(false); // merged view

  /* merged class list */
  /* ── dynamic classes ───────────────────────────────────── */
  textareaClasses = computed(() => {
    const base = [
      // sizing + spacing
      'w-full max-w-screen-lg rounded-xl px-4 py-3 text-ds-base font-semibold text-content-high',
      // border styling matching input component (role-based)
      'border student:border-[4px] student:border-b-[8px] border-neutral-cool-100 bg-surface-primary',
      // remove default outline
      'outline-0',
      // transition
      'transition',
    ].join(' ');

    const enabled = [
      'focus:border-neutral-cool-700 hover:focus:border-neutral-cool-700 hover:border-neutral-cool-200',
    ].join(' ');

    const disabled =
      'border-neutral-cool-100 text-content-low !bg-surface-secondary-light cursor-not-allowed';

    return this.disabledSig() ? `${base} ${disabled}` : `${base} ${enabled}`;
  });
  /* ---------- ControlValueAccessor related ---------- */
  private onChange = (_: any) => {};
  private onTouched = () => {};

  writeValue(v: string | null) {
    this.valueSig.set(v ?? '');
  }
  registerOnChange(fn: any) {
    this.onChange = fn;
  }
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this._formDisabled = isDisabled;
    this._syncDisabled();
  }

  /* ---------- validation ---------- */
  validate(_: AbstractControl): ValidationErrors | null {
    if (this.required() && !this.valueSig().trim()) return { required: true };
    if (this.maxLength && this.valueSig().length > this.maxLength)
      return { maxlength: { requiredLength: this.maxLength } };
    return null;
  }

  /* ---------- template hooks ---------- */
  onInput(e: Event) {
    let val = (e.target as HTMLTextAreaElement).value;
    if (this.maxLength && val.length > this.maxLength) {
      val = val.slice(0, this.maxLength);
      (e.target as HTMLTextAreaElement).value = val; // put trimmed text back
    }
    this.valueSig.set(val);
    this.onChange(val);
  }
  onBlur() {
    this.onTouched();
  }

  /* ---------- helpers ---------- */
  private _syncDisabled() {
    this.disabledSig.set(this._inputDisabled || this._formDisabled);
  }
}
