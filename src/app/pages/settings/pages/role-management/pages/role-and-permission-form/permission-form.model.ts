import { FormControl } from '@angular/forms';

export interface PermissionFormViewData {
  id: number;
  action: string;
  operation: string;
  control?: FormControl;
  resourceId?: number;
  resource?: string;
  /**
   * Indicates whether this permission can be unchecked by the user.
   * False when the permission has non-circular dependent permissions that are currently checked.
   * True when the permission has no dependents or only circular dependencies.
   */
  canBeUnchecked?: boolean;
}
export type OperationsFormViewData = Map<
  string,
  {
    indeterminate: boolean;
    operationControl: FormControl;
    permissions: Array<PermissionFormViewData>;
  }
>;
export interface ResourceFormViewData {
  id: number;
  resource: string;
  operations: OperationsFormViewData;
}
