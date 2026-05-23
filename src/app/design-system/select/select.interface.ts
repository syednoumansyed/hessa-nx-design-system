import { ObjId } from '@shared/interfaces/common.interface';
import { DsIcon } from '../icon/icon.component';
import {
  IPaginatedResponse,
  IResponse,
  IPaginationParams,
} from '@shared/interfaces';
import { Observable } from 'rxjs';

export interface DsSelectOption {
  id: ObjId;
  display: string;
  secondaryDisplay?: string;
  icon?: DsIcon;
  disabled?: boolean;
}

export interface DsSelectConfig<T = any> {
  options?: DsSelectOption[];
  label?: string;
  placeholder?: string;
  isMultiple?: boolean;
  /**
   * When true, show chips for the selection even in single-select mode.
   * Defaults to true. Set to false to render selected value as plain text.
   */
  chips?: boolean;
  /** Optional disabled at config level */
  disabled?: boolean;
  noItemFoundText?: string;
  /**
   * Enable built-in search input and filtering. Defaults to true.
   * Set to false to hide search UI and disable search-related logic.
   */
  showSearch?: boolean;
  /**
   * Show "Select All" / "Clear" toggle in multi-select dropdown.
   * Only applies when isMultiple is true. Defaults to false.
   */
  showSelectAll?: boolean;
  required?: boolean;
  fieldMapper?: {
    id?: keyof T | ((item: T) => ObjId);
    display?: keyof T | ((item: T) => string);
    secondaryDisplay?: keyof T | ((item: T) => string);
    icon?: keyof T | ((item: T) => DsIcon);
    disabled?: keyof T | ((item: T) => boolean);
  };
  isPaginated?: boolean;
  loadOptions?: (args: {
    searchText: string;
    params: IPaginationParams;
  }) => Observable<IPaginatedResponse<T> | IResponse<T>>;

  loadSelectedItems?: (args: { selectedId: ObjId }) => Observable<IResponse<T>>;
}

export type DsSelectedValue = Array<ObjId> | ObjId | null;

export type DsSelectedItem = { id: ObjId; display: string };
export type DsSelectedItems = Array<DsSelectedItem>;
