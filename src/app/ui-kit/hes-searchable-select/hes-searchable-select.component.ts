import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  IonSearchbar,
  IonPopover,
  IonRadio,
  IonRadioGroup,
  IonCheckbox,
  IonList,
  IonItem,
  IonContent,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  IonModal,
  IonChip,
  IonIcon,
} from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { faChevronUp, faChevronDown } from '@fortawesome/pro-solid-svg-icons';
import { HesCheckboxGroupComponent } from '@ui-kit/hes-checkbox/hes-checkbox-group.component';
import { IPagination } from '@shared/interfaces';
import { close } from 'ionicons/icons';

import { NgClass, NgTemplateOutlet } from '@angular/common';
import { randomId } from '@shared/utils/randomId';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toObservable } from '@angular/core/rxjs-interop';
import { faPen } from '@fortawesome/pro-light-svg-icons';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { addIcons } from 'ionicons';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import { faClock } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-hes-searchable-select',
  standalone: true,
  imports: [
    IonContent,
    IonSearchbar,
    IonPopover,
    IonList,
    IonItem,
    IonCheckbox,
    IonLabel,
    FormsModule,
    IonRadio,
    IonRadioGroup,
    HesButtonModule,
    HesCheckboxGroupComponent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
    IonChip,
    IonIcon,
    TranslocoDirective,
    EnumLangPipe,
    NgClass,
    NgTemplateOutlet,
  ],
  templateUrl: './hes-searchable-select.component.html',
  styleUrls: ['./hes-searchable-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HesSearchableSelectComponent),
      multi: true,
    },
  ],
})
export class HesSearchableSelectComponent implements OnInit {
  @ViewChild('popover', { read: ElementRef }) popoverRef: ElementRef;
  @ViewChild('popover') popover: IonPopover;
  faChevronUp = faChevronUp;
  faChevronDown = faChevronDown;
  faPen = faPen;
  faClock = faClock;
  randomId: string = randomId();

  transloco = inject(TranslocoService);

  /**
   * Whether to show the clear button or not.
   */
  showClearBtn = input(true);

  /**
   * Whether selection can be set to nothing or not.
   */
  allowEmptySelection = input(false);

  data = input.required<any[]>();
  pagination = input<IPagination>();
  multiple = input(false);
  showChips = input(true);
  searchable = input(true);
  labelIcon = input<any>(undefined);
  inputClass = input<string>();
  showClockIcon = input<boolean>(false);
  // define popover size
  // if you pass selectOptionTemplate this value will always be auto
  popoverSize = input<'auto' | 'cover'>('cover');
  // Array of values that should be disabled
  disabledValues = input<Array<string | number>>([]);

  /**
   * Indicates whether the searchable select component should be displayed in condensed mode.
   * used for hes-table floating filters
   * @default false
   */
  condensed = input(false);
  persistPlaceholder = input(false);
  fill = input<'solid' | 'outline'>('solid');
  placeholder = input<string>();
  label = input<string>();
  /**
   * Indicates whether the input is required or not.
   * used only to show/hide asterisk (*) in label
   * @default false
   */
  required = input<boolean>(false);
  searchDebounceTime = input(400);
  disabled = model(false);
  readonly = model(false);
  selectOptionTemplate = input<TemplateRef<any>>();
  selectedDisplayTemplate = input<TemplateRef<any>>();

  isEditabeControl = input(false);
  isEditable = model(false);

  selectedValue = model<any>();
  selectedValues = model<any[]>([]);
  initSelectedValues = input<ISelectValue[]>();
  /**
   * input that will apply enum translation to items displayed value
   */
  isEnumTranslate = input<boolean>(false);
  /**
   * function that will format displayedValue in chips
   * takes priority over isEnumTranslate
   */
  formatChipsSelectedValueFn = input<(value: string) => string>();

  /**
   * signal that stores the model for the search input.
   */
  readonly SearchTxt = signal('');

  // same as ionInput event in ion-searchbar
  // gets affected by debounceTime
  onSearchInputChanged = output<string>();
  // same as ionChange event in ion-searchbar
  onSearchChanged = output<string>();

  loadMore = output<InfiniteScrollCustomEvent>();

  onSelectionChange = output<any>();
  popoverClosed = output<void>();
  chipRemoved = output<void>();

  isOpen = signal(false);
  isChipsModalOpen = signal<boolean>(false);

  onChange: any = () => {};
  onTouched: any = () => {};

  /**
   * Map that stores the data array as key-value pairs.
   * The key is the value of each item in the data array,
   * and the value is the corresponding item object.
   */
  dataMap = computed(() => {
    const dataArr = [...this.data(), ...(this.initSelectedValues() ?? [])];
    const dataMap = new Map(dataArr?.map((item) => [item.value, item]));
    return dataMap;
  });

  /**
   * Computed data with disabled values applied.
   * Merges the disabled property from both item.disabled and disabledValues input.
   */
  computedData = computed(() => {
    const disabledVals = this.disabledValues();
    return this.data().map((item) => ({
      ...item,
      disabled: item.disabled || disabledVals.includes(item.value),
    }));
  });

  /**
   * Represents the selected value object.
   * @remarks
   * The `selectedValueObj` property is a computed property that returns the selected value object based on the `selectedValue` and `dataMap` properties.
   */
  selectedValueObj = signal<any>(undefined);

  /**
   * An array of selected values objects.
   */
  selectedValuesObjs = signal<any[]>([]);

  /**
   * The displayed values of the selected multiple values.
   */
  selectedMultipleDisplayedval = computed(() => {
    const selectedValuesObjs = this.selectedValuesObjs();
    return selectedValuesObjs?.map((value) =>
      this.isEnumTranslate()
        ? this.transloco.translate('enum.' + value.displayedValue)
        : value.displayedValue,
    );
  });

  constructor() {
    addIcons({ close });
    toObservable(this.dataMap).subscribe((_data) => {
      if (this.multiple()) {
        this.updateSelectedValuesObjs(this.selectedValues());
      } else this.updateSelectedValueObj(this.selectedValue());
    });
  }

  ngOnInit(): void {}

  writeValue(value: any[]): void {
    if (this.multiple()) {
      if (value && value.length) {
        this.updateSelectedValues(value, false);
      } else {
        this.selectedValues.set([]);
        this.selectedValuesObjs.set([]);
      }
    } else {
      this.selectedValue.set(value);
      this.updateSelectedValueObj(value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled.set(isDisabled);
  }

  searchInputChanged(_event: any) {
    this.onSearchInputChanged.emit(_event.detail.value);
  }

  searchChanged(_event: any) {
    this.onSearchChanged.emit(_event.detail.value);
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.loadMore.emit(ev);
  }

  removeSelectedValue(id: number | { id: number }) {
    const selectedValues = this.selectedValues();

    if (selectedValues && selectedValues.length > 0) {
      const targetId = typeof id === 'object' && id !== null ? id.id : id;

      const newSelectedValues = selectedValues.filter((value) => {
        if (typeof value === 'object' && value !== null && 'id' in value) {
          return value.id !== targetId;
        }
        return value !== targetId;
      });

      this.updateSelectedValues(newSelectedValues);
      this.chipRemoved.emit();
    }
  }

  onWillPresent() {
    this.isOpen.set(true);
    const triggerEl = document.getElementById(
      'searchable-select-' + this.randomId,
    );
    if (triggerEl && this.popoverRef) {
      this.popoverRef.nativeElement.style.setProperty(
        '--min-width',
        `${triggerEl.offsetWidth}px`,
      );
    }
  }

  onWillDismiss() {
    this.isOpen.set(false);
    if (this.SearchTxt()) {
      this.SearchTxt.set('');
      this.onSearchInputChanged.emit('');
    }
    this.popoverClosed.emit();
  }

  updateSelectedValue(value: any) {
    this.selectedValue.set(value);
    this.updateSelectedValueObj(value);
    this.onChange(value);
    this.onSelectionChange.emit(value);
    this.popover.dismiss();
  }

  updateSelectedValues(values: any[], callOnChange = true) {
    this.selectedValues.set(values);
    this.updateSelectedValuesObjs(values);
    callOnChange && this.onChange(values);
    this.onSelectionChange.emit(values);
  }

  private updateSelectedValuesObjs(newSelectedValues: any[]) {
    let newSelectedValObjs: any[] = [];
    newSelectedValues.forEach((value) => {
      const valueObj = this.dataMap().get(value);
      if (valueObj) newSelectedValObjs.push(valueObj);
    });

    this.selectedValuesObjs.update((oldSelectedValObjs) => {
      const newValues = newSelectedValObjs.filter(
        (selectedValObj) =>
          !oldSelectedValObjs.some(
            (oldValueObj) => oldValueObj.value === selectedValObj.value,
          ),
      );

      const x = [
        ...oldSelectedValObjs.filter((oldSelectedValObj) => {
          return newSelectedValues.some(
            (newSelectedVal) => oldSelectedValObj.value === newSelectedVal,
          );
        }),
        ...newValues,
      ];

      return x;
    });
  }

  private updateSelectedValueObj(newSelectedValue: any) {
    const valueObj = this.dataMap().get(newSelectedValue);
    if (valueObj) this.selectedValueObj.set(valueObj);
  }

  onClear() {
    this.selectedValue.set(undefined);
    this.selectedValueObj.set(undefined);
    this.selectedValues.set([]);
    this.selectedValuesObjs.set([]);
    this.onChange(this.multiple() ? [] : undefined);
    this.onSelectionChange.emit(this.multiple() ? [] : undefined);
    this.popover.dismiss();
  }

  toggleIsEditable() {
    this.isEditable.update((v) => !v);
  }
}
