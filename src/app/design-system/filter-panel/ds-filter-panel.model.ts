import { DsSelectConfig, DsSelectedValue } from '@ds/select/select.interface';
import { StructureDepth } from '@shared/utils/school-structure';
import {
  DsSchoolStructureControlValue,
  DsSchoolStructureEntityType,
} from '@ds/school-structure-control/types/school-structure-control.types';
import { ChipSelectorOption } from '@ds/chip-selector/chip-selector.component';

export type DsFilterType =
  | 'search'
  | 'date'
  | 'date-range'
  | 'select'
  | 'chip-selector'
  | 'school-structure';

export interface DsFilterBase {
  type: DsFilterType;
  key: string;
  label: string;
  exposed?: boolean;
  /**
   * When true, the filter section is hidden from the modal UI and its value is
   * excluded from emitted filter results. The form control still exists so no
   * form-group rebuild (and value reset) occurs when toggled.
   */
  hidden?: boolean;
  /** Called whenever this filter's value changes inside the modal (before Apply). */
  onChange?: (value: DsFilterValue) => void;
  /**
   * Key(s) of parent filter(s) this filter depends on. When any parent
   * filter's value changes, this filter is automatically cleared.
   * Example: class depends on level — when level changes, class resets.
   * Accepts a single key or an array of keys.
   */
  dependsOn?: string | string[];
  /**
   * When true, Apply is disabled until this filter has a value.
   */
  required?: boolean;
}

export interface DsDateFilterConfig extends DsFilterBase {
  type: 'date';
  placeholder: string;
  /** Value to reset to when "Clear Filters" is clicked. */
  defaultValue?: Date;
}

export interface DsDateRangeFilterConfig extends DsFilterBase {
  type: 'date-range';
  placeholder?: string;
  /** Value to reset to when "Clear Filters" is clicked. */
  defaultValue?: { from: Date; to: Date };
}

export interface DsSearchFilterConfig extends DsFilterBase {
  type: 'search';
  placeholder: string;
}

export interface DsSelectFilterConfig extends DsFilterBase {
  type: 'select';
  config: DsSelectConfig;
  /**
   * Override label shown in filter chips when the select uses loadOptions
   * (paginated) and no static options are available for lookup.
   */
  chipLabel?: string;
}

export interface DsChipSelectorFilterConfig extends DsFilterBase {
  type: 'chip-selector';
  options: ChipSelectorOption[];
  multiple?: boolean;
}

export interface DsSchoolStructureFilterConfig extends DsFilterBase {
  type: 'school-structure';
  placeholder: string;
  isMultiSelect: boolean;
  depth: StructureDepth;
  allowedSelections: DsSchoolStructureEntityType[] | null;
}

export type DsFilterConfig =
  | DsSearchFilterConfig
  | DsDateFilterConfig
  | DsDateRangeFilterConfig
  | DsSelectFilterConfig
  | DsChipSelectorFilterConfig
  | DsSchoolStructureFilterConfig;

export type DsFilterValue =
  | string
  | number
  | Date
  | { from: Date; to: Date }
  | DsSelectedValue
  | null
  | undefined
  | DsSchoolStructureControlValue[];

export type DsFiltersValue = Record<string, DsFilterValue>;
