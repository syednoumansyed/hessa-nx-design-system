import {
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl,
  FormControl,
  FormControlName,
  FormGroupDirective,
  FormControlDirective,
  Validators,
} from '@angular/forms';
import { Injector } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  DsPickerSelectConfig,
  DsPickerSelectOption,
} from './picker-select.interface';
import { DsModalService } from '@ds/modal/modal.service';
import { DsPickerSelectContentComponent } from './picker-select-content/picker-select-content.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/pro-regular-svg-icons';
import { TranslocoService } from '@jsverse/transloco';
import { isRtl } from '@shared/utils/platform';

@Component({
  selector: 'app-ds-picker-select',
  standalone: true,
  imports: [DsIconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsPickerSelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex w-full flex-col gap-1">
      <!-- Label -->
      @if (label()) {
        <label class="single-line-xs-mid-emphasis ps-ds-md">
          {{ label() }}
          @if (isRequired()) {
            <span class="text-error">*</span>
          }
        </label>
      }

      <!-- Trigger Button -->
      <button
        type="button"
        class="relative flex w-full items-center justify-between rounded-2xl border p-ds-lg transition-colors student:border-[4px] student:border-b-[8px]"
        [class.border-neutral-cool-100]="!hasError()"
        [class.hover:border-neutral-cool-200]="
          !effectiveDisabled() && !hasError()
        "
        [class.border-error]="hasError()"
        [class.bg-surface-danger-subtle]="hasError()"
        [class.bg-surface-secondary-light]="effectiveDisabled()"
        [class.cursor-not-allowed]="effectiveDisabled()"
        [class.opacity-60]="effectiveDisabled()"
        [disabled]="effectiveDisabled()"
        (click)="openPicker()"
      >
        <span
          class="text-ds-base font-semibold"
          [class.text-content-high]="hasSelection()"
          [class.text-content-low]="!hasSelection()"
        >
          {{ displayText() }}
        </span>

        <app-ds-icon
          [icon]="chevronIcon()"
          class="text-content-mid"
          size="lg"
        />
      </button>
    </div>
  `,
})
export class DsPickerSelectComponent implements ControlValueAccessor, OnInit {
  // Inputs
  readonly config = input.required<DsPickerSelectConfig>();

  // Services
  private readonly modalService = inject(DsModalService);
  private readonly transloco = inject(TranslocoService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  // Icons
  private readonly isRtl = isRtl();
  protected readonly chevronIcon = computed(() =>
    this.isRtl ? faChevronLeft : faChevronRight,
  );

  // Internal state
  private readonly _value = signal<ObjId[] | ObjId | null>(null);
  private readonly _formControlDisabled = signal(false);
  private readonly _isRequiredFromValidator = signal(false);

  // Form control state
  readonly hasError = signal(false);
  readonly isTouched = signal(false);

  // CVA callbacks
  private onChange: (value: ObjId[] | ObjId | null) => void = () => {};
  private onTouched: () => void = () => {};
  private formControl: FormControl | undefined;

  // Computed properties
  readonly label = computed(() => this.config().label);
  readonly placeholder = computed(
    () => this.config().placeholder ?? 'Select...',
  );
  readonly isMultiple = computed(() => this.config().isMultiple ?? true);
  readonly options = computed(() => this.config().options ?? []);
  readonly effectiveDisabled = computed(
    () => this.config().disabled || this._formControlDisabled(),
  );
  readonly isRequired = computed(
    () => this.config().required ?? this._isRequiredFromValidator(),
  );

  // Computed: selected items based on current value
  readonly selectedItems = computed<DsPickerSelectOption[]>(() => {
    const value = this._value();
    const opts = this.options();
    if (!value) return [];

    const ids = Array.isArray(value) ? value : [value];
    return opts.filter((opt) => ids.includes(opt.id));
  });

  readonly hasSelection = computed(() => this.selectedItems().length > 0);

  // Computed: item label from config
  readonly itemLabel = computed(() => this.config().itemLabel);

  // Computed: display text for trigger
  readonly displayText = computed(() => {
    const selected = this.selectedItems();
    if (selected.length === 0) {
      return this.placeholder();
    }

    // Show item name if only one item selected (both single and multi-select)
    if (selected.length === 1) {
      return selected[0]?.display ?? this.placeholder();
    }

    // Multiple items selected: show count with item label
    const label = this.itemLabel();
    if (label) {
      return this.transloco.translate('global.picker_select.items_selected', {
        count: selected.length,
        itemLabel: label,
      });
    }

    return `${selected.length} items selected`;
  });

  ngOnInit(): void {
    const ngControl = this.injector.get(NgControl, null);
    if (!ngControl) return;

    if (ngControl instanceof FormControlName) {
      this.formControl = this.injector
        .get(FormGroupDirective)
        .getControl(ngControl);
    } else if (ngControl instanceof FormControlDirective) {
      this.formControl = (ngControl as FormControlDirective)
        .form as FormControl;
    }

    if (!this.formControl) return;

    this.formControl.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged())
      .subscribe((status) => {
        this.hasError.set(
          status === 'INVALID' && (this.formControl?.touched ?? false),
        );
        this.isTouched.set(this.formControl?.touched ?? false);
      });

    this._isRequiredFromValidator.set(
      this.formControl.hasValidator(Validators.required),
    );
  }

  // ControlValueAccessor implementation
  writeValue(value: ObjId[] | ObjId | null): void {
    this._value.set(value);
  }

  registerOnChange(fn: (value: ObjId[] | ObjId | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = () => {
      fn();
      this.isTouched.set(true);
      // Update error state when touched
      if (this.formControl) {
        this.hasError.set(this.formControl.invalid && this.formControl.touched);
      }
    };
  }

  setDisabledState(isDisabled: boolean): void {
    this._formControlDisabled.set(isDisabled);
  }

  // Open the picker modal
  async openPicker(): Promise<void> {
    if (this.effectiveDisabled()) return;

    const config = this.config();
    const currentValue = this._value();
    const initialSelection = currentValue
      ? Array.isArray(currentValue)
        ? currentValue
        : [currentValue]
      : [];

    const modalRef = await this.modalService.open<
      {
        options: DsPickerSelectOption[];
        initialSelection: ObjId[];
        isMultiple: boolean;
      },
      ObjId[]
    >({
      component: DsPickerSelectContentComponent,
      componentProps: {
        options: config.options,
        initialSelection,
        isMultiple: config.isMultiple ?? true,
      },
      headerConfig: {
        title: config.itemLabel
          ? this.transloco.translate('global.picker_select.select_title', {
              itemLabel: config.itemLabel,
            })
          : this.transloco.translate('global.select.btn'),
        showBackButton: true,
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text:
            config.selectButtonText ??
            this.transloco.translate('global.select.btn'),
        },
        buttonSize: 'lg',
      },
      size: 'sm',
    });

    const result = await modalRef.onDismiss();

    // Mark as touched when modal closes
    this.onTouched();

    if (result.role === 'confirm' && result.data) {
      const selectedIds = result.data;

      // Convert to single value if not multiple
      const newValue = this.isMultiple()
        ? selectedIds
        : (selectedIds[0] ?? null);

      this._value.set(newValue);
      this.onChange(newValue);
    }
  }
}
