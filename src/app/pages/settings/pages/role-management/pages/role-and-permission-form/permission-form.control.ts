import { FormControl } from '@angular/forms';

export interface IPermissionFormControl {
  permissionId: number;
  parentPermissionIds: Array<number>;
  childPermissionIds: Array<number>;
  control: FormControl;
  isExplictSet: 'mark' | 'unmark' | 'unset';
  operationParentControl: FormControl | null;
}
export class PermissionFormControl implements IPermissionFormControl {
  permissionId: number;
  parentPermissionIds: number[];
  childPermissionIds: number[];
  control: FormControl;
  isExplictSet: 'mark' | 'unmark' | 'unset';
  operationParentControl: FormControl<any> | null = null;
  constructor(obj: IPermissionFormControl) {
    this.permissionId = obj.permissionId;
    this.parentPermissionIds = obj.parentPermissionIds;
    this.childPermissionIds = obj.childPermissionIds;
    this.control = obj.control;
    this.isExplictSet = obj.isExplictSet;
  }
  public markAsChecked() {
    this.control.setValue(true);
  }

  public markAsUnChecked() {
    this.control.setValue(false);
  }
  public markAsDisabled() {
    this.control.disable();
  }

  public markAsEnabled() {
    this.control.enable();
  }

  public isChecked(): boolean {
    return this.control.value;
  }

  public explicitMark(): void {
    this.isExplictSet = 'mark';
  }

  public explicitUnMark(): void {
    this.isExplictSet = 'unmark';
  }

  public isOperationalPersentChecked(): boolean {
    return this.operationParentControl?.value;
  }

  public markOperationalAsUnchecked(): void {
    this.operationParentControl?.setValue(false);
  }

  /**
   * Determines if this permission control can be unchecked based on dependency rules.
   * Supports both circular and non-circular dependency scenarios.
   *
   * @param hasCircularDeps - Whether this permission is part of a circular dependency
   * @param hasNonCircularDependents - Whether this permission has non-circular dependents that are checked
   * @returns True if the permission can be unchecked, false otherwise
   * @public
   */
  public canBeUnchecked(
    hasCircularDeps: boolean,
    hasNonCircularDependents: boolean,
  ): boolean {
    // If permission has circular dependencies, it can always be unchecked
    if (hasCircularDeps) {
      return true;
    }
    // If it has non-circular dependents that are checked, it cannot be unchecked
    if (hasNonCircularDependents) {
      return false;
    }
    return true;
  }
}
