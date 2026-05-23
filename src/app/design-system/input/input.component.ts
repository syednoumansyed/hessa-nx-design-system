// input.component.ts
import {
  Component,
  computed,
  input,
  output,
  forwardRef,
  signal,
  inject,
  OnInit,
  Injector,
  DestroyRef,
  viewChild,
  ElementRef,
  effect,
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  NgControl,
  FormControl,
  FormControlName,
  FormGroupDirective,
  FormControlDirective,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { IonSpinner } from '@ionic/angular/standalone';
import { DsIcon, DsIconComponent } from '../icon/icon.component';
import { Platform } from '@angular/cdk/platform';

/**
 * @ai-hint
 * component: DsInputComponent
 * selector: app-ds-input
 * intent: Single-line text entry with label, hint, error, prefix/suffix icon, and character count support
 * do: Bind with Angular FormControl via ControlValueAccessor; use errorMessage for manual errors or let form status drive it; use iconEnd + iconEndClick for password-reveal or clear patterns
 * dont: Don't use for multi-line content (use DsTextareaComponent); don't set both inputValue and a FormControl at the same time
 * device: On iOS, programmatic focus is suppressed (platform.IOS guard) to prevent scroll-jump; no visual difference between platforms
 * student-theme: YES — outer container has student:border-[4px] student:border-b-[8px] for thick 3D-border effect
 * rtl: Icons and prefix slot are positioned with logical ps/pe classes; inherits dir from host
 * alternatives: DsTextareaComponent for multi-line; SearchBoxComponent for search with debounce; DsSelectComponent for option picking
 */
@Component({
  selector: 'app-ds-input',
  templateUrl: './input.component.html',
  standalone: true,
  imports: [DsIconComponent, CommonModule, IonSpinner],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsInputComponent),
      multi: true,
    },
  ],
})
export class DsInputComponent implements ControlValueAccessor, OnInit {
  // Input properties
  outerContainerClass = input<string>('');
  inputClasses = input<string>('');
  loading = input(false);
  disabled = input(false);
  iconStart = input<DsIcon>();
  iconEnd = input<DsIcon>();
  dsType = input<'text' | 'number' | 'tel' | 'email'>('text');
  placeholder = input('');
  readOnly = input(false);
  prefix = input<string>('');
  showPrefix = input(true); // NNT
  label = input<string>();
  hint = input<string>();
  errorMessage = input<string>('');
  id = input<string>(`input-${Math.random().toString(36).substring(2, 11)}`);
  maxLength = input<number | string | undefined>(undefined);
  required = input<boolean | undefined>(undefined);
  suppressFormError = input<boolean>(false);
  showCharacterCount = input<boolean>(false);
  inputMode = input<
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'month'
    | 'number'
    | 'numeric'
    | 'password'
    | 'search'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week'
  >('text'); // for input
  autocomplete = input<string | null>(null); // allow consumer to set autocomplete attr (e.g., one-time-code)
  inputValue = input<string>(); // Direct value input for non-form usage

  private platform = inject(Platform);

  constructor() {
    // Sync inputValue input with internal _value signal when not using form control
    effect(() => {
      const val = this.inputValue();
      if (val !== undefined) {
        this._value.set(val);
      }
    });
  }

  // Output events
  valueChanged = output<string>();
  focusEvent = output<Event>();
  blurEvent = output<Event>();
  iconEndClick = output<MouseEvent>();

  // Internal state
  private _value = signal('');
  private _formControlDisabled = signal(false);
  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  private formControl: FormControl;
  private destroyRef$ = inject(DestroyRef);

  public hasError = signal(false);
  public isTouched = signal(false);
  public isDirty = signal(false);
  private _isRequiredFromValidator = signal(false);
  public isRequired = computed(
    () => this.required() ?? this._isRequiredFromValidator(),
  );

  inputElement = viewChild<ElementRef<HTMLInputElement>>('input');
  // Computed properties
  readonly type = computed(() =>
    this.inputMode() === 'password' ? 'password' : this.dsType() || 'text',
  );
  protected readonly effectiveDisabled = computed(
    () => this.disabled() || this._formControlDisabled(),
  );

  protected readonly value = computed(() => this._value());

  // Character count for maxLength display
  protected readonly characterCount = computed(() => {
    if (!this.showCharacterCount()) return null;
    const max = this.maxLength();
    if (!max) return null;
    const current = this._value()?.length || 0;
    return `${current}/${max}`;
  });

  protected readonly outerContainerClasses = computed(() =>
    [
      'inline-flex items-center border student:border-[4px] student:border-b-[8px]  border-neutral-cool-100 bg-surface-primary',
      this.effectiveDisabled()
        ? 'border-neutral-cool-100 text-content-low !bg-surface-secondary-light'
        : 'focus-within:border-neutral-cool-700 hover:focus-within:border-neutral-cool-700 hover:border-neutral-cool-200',
      'text-ds-base font-semibold text-content-high w-full',
      this.hasError() ? '!border-error !bg-surface-danger-subtle' : '',
      this.outerContainerClass() ? this.outerContainerClass() : '',
    ].join(' '),
  );

  protected readonly inputFinalCss = computed(() => [
    `outline-0 border-0 p-0 m-0 leading-normal flex-grow bg-transparent placeholder:text-content-low w-full ${this.inputClasses()}`,
  ]);

  protected readonly inputWrapperClasses = computed(() =>
    [
      'flex items-center gap-2 flex-grow',
      this.prefix() || this.iconStart() ? 'ps-[46px]' : '',
      this.iconEnd() ? 'pe-7' : '',
    ].join(' '),
  );

  // Conditional gap class - only add gap when there's content above or below the input
  protected readonly rootContainerClasses = computed(() => {
    const hasHeader = !!this.label();
    const hasFooter =
      !!this.errorMessage() ||
      (!!this.hint() && !this.hasError()) ||
      !!this.characterCount();
    return hasHeader || hasFooter ? 'gap-1' : '';
  });

  private injector = inject(Injector);
  private elementRef = inject(ElementRef);

  ngOnInit(): void {
    const ngControl = this.injector.get(NgControl, null);
    if (!ngControl) {
      return;
    }
    if (ngControl instanceof FormControlName) {
      this.formControl = this.injector
        .get(FormGroupDirective)
        .getControl(ngControl);
    } else if (ngControl instanceof FormControlDirective) {
      this.formControl = (ngControl as FormControlDirective)
        .form as FormControl;
    } else {
      // Unknown control type; treat as no form control
      this.formControl = undefined as any;
    }

    if (!this.formControl) {
      // Used without Angular FormControl; skip status/validator wiring
      return;
    }

    this.formControl.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef$), distinctUntilChanged())
      .subscribe((status) => {
        this.hasError.set(!this.suppressFormError() && status === 'INVALID');
        this.isTouched.set(this.formControl.touched);
        this.isDirty.set(this.formControl.dirty);
      });
    this._isRequiredFromValidator.set(
      this.formControl.hasValidator(Validators.required),
    );
  }

  writeValue(value: any): void {
    this._value.set(value || '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = () => {
      fn();
      this.isTouched.set(true);
    };
  }

  setDisabledState(isDisabled: boolean): void {
    this._formControlDisabled.set(isDisabled);
  }

  // Input handling
  onInput(event: Event) {
    if (this.readOnly()) {
      // Prevent modifications when read-only
      (event.target as HTMLInputElement).value = this._value();
      return;
    }
    let value = (event.target as HTMLInputElement).value;

    // Enforce maxLength programmatically (Android doesn't always respect the HTML attribute)
    const max = this.maxLength();
    if (max !== undefined && max !== null) {
      const maxNum = typeof max === 'string' ? parseInt(max, 10) : max;
      if (!isNaN(maxNum) && value.length > maxNum) {
        value = value.substring(0, maxNum);
        (event.target as HTMLInputElement).value = value;
      }
    }

    this._value.set(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  handleFocus(event: Event) {
    this.focusEvent.emit(event);
  }

  handleBlur(event: Event) {
    this.onTouched();
    this.blurEvent.emit(event);
  }

  focus() {
    if (!this.platform.IOS) {
      this.inputElement()?.nativeElement.focus();
    }
  }

  onIconEndClick(event: MouseEvent) {
    this.iconEndClick.emit(event);
  }

  get nativeElement() {
    return this.elementRef.nativeElement as HTMLInputElement;
  }
}
