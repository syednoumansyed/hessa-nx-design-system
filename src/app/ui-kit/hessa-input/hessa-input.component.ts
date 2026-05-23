import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Injector,
  Input,
  OnInit,
  Output,
  ViewChild,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  NgControl,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faPen } from '@fortawesome/pro-light-svg-icons';
import {
  IonInput,
  IonItem,
  IonLabel,
  Platform,
} from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { isValidPhoneNumber } from 'libphonenumber-js';

@Component({
  selector: 'app-hes-input',
  templateUrl: './hessa-input.component.html',
  styleUrls: ['./hessa-input.component.scss'],
  standalone: true,
  imports: [
    IonLabel,
    IonInput,
    FontAwesomeModule,
    IonItem,
    RouterModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HesButtonModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: HessaInputComponent,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HessaInputComponent),
      multi: true,
    },
  ],
})
export class HessaInputComponent
  implements ControlValueAccessor, AfterViewInit, OnInit
{
  faPen = faPen;
  @Input() decimalPrecision: number | null = null;
  @Input() iconPrefix!: IconDefinition;
  @Input() iconSuffix!: IconDefinition;

  @Input() errorText: string | undefined;
  @Input() helperText: string | undefined;
  @Input() helperLink: string | any[] | null | undefined;

  @Input() labelIcon: string | undefined;

  @Input() label: string | undefined;
  @Input() placeholder: string | undefined | null;

  @Input() maxLength: number | undefined;
  @Input() counter: boolean = false;

  @Input() required: boolean = false;

  @Input() fill: 'solid' | 'outline' = 'solid';

  @Input() name: string | undefined;

  @Input() disabled: boolean = false;

  @Input() readonly: boolean | undefined = false;

  @Input() clearInput = false;
  @Input() type:
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'month'
    | 'number'
    | 'password'
    | 'search'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week' = 'text';
  @Input() inputMode:
    | 'decimal'
    | 'email'
    | 'none'
    | 'numeric'
    | 'search'
    | 'tel'
    | 'text'
    | 'url'
    | undefined = undefined;
  @Input() autoComplete?: string;
  @Input() autoFocus = false;
  @Input() isOnlyNumaric: boolean;
  @Input() inputCssClass = '';

  isEditabeControl = input(false);
  isEditable = model<boolean>(false);

  @Output() ionChange: any;
  @Output() ionInput: any;

  private _value: any = '';

  get value(): any {
    return this._value;
  }

  set value(val: any) {
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  isValidChildControl = signal(true);

  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(
    public platform: Platform,
    private injector: Injector,
  ) {}

  private ngControl: NgControl;

  private isMobile = isMobile();
  ngOnInit() {
    try {
      this.ngControl = this.injector.get(NgControl);
      if (this.ngControl != null) {
        // Setting the valueAccessor directly (results in a circular dependency)
        // this.ngControl.valueAccessor = this;
      }
    } catch {}
  }

  ngAfterViewInit(): void {
    this.ngControl?.statusChanges?.subscribe((status) => {
      if (status === 'INVALID') {
        // The control is invalid
        this.isValidChildControl.set(false);
      } else {
        // The control is valid
        this.isValidChildControl.set(true);
      }
    });

    if (this.autoFocus) {
      setTimeout(
        () => {
          this.ionInputEl.setFocus();
        },
        this.isMobile ? 1000 : 500,
      );
    }
  }

  writeValue(value: any): void {
    if (this.decimalPrecision) {
      this._value = this.applyDecimalPrecision(value);
    } else {
      this._value = value || '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const errors: any = {};
    let isValid = true;
    // Implement your validation logic here
    if (this.type === 'tel') {
      const phoneNumber = control.value;
      const isNumber = /^\d+$/.test(phoneNumber);
      const isValidPhoneNumberSA = isValidPhoneNumber(phoneNumber, 'SA');
      isValid = isNumber && isValidPhoneNumberSA;
      if (phoneNumber.length && !isValid) {
        errors['invalidPhoneNumber'] = phoneNumber;
      }
    }
    // Return null if valid, otherwise return a ValidationErrors object
    return isValid ? null : errors;
  }

  onInputChange(event: any) {
    this.ionChange?.emit(event);
  }

  @ViewChild('input', { static: true }) ionInputEl!: IonInput;
  onInput(ev: any) {
    const value: string = ev.target!.value;

    // Remove non-alphanumeric characters if numeric is allowed when type is text for some reason
    const filteredValue = this.isOnlyNumaric
      ? value.replace(/[^0-9]/g, '')
      : value.trimStart();

    /**
     * Update both the state variable and
     * the component to keep them in sync.
     */
    this.ionInputEl.value = this.value = filteredValue;
    this.ionChange?.emit(ev);
  }

  onBlur(ev: any) {
    if (!this.decimalPrecision) return;
    const value: string = ev.target!.value;

    /**
     * Update both the state variable and
     * the component to keep them in sync.
     */
    this.ionInputEl.value = this.value = this.applyDecimalPrecision(value);
    this.ionChange?.emit(ev);
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.type === 'number' || this.type === 'tel') {
      const allowedKeys = [
        'Backspace',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
        'Delete',
      ];
      const isNumber = /^[0-9]$/;
      if (
        !isNumber.test(event.key) &&
        !allowedKeys.includes(event.key) &&
        !(
          event.ctrlKey &&
          ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())
        )
      ) {
        event.preventDefault();
      }
    }
  }

  isRtl() {
    return this.platform.isRTL;
  }

  toggleIsEditable() {
    this.isEditable.update((v) => !v);
  }

  private applyDecimalPrecision(value: string): string {
    return formatDecimalValue(value, this.decimalPrecision!);
  }
}

function formatDecimalValue(
  value: string | number,
  decimalPrecision: number,
): string {
  if (value === null || value === undefined || value === '') return '';

  const num = typeof value === 'string' ? parseFloat(value) : value;

  return isNaN(num) ? '' : num.toFixed(decimalPrecision);
}
