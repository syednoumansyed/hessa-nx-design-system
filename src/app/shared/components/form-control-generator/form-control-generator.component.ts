import {
  Component,
  EnvironmentInjector,
  OnInit,
  Optional,
  TemplateRef,
  ViewEncapsulation,
  WritableSignal,
  computed,
  effect,
  inject,
  model,
  runInInjectionContext,
  signal,
} from '@angular/core';
import {
  IonRadio,
  IonLabel,
  IonRadioGroup,
  IonTextarea,
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';
import { NgClass, NgIf, NgStyle } from '@angular/common';
import { faCalendarDays } from '@fortawesome/pro-solid-svg-icons';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { HesRadioDirective } from '@ui-kit/hes-radio/hes-radio.directive';
import { randomId } from '@shared/utils/randomId';
import { HesCheckboxModule } from '@ui-kit/hes-checkbox/hes-checkbox.module';
import {
  ControlContainer,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { close } from 'ionicons/icons';

import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesAttachmentFormControlComponent } from '@ui-kit/hes-attachment-form-control/hes-attachment-form-control.component';
import { HesSchoolStructureControlComponent } from '@ui-kit/hes-school-structure-control/hes-school-structure-control.component';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesSearchableSelectComponent } from '@ui-kit/hes-searchable-select/hes-searchable-select.component';
import { IPagination } from '@shared/interfaces';
import { isMobile } from '@shared/utils/platform';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { HesEditorComponent } from '../../../ui-kit/hes-editor/hes-editor.component';
import { NoLeadingSpaceDirective } from '@ui-kit/hessa-input/no-leading-space.directive';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcceptFileType } from '@ui-kit/hes-attachment-form-control/attachment-type.constant';
import { skip } from 'rxjs';
import {
  TUI_DATE_RANGE_VALUE_TRANSFORMER,
  TUI_DATE_VALUE_TRANSFORMER,
  tuiCreateTimePeriods,
  TuiInputDateModule,
  TuiInputDateRangeModule,
  TuiInputTimeModule,
  tuiInputTimeOptionsProvider,
  TuiToggleModule,
} from '@taiga-ui/kit';
import {
  TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
  TuiDialogModule,
  TuiLabelModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';

import { TuiMobileCalendarDialogModule } from '@taiga-ui/addon-mobile';
import { TUI_DATE_SEPARATOR, TuiDay, TuiDayLike, TuiTime } from '@taiga-ui/cdk';
import {
  ExampleDateTransformer,
  getExampleDateRangeTransformer,
} from './date-range-value-transformer';
import { addIcons } from 'ionicons';
import { StructureDepth } from '@shared/utils/school-structure';
import { HesChipSelectorComponent } from '@ui-kit/chip-selector-component/chip-selector.component';
import { HesSearchableCheckboxSelectComponent } from '@shared/components/searchable-checkbox-select/hes-searchable-checkbox-select.component';
import { MobileCalendarMinScrollDirective } from '@shared/directives/mobile-calendar-min-scroll.directive';
import { HesCheckboxWithInputGroupComponent } from '@ui-kit/hes-checkbox-with-input-group/hes-checkbox-with-input-group.component';

export interface ISelectValue<T = any> {
  value: string | number;
  displayedValue: string;
  extraData?: T; // Optional extraData
  disabled?: boolean; // Optional disabled state for individual options
}

export interface ICheckboxWithInputValue {
  id: string | number;
  inputValue: string;
}

export interface IControl {
  labelIcon?: string;
  label?: string;
  subLabel?: string;
  placeholder?: string;
  type:
    | 'input'
    | 'searchable-select'
    | 'date'
    | 'date-time'
    | 'date-range'
    | 'radio'
    | 'checkbox'
    | 'textarea'
    | 'file'
    | 'school-structure'
    | 'editor'
    | 'chip-selector'
    | 'searchable-checkbox-select';
  noOfChild?: WritableSignal<number>;
  formControlName?: string;
  selectValues?: Array<ISelectValue>; // for select, radio, checkbox
  initSelectValues?: Array<ISelectValue>; // for making sure init values have the ISelectValue item incase of pagination
  inputType?:
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
    | 'week'; // for input
  required: boolean;
  errorMessage?: { [key: string]: string };
  onValueChange?: (value: any, control?: any) => void;
  isMultiple?: boolean; // for select
  readonly?: boolean; // for input
  helperText?: string;
  helperTextColor?: string;
  acceptFileTypes?: AcceptFileType;
  maxSizeInMB?: number;
  maxLength?: number;
  searchableSelectObject?: {
    pagination?: IPagination;
    onloadMore?: (ev: InfiniteScrollCustomEvent) => void;
    onSearchChanged?: (value: string) => void;
    selectOptionTemplate?: TemplateRef<any>;
    selectedDisplayTemplate?: TemplateRef<any>;
    showChips?: boolean;
    searchable?: boolean;
    persistPlaceholder?: boolean;
    fill?: 'solid' | 'outline';
    condensed?: boolean;
    allowEmptySelection?: boolean;
    showClearBtn?: boolean;
    formatSelectedValueInChipsFn?: (value: any) => string;
    showClockIcon?: boolean;
    disabledValues?: Array<string | number>; // Array of values that should be disabled
  };
  SchoolStructureListingType?: SchoolStructureEntityType;
  uploadImageUrl?: string;
  isEnumTranslate?: boolean;
  datePickerConfig?: {
    fill?: 'solid' | 'outline'; // TODO
    condensed?: boolean; // TODO
    readonly?: boolean; // TODO
    // Min date
    min?: TuiDay | null;
    // Max date
    max?: TuiDay | null;
    //Minimal length of range
    minLength?: TuiDayLike | null;
    // Maximal length of range
    maxLength?: TuiDayLike | null;
    showClearBtn?: boolean;
  };
  isEditableControl?: boolean;
  isEditable?: WritableSignal<boolean>;
  editorConfig?: {
    allowImgUpload: boolean;
    allowYoutubeExtension?: boolean;
    previewOnly?: boolean;
    preview?: boolean;
    uploadAsNonBinary?: boolean;
  };
  schoolStructureControlConfig?: {
    depth?: StructureDepth;
    allowedSelections?: Array<SchoolStructureEntityType>;
  };
  inputCssClass?: string;
  decimalPrecision?: number;
  // for checkbox
  allowSelectAll?: boolean;
  /**
   * Configuration for the input fields shown with checkboxes.
   * When provided, shows an input field next to each checkbox.
   * The form value will be an array of objects: [{id: 1, inputValue: "text"}]
   * When undefined, maintains current behavior: [1, 2, 3]
   */
  checkboxInputConfig?: {
    placeholder?: string;
    label?: string;
    inputType?: 'text' | 'number' | 'email' | 'tel';
    maxLength?: number;
    required?: boolean;
  };
  /**
   * Indicates the control is readonly but should retain full opacity,
   * overriding default readonly opacity effects.
   */
  viewState?: boolean;
}

export interface IHesDateRange {
  from: Date;
  to: Date;
}

@Component({
  selector: 'app-form-control-generator',
  templateUrl: './form-control-generator.component.html',
  styleUrl: './form-control-generator.component.scss',
  standalone: true,
  imports: [
    HessaInputComponent,
    ReactiveFormsModule,
    IonRadio,
    IonLabel,
    IonRadioGroup,
    FormsModule,
    HesRadioDirective,
    IonTextarea,
    HesCheckboxModule,
    HesCheckboxWithInputGroupComponent,
    HesButtonModule,
    HesAttachmentFormControlComponent,
    HesSchoolStructureControlComponent,
    HesSearchableSelectComponent,
    HesEditorComponent,
    TranslocoDirective,
    NoLeadingSpaceDirective,
    TuiInputDateModule,
    TuiLabelModule,
    TuiTextfieldControllerModule,
    TuiDialogModule,
    TuiMobileCalendarDialogModule,
    TuiInputTimeModule,
    TuiToggleModule,
    TuiInputDateRangeModule,
    NgIf,
    NgClass,
    HesChipSelectorComponent,
    NgStyle,
    HesSearchableCheckboxSelectComponent,
    MobileCalendarMinScrollDirective,
  ],
  providers: [
    {
      provide: TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
      useValue: {
        appearance: 'hes-textfield',
      },
    },
    { provide: TUI_DATE_SEPARATOR, useValue: '/' },
    tuiInputTimeOptionsProvider({
      mode: 'HH:MM',
      maxValues: { HH: 11, MM: 59, SS: 59, MS: 999 },
    }),
    {
      provide: TUI_DATE_VALUE_TRANSFORMER,
      useClass: ExampleDateTransformer,
    },
    {
      provide: TUI_DATE_RANGE_VALUE_TRANSFORMER,
      deps: [TUI_DATE_VALUE_TRANSFORMER],
      useFactory: getExampleDateRangeTransformer,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class FormControlGeneratorComponent implements OnInit {
  StructureDepth = StructureDepth;
  private environmentInjector = inject(EnvironmentInjector);
  faCalendarDays = faCalendarDays;
  form!: FormGroup;
  ErrorText = signal<string | undefined>(undefined);
  randomId: string = randomId();
  chipsModalRandomId: string = randomId();
  isChipsModalOpen = signal<boolean>(false);
  isMobile = isMobile();
  timeSlots = signal(tuiCreateTimePeriods(0, 12, [0, 30]));
  isPm = signal(false);
  selectedDay = signal<Date | null>(null);
  selectedTime = signal<TuiTime | null>(null);
  timePostfix = computed(() => {
    const isPM = this.isPm();
    return isPM ? 'PM' : 'AM';
  });

  noOfChild = signal(isMobile() ? 2 : 3);
  noOfChildForCheckboxWithInput = signal(isMobile() ? 1 : 2);

  selectedSchoolStructureModel$ = toObservable(
    this.schoolStructureListingService?.selectedSchoolStructureModel,
  ).pipe(takeUntilDestroyed(), skip(1));

  controlListing = computed(() => {
    const control = this.control();
    if (control?.SchoolStructureListingType) {
      let listing;
      switch (control.SchoolStructureListingType) {
        case 'company':
        case 'sub-company':
          listing =
            this.schoolStructureListingService.companyWithCampusesList();
          break;
        case 'campus':
          listing = this.schoolStructureListingService.campusList();
          break;
        case 'school':
          listing = this.schoolStructureListingService.schoolsList();
          break;
        case 'level':
          listing = this.schoolStructureListingService.levelsList();
          break;
        case 'class':
          listing = this.schoolStructureListingService.classesList();
          break;
        default:
          listing = null;
          break;
      }
      return listing
        ? listing.map((entity) => ({
            ...entity,
            value: entity.id,
            displayedValue: entity.name,
          }))
        : null;
    }
    return control.selectValues;
  });

  readonly control = model.required<IControl>();

  selectValuesMap = computed(() => {
    const controlListing = this.controlListing();
    return new Map(controlListing?.map((item) => [item['value'], item]));
  });

  // schoolStructureListingService is Optional as it will be provided by the parent component that will use this component
  // as if provided directly here, it will create a different instance of the service for each instance used of this component in one form
  constructor(
    public controlContainer: ControlContainer,
    @Optional()
    private schoolStructureListingService: SchoolStructureListingService,
  ) {
    addIcons({ close });
    effect(() => {
      const control = this.control();
      if (control) this.form = this.controlContainer.control as FormGroup;
    });
  }

  ngOnInit(): void {
    this.form = this.controlContainer.control as FormGroup;
    this.listenToDateTimeControlValueChange();
    this.NotifyOnSearchableSelectControlValueChange();
    if (this.control()?.SchoolStructureListingType) {
      this.selectedSchoolStructureModel$.subscribe((model) => {
        let filterValue;
        switch (this.control().SchoolStructureListingType) {
          case 'company':
          case 'sub-company':
            if (
              this.form.controls[this.formControlName!].value !==
              model.selectedCompany?.id
            ) {
              filterValue = model.selectedCompany?.id;
              this.form.controls[this.formControlName!].setValue(filterValue);
            }
            break;
          case 'campus':
            if (
              this.form.controls[this.formControlName!].value !==
              model.selectedCampus?.id
            ) {
              filterValue = model.selectedCampus?.id;
              this.form.controls[this.formControlName!].setValue(filterValue);
            }
            break;
          case 'school':
            if (
              this.form.controls[this.formControlName!].value !==
              model.selectedSchool?.id
            ) {
              filterValue = model.selectedSchool?.id;
              this.form.controls[this.formControlName!].setValue(filterValue);
            }
            break;
          case 'level':
            if (
              this.form.controls[this.formControlName!].value !==
              model.selectedLevel?.id
            ) {
              filterValue = model.selectedLevel?.id;
              this.form.controls[this.formControlName!].setValue(filterValue);
            }
            break;
          case 'class':
            if (
              this.form.controls[this.formControlName!].value !==
              model.selectedClass?.id
            ) {
              if (!this.control().isMultiple) {
                filterValue = model.selectedClass?.id;
                this.form.controls[this.formControlName!].setValue(filterValue);
              }
            }
            break;
          default:
            filterValue = null;
            break;
        }
      });
    }

    if (this.formControl) {
      this.formControl.statusChanges.subscribe((status) => {
        if (status === 'INVALID') {
          const errors = this.formControl?.errors;
          if (!errors) return;
          const firstErrorKey = Object.keys(errors)[0];
          this.ErrorText.set(this.control().errorMessage?.[firstErrorKey]);
        } else {
          this.ErrorText.set(undefined);
        }
      });
    }
  }

  private listenToDateTimeControlValueChange() {
    if (this.formControlName && this.control()?.type === 'date-time') {
      const initialValue = this.form.controls[this.formControlName].value;
      let { date, tuiTime } = this.createDateTimeObjects(initialValue);
      this.selectedDay.set(date);
      this.selectedTime.set(tuiTime);
      this.form.controls[this.formControlName].valueChanges.subscribe(
        (value) => {
          let { date, tuiTime } = this.createDateTimeObjects(value);
          this.selectedDay.set(date);
          this.selectedTime.set(tuiTime);
        },
      );

      runInInjectionContext(this.environmentInjector, () => {
        // update form control value when internal date control value changes
        // it will be called initally once when form is updated, this call is redundant but it's not causing issues so i am leaving it
        effect(() => {
          const isPm = this.isPm();
          const selectedTime = this.selectedTime();
          const selectedDay = this.selectedDay();
          if (selectedDay && selectedTime) {
            // get hours in 24h format
            let hours;
            if (isPm) {
              hours = selectedTime.hours + 12;
            } else hours = selectedTime.hours;
            // create a date from selected date + selected time + hours in 24h
            selectedDay.setHours(hours, selectedTime.minutes);
            this.form.controls[this.formControlName!].setValue(selectedDay, {
              emitEvent: false,
            });
          }
        });
      });
    }
  }

  private createDateTimeObjects(initialValue: any) {
    let date = null;
    let tuiTime = null;
    if (initialValue && initialValue !== '') {
      date = new Date(initialValue);
      let hours = date.getHours();
      if (hours >= 12) {
        this.isPm.set(true);
        hours -= 12;
      }
      tuiTime = new TuiTime(hours, date.getMinutes(), date.getSeconds());
    }
    return { date, tuiTime };
  }

  private NotifyOnSearchableSelectControlValueChange() {
    if (this.formControlName && this.control().type === 'searchable-select') {
      this.form.controls[this.formControlName].valueChanges.subscribe(
        (value) => {
          if (
            this.control()?.SchoolStructureListingType &&
            this.schoolStructureListingService
          ) {
            switch (this.control().SchoolStructureListingType) {
              case 'company':
              case 'sub-company':
                this.schoolStructureListingService.updateSelectedCompany(value);
                break;
              case 'campus':
                this.schoolStructureListingService.updateSelectedCampus(value);
                break;
              case 'school':
                this.schoolStructureListingService.updateSelectedSchool(value);
                break;
              case 'level':
                this.schoolStructureListingService.updateSelectedLevel(value);
                break;
              case 'class':
                if (!this.control().isMultiple)
                  this.schoolStructureListingService.updateSelectedClass(value);
                break;
              default:
                break;
            }
          }
          this.control().onValueChange &&
            this.control()?.onValueChange!(
              value,
              this.formControlName
                ? this.form.controls[this.formControlName]
                : null,
            );
        },
      );
    }
  }

  private get formControlName() {
    return this.control().formControlName ?? null;
  }
  get formControl() {
    return this.formControlName
      ? (this.form.controls[this.formControlName] as FormControl)
      : null;
  }

  removeSelectedValue(value: any) {
    const selectedValues = this.formControl?.value as Array<any>;
    const index = selectedValues.indexOf(value);
    if (index > -1) {
      // return a new array so that angular change detection works properly
      const newSelectedValues = [
        ...selectedValues.slice(0, index),
        ...selectedValues.slice(index + 1),
      ];
      this.formControl?.setValue(newSelectedValues);
    }
  }

  toggleChipsModal() {
    this.isChipsModalOpen.set(!this.isChipsModalOpen());
  }

  showSelectAllForCheckboxes() {
    const control = this.control();
    if (!control.allowSelectAll) {
      return false;
    }
    const { selectValues = [] } = control;
    return selectValues.length > 1 && !selectValues.some((v) => v.disabled);
  }
}
