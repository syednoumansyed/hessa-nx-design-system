import { IAction } from '@ui-kit/hes-action-sheet/model';
import { SortOrder } from '@shared/enums';
import { Idropdown } from '@shared/interfaces';
import { CellStyle } from 'ag-grid-community';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { Signal, TemplateRef, WritableSignal } from '@angular/core';
export interface IFilterEvent {
  name: string;
  value: string | null;
}

export interface ITableSort {
  colName?: string;
  order?: SortOrder;
}

export type ITableFilter<T = any> = {
  [K in keyof T]: T[K];
};

export type ITableModel<T = any> = ITableFilter<T> &
  ITableSort &
  ITablePagination;

export type UnknownObject<T = any> = { [K in keyof T]: T[K] };

export interface MobileDetailHeaderContext<T = UnknownObject> {
  $implicit: UnknownObject<T>;
  data: UnknownObject<T>;
  column: ITableCol<T>;
  value: any;
}

export interface ITablePagination {
  pageNumber: number;
  itemsPerPage: number;
}

export interface ITableCol<T = any> {
  field: string;
  headerName: string;
  // TODO make optional
  sortable: boolean;
  sort?: 'asc' | 'desc';
  bedge?: boolean;
  // TODO make optional
  filter: boolean;
  filterPlaceholder?: string;
  type?:
    | 'text'
    | 'date'
    | 'number'
    | 'boolean'
    | 'action'
    | 'dateTime'
    | 'enum'
    | 'time'
    | 'dateDay';
  filterType?: 'text' | 'select' | 'date' | 'chip-selector';
  filterSelectOptions?: Idropdown[];
  filterSelectOptionsSignal?: WritableSignal<Idropdown[]> | Signal<Idropdown[]>;
  filterinitSelection?: Idropdown['value'];
  valueFormatter?: ({ data, value }: { data: T; value: any }) => string;
  actions?: IAction<T>[];
  cellRenderer?: any;
  cellRendererParams?: any;
  cellStyle?: CellStyle;
  /** Initial width in pixels for the cell. */
  width?: number;
  /** Minimum width in pixels for the cell. */
  minWidth?: number;
  /** Maximum width in pixels for the cell. */
  maxWidth?: number;
  /**
   * Set to `true` to have the text wrap inside the cell - typically used with `autoHeight`.
   * @default false
   */
  wrapText?: boolean;
  /**
   * Set to `true` to have the grid calculate the height of a row based on contents of this column.
   * @default false
   */
  autoHeight?: boolean;
  SchoolStructureListingType?: SchoolStructureEntityType;
  /** Set to falsue if you dont want None option in select filter. */
  includeNoneOption?: boolean;
  isMultpleFilterSelect?: boolean;
  mobileViewConfig?: {
    isPrimaryKey?: boolean;
    isDisplayName?: boolean;
    /**
     * Defines the column's position in the mobile view using a **zero-based index**.
     * - `0` for the first position, `1` for the second, and so on.
     * - Defaults to the column's natural order if not specified.
     */
    order?: number;
    headerTemplate?: TemplateRef<MobileDetailHeaderContext<T>>;
  };
  // ag grid config
  hide?: boolean;
  pinned?: 'left' | 'right';
  lockPosition?: boolean;
  // end ag grid config

  forceActionSheet?: boolean;
  /** extractValue Used for copying to clipboard when a complex component is used as a cell */
  extractValue?: (params: { data: T }) => string | number;
  /** filterOrder Determines the order in which filters are displayed in the modal. Defaults to zero if not specified. */
  filterOrder?: number;
}

export enum AcademicYearFilterName {
  ACADEMICYEARID = 'academicYearId',
  ACADMEICYEAR = 'academicYear',
}

export interface INoRowsOverlay {
  imgSrc?: string;
  title?: string;
  showFullOverlay?: boolean;
  subTitle?: string;
  btnText?: string;
  btnClick?: () => void;
}
