import { Signal, WritableSignal } from '@angular/core';
import { DsSelectConfig } from '@ds/select/select.interface';
import { AcceptFileType } from '@ui-kit/hes-attachment-form-control/attachment-type.constant';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';

export type DsFormControlType =
  | 'input'
  | 'textarea'
  | 'searchable-select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'chip-selector'
  | 'file'
  | 'editor'
  | 'school-structure'
  | 'time-picker'
  | 'date'
  | 'date-range'
  | 'searchable-checkbox-select'
  | 'icon-chooser'
  | 'picker-select';

export interface DsSelectValueIcon {
  name: IconDefinition;
  placement: 'start' | 'end';
}

export interface DsSelectValue<T = any> {
  value: string | number;
  displayedValue: string;
  extraData?: T;
  icon?: DsSelectValueIcon;
  /** Helper text displayed below the individual option (for checkboxes) */
  helperText?: string;
  /** Whether this option is disabled */
  disabled?: boolean;
}

// Base shared properties applicable to all controls
export interface DsBaseControl<TValue = any> {
  type: DsFormControlType; // discriminant
  formControlName: string; // enforce required binding (was optional)
  label?: string;
  subLabel?: string;
  labelIcon?: string;
  placeholder?: string;
  required?: boolean | Signal<boolean>;
  readonly?: boolean;
  /** When true, the form control will be disabled (non-interactive and grayed out) */
  disabled?: boolean;
  helperText?: string;
  helperTextColor?: string;
  maxLength?: number;
  viewState?: boolean; // custom display state flag
  noOfChild?: WritableSignal<number>;
  errorMessage?: Record<string, string>;
  /**
   * Maps form-level (cross-field) error keys to error messages for this control.
   * When the parent form has an error matching one of these keys, the corresponding
   * message will be displayed on this control.
   */
  formLevelErrors?: Record<string, string>;
  /**
   * Creates a localized pair validation with another control.
   * When set, if either control has a value, both must have values.
   *
   * Set to the formControlName of the paired control.
   * The validator and error messages are automatically configured.
   */
  localizedPair?: string;
  onValueChange?: (value: any, control?: any) => void;
}

// INPUT
export interface DsInputControl extends DsBaseControl<string | number> {
  type: 'input';
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
    | 'week';
  showCharacterCount?: boolean;
}

// TEXTAREA
export interface DsTextareaControl extends DsBaseControl<string> {
  type: 'textarea';
  showCharacterCount?: boolean;
}

// SEARCHABLE SELECT
export interface DsSearchableSelectControl<T = any> extends DsBaseControl<T> {
  type: 'searchable-select';
  selectValues: Array<DsSelectValue<T>>; // required for select
  initSelectValues?: Array<DsSelectValue<T>>;
  isMultiple?: boolean;
  allowSelectAll?: boolean;
  dsSelectConfig?: Partial<DsSelectConfig<T>>; // overrides
}

// RADIO GROUP
export interface DsRadioControl<T = any> extends DsBaseControl<T> {
  type: 'radio';
  // Provide values for radio button lists
  selectValues: Array<DsSelectValue<T>>;
  initSelectValues?: Array<DsSelectValue<T>>;
}

// CHECKBOX GROUP (also supports single checkbox when selectValues has one item)
export interface DsCheckboxControl<T = any> extends DsBaseControl<T> {
  type: 'checkbox';
  selectValues: Array<DsSelectValue<T>>;
  initSelectValues?: Array<DsSelectValue<T>>;
  isMultiple?: boolean; // typically true, retained for compatibility
  allowSelectAll?: boolean; // added to support select-all checkbox rendering
  size?: 'sm' | 'lg'; // checkbox size, defaults to 'lg'
}

// SWITCH
export interface DsSwitchControl extends DsBaseControl<boolean | string> {
  type: 'switch';
  switchOptions?: {
    option1?: string;
    option2?: string;
    toggleType?: 'two-way' | 'boolean'; // renamed for clarity
    type?: 'two-way' | 'boolean'; // backward compatibility with previous 'type'
    selectedOption?: string; // when two-way
  };
}

// CHIP SELECTOR
export interface DsChipSelectorControl<T = any> extends DsBaseControl<T> {
  type: 'chip-selector';
  selectValues: Array<DsSelectValue<T>>;
  initSelectValues?: Array<DsSelectValue<T>>;
  isMultiple?: boolean;
  displayType?: 'pill' | 'card';
}

// TIME PICKER
export interface DsTimePickerControl extends DsBaseControl<string> {
  type: 'time-picker';
  // Add specific properties when you know what the component supports
  // For example: format?, minTime?, maxTime?, etc.
}

// SCHOOL STRUCTURE
export interface DsSchoolStructureControl extends DsBaseControl<any> {
  type: 'school-structure';
  isMultiple?: boolean; // maps to isMultiSelect
  depth?: number; // StructureDepth
  allowedSelections?: any[] | null; // DsSchoolStructureEntityType[]
}

// FILE
export interface DsFileControl extends DsBaseControl<any> {
  type: 'file';
  acceptFileTypes?: AcceptFileType;
  maxSizeInMB?: number;
  isMultiple?: boolean;
}

// EDITOR
export interface DsEditorControl extends DsBaseControl<string> {
  type: 'editor';
  uploadImageUrl?: string;
  editorConfig?: {
    allowImgUpload?: boolean;
    allowYoutubeExtension?: boolean;
    previewOnly?: boolean;
    preview?: boolean;
  };
  maxLength?: number;
}

// SEARCHABLE CHECKBOX SELECT
export interface DsSearchableCheckboxSelectControl<
  T = any,
> extends DsBaseControl<T> {
  type: 'searchable-checkbox-select';
  selectValues: Array<DsSelectValue<T>>;
  initSelectValues?: Array<DsSelectValue<T>>;
  allowSelectAll?: boolean;
}

// ICON CHOOSER
export interface DsIconChooserControl extends DsBaseControl<string> {
  type: 'icon-chooser';
}

export interface DsDateControl extends DsBaseControl<Date | string> {
  type: 'date';
  datePickerConfig?: {
    min?: any;
    max?: any;
  };
}
export interface DsDateRangeControl extends DsBaseControl<{
  from: Date;
  to: Date;
}> {
  type: 'date-range';
}

// PICKER SELECT (modal-based selection)
export interface DsPickerSelectControl<T = any> extends DsBaseControl<T> {
  type: 'picker-select';
  /** Options to display in the picker */
  selectValues: Array<DsSelectValue<T>>;
  /** Initial selected values */
  initSelectValues?: Array<DsSelectValue<T>>;
  /** Whether multiple selections are allowed (default: true) */
  isMultiple?: boolean;
  /** Label for items (e.g., "lessons", "items") - used in modal title and selection count display */
  itemLabel?: string;
  /** Text for the select/confirm button */
  selectButtonText?: string;
}

// Discriminated union of all controls
export type DsFormControl<T = any> =
  | DsInputControl
  | DsTextareaControl
  | DsSearchableSelectControl<T>
  | DsRadioControl<T>
  | DsCheckboxControl<T>
  | DsSwitchControl
  | DsChipSelectorControl<T>
  | DsFileControl
  | DsEditorControl
  | DsSchoolStructureControl
  | DsTimePickerControl
  | DsDateControl
  | DsDateRangeControl
  | DsSearchableCheckboxSelectControl<T>
  | DsIconChooserControl
  | DsPickerSelectControl<T>;
