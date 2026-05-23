import {
  Component,
  forwardRef,
  input,
  signal,
  computed,
  inject,
  viewChild,
  effect,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Platform } from '@angular/cdk/platform';
import { IonModal } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { DsInputComponent } from '@ds/input/input.component';
import { DsTimePickerComponent } from '../time-picker.component';
import {
  DS_TRANSLATION_TOKEN,
  DsTranslationService,
} from '@ds/i18n/ds-translation.token';
import { isMobile } from '@shared/utils/platform';
import { faClock } from '@fortawesome/pro-light-svg-icons';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';

@Component({
  selector: 'ds-time-picker-control',
  standalone: true,
  imports: [
    CommonModule,
    DsInputComponent,
    IonModal,
    DsTimePickerComponent,
    OverlayModule,
  ],
  templateUrl: './time-picker-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsTimePickerControlComponent),
      multi: true,
    },
  ],
})
export class DsTimePickerControlComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>('Time');
  placeholder = input<string>('Select time');
  minuteStep = input<number>(1);
  disabled = input(false);
  isMobile = isMobile();
  // internal signals
  valueInternal = signal<string>('');
  workingValue = signal<string>(''); // staging while picker open
  isOpen = signal(false);
  openMode = signal<'popover' | 'modal' | null>(null);
  private translation = inject<DsTranslationService>(DS_TRANSLATION_TOKEN);
  lang = this.translation.getActiveLang() || 'en';
  // refs
  inputRef = viewChild(DsInputComponent);
  pickerRef = viewChild(DsTimePickerComponent);

  // unique trigger id
  triggerId = `tp-ctrl-${Math.random().toString(36).substring(2, 9) + new Date().getTime()}`;

  // Localized display (canonical stored value remains in valueInternal as HH:MM AM/PM)
  protected readonly displayValue = computed(() => {
    const raw = this.valueInternal();
    if (!raw) return '';
    // Accept H:MM, HH:MM, H:M, HH:M with AM/PM (flexible for external values)
    const m = raw.match(/^(\d{1,2}):(\d{1,2})\s(AM|PM)$/i);
    if (!m) return raw; // fallback to raw if pattern unexpected
    let [, hhRaw, mmRaw, suffixRaw] = m;
    const hNum = Number(hhRaw);
    const mNum = Number(mmRaw);
    if (hNum < 1 || hNum > 12 || mNum < 0 || mNum > 59) return raw; // invalid ranges
    const hh = hNum.toString().padStart(2, '0');
    const mm = mNum.toString().padStart(2, '0');
    const suffix = suffixRaw.toUpperCase();
    const baseLang = (this.lang || 'en').toLowerCase().split('-')[0];
    const normalized = baseLang === 'ar' ? 'ar' : 'en';
    const localizedSuffix =
      normalized === 'ar' ? (suffix === 'AM' ? 'ص' : 'م') : suffix;
    return `${hh}:${mm} ${localizedSuffix}`;
  });

  // Disabled state can come from input binding OR reactive form (setDisabledState)
  private formDisabled = signal(false);
  protected readonly effectiveDisabled = computed(
    () => this.disabled() || this.formDisabled(),
  );

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly scrollStrategy =
    inject(Overlay).scrollStrategies.reposition();
  timeIcon = faClock;
  // ControlValueAccessor
  writeValue(val: string | null): void {
    if (!val) {
      this.valueInternal.set('');
      if (!this.isOpen()) this.workingValue.set('');
      return;
    }
    this.valueInternal.set(val);
    if (!this.isOpen()) this.workingValue.set(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
    // Close picker if it was open and gets disabled
    if (isDisabled && this.isOpen()) {
      this.isOpen.set(false);
      this.openMode.set(null);
    }
  }

  // open logic
  private openInternal() {
    if (this.effectiveDisabled()) return;
    this.workingValue.set(this.valueInternal());
    this.openMode.set(this.isMobile ? 'modal' : 'popover');
    this.isOpen.set(true);
  }

  openPicker() {
    this.openInternal();
  }
  openFromKey(ev: Event) {
    const k = ev as KeyboardEvent;
    k.preventDefault();
    this.openInternal();
  }

  onPopoverDismiss(ev?: Event) {
    // When closing popover without explicit cancel we confirm current working value
    if (this.isOpen()) {
      this.confirm();
    }
  }

  onModalClose() {
    // discard working value
    this.isOpen.set(false);
    this.openMode.set(null);
    this.onTouched();
    this.confirm();
  }

  onModalConfirm() {
    this.confirm();
  }

  onPickerValue(val: string) {
    // live update staging value
    this.workingValue.set(val);
  }

  private confirm() {
    const val = this.workingValue();
    this.valueInternal.set(val);
    this.onChange(val || null);
    this.onTouched();
    this.isOpen.set(false);
    this.openMode.set(null);
  }

  // effect to push workingValue into child picker when open
  syncEffect = effect(() => {
    if (this.isOpen()) {
      const val = this.workingValue();
      const picker = this.pickerRef();
      if (picker) {
        picker.writeValue(val || null);
      }
    }
  });

  // effect to sync localized display value into the visual input (does not alter stored canonical value)
  inputSyncEffect = effect(() => {
    const localized = this.displayValue();
    const inputCmp = this.inputRef();
    if (inputCmp) {
      inputCmp.writeValue(localized);
    }
  });
}
