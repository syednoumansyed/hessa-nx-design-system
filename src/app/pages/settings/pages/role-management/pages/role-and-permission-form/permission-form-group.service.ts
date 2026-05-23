import { Injectable, inject } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import {
  IPermissionFormControl,
  PermissionFormControl,
} from './permission-form.control';
import {
  OperationsFormViewData,
  ResourceFormViewData,
} from './permission-form.model';
import { Subscription, merge } from 'rxjs';
import {
  ResourceDTO,
  ResourceResponseDataDTO,
} from '@core/api-services/role-api/dto/resource.dto';

type FormLookupMap = Map<number, PermissionFormControl>;
@Injectable()
export class PermissionFormGroupService {
  formView: ResourceFormViewData[] = [];
  private readonly formLookupMap = new Map<number, PermissionFormControl>();
  private formViewData: ResourceResponseDataDTO;
  private readonly sub = new Subscription();
  /**
   * Set containing circular dependency pairs as string keys in format "permissionId-dependentPermissionId".
   * Used to identify permissions that have bidirectional dependencies.
   */
  private circularDependencies = new Set<string>();
  init(data: ResourceResponseDataDTO) {
    this.buildLookUp(data.resources);
    this.setDependance(data.dependentPermission, this.formLookupMap);
    this.detectCircularDependencies(data.dependentPermission);
    this.formViewData = data;
    this.formView = this.getResources();
    this.setUpIndeterminate();
  }

  public builkChecked(permissionIds: number[]) {
    permissionIds.forEach((pId) => {
      const lookupObj = this.formLookupMap.get(pId);
      const isChecked = lookupObj?.isChecked();
      if (!isChecked && lookupObj) {
        lookupObj.markAsChecked();
        this.markAllParentPermissionAsChecked(lookupObj?.permissionId);
      }
    });
  }

  public builkUnChecked(permissionIds: number[]) {
    permissionIds.forEach((pId) => {
      const lookupObj = this.formLookupMap.get(pId);
      if (lookupObj && !this.isAnyChildChecked(lookupObj?.permissionId)) {
        if (lookupObj.isExplictSet !== 'mark') {
          lookupObj.markAsUnChecked();
          this.markAllParentPermissionAsUnChecked(lookupObj.permissionId);
        }
      }
    });

    // Refresh control states after bulk unchecking
    this.refreshControlStates();
    this.refreshPermissionStates();
  }

  public explictChecked(permissionId: number) {
    const lookupObj = this.formLookupMap.get(permissionId);
    if (lookupObj) {
      lookupObj.explicitMark();
      lookupObj.markAsChecked();
      this.markAllParentPermissionAsChecked(lookupObj.permissionId);

      // Refresh control states to ensure proper enabled/disabled state
      this.refreshControlStates();
      this.refreshPermissionStates();
    }
  }

  /**
   * Explicitly unchecks a permission with circular dependency awareness.
   * Prevents unchecking if the permission has non-circular dependent permissions that are checked.
   * Allows unchecking if all dependents are part of circular dependencies.
   *
   * @param permissionId - The ID of the permission to uncheck
   * @public
   */
  public explictUnChecked(permissionId: number) {
    const lookupObj = this.formLookupMap.get(permissionId);
    if (lookupObj) {
      // Check if unchecking this permission would break any non-circular dependencies
      const hasNonCircularDependents = lookupObj.childPermissionIds.some(
        (childId) => {
          const childLookup = this.formLookupMap.get(childId);
          return (
            childLookup?.isChecked() &&
            !this.hasCircularDependency(permissionId, childId)
          );
        },
      );

      if (hasNonCircularDependents) {
        // Don't allow unchecking if there are non-circular dependents that are checked
        return;
      }

      lookupObj.explicitUnMark();
      lookupObj.markAsUnChecked();
      lookupObj.markOperationalAsUnchecked();
      this.markAllParentPermissionAsUnChecked(lookupObj.permissionId);

      // Refresh control states to ensure proper enabled/disabled state
      this.refreshControlStates();
      this.refreshPermissionStates();
    }
  }

  /**
   * Recursively marks parent permissions as unchecked when safe to do so, with circular dependency awareness.
   * Enables parent controls when they have no non-circular dependent children that are checked.
   * Prevents unchecking parent permissions that have non-circular dependent children that are still checked.
   *
   * @param permissionId - The ID of the permission whose parents should be unchecked
   * @public
   */
  public markAllParentPermissionAsUnChecked(permissionId: number) {
    const lookObj = this.formLookupMap.get(permissionId);
    lookObj?.parentPermissionIds.forEach((parentId) => {
      const parentLookup = this.formLookupMap.get(parentId);
      if (parentLookup) {
        // Check if parent has any non-circular dependent children that are checked
        const hasNonCircularDependents = parentLookup.childPermissionIds.some(
          (childId) => {
            const childLookup = this.formLookupMap.get(childId);
            return (
              childLookup?.isChecked() &&
              !this.hasCircularDependency(parentId, childId)
            );
          },
        );

        // Enable parent if it has no non-circular dependents that are checked
        if (!hasNonCircularDependents) {
          parentLookup.markAsEnabled();
        }

        // Only uncheck parent if it has no checked children at all
        if (!this.isAnyChildChecked(parentId)) {
          if (
            parentLookup.isExplictSet !== 'mark' &&
            !parentLookup.isOperationalPersentChecked() &&
            !this.hasCircularDependency(permissionId, parentId)
          ) {
            parentLookup.markAsUnChecked();
            this.markAllParentPermissionAsUnChecked(parentLookup?.permissionId);
          }
        }
      }
    });
  }

  public isAnyChildChecked(permissionId: number): boolean {
    const lookObj = this.formLookupMap.get(permissionId);
    return !!lookObj?.childPermissionIds.some((childId) => {
      return this.formLookupMap.get(childId)?.isChecked();
    });
  }

  /**
   * Recursively marks all parent permissions as checked, with circular dependency awareness.
   * For non-circular dependencies, parent permissions are disabled to prevent unchecking.
   * For circular dependencies, parent permissions remain enabled for user interaction.
   *
   * @param permissionId - The ID of the permission whose parents should be checked
   * @public
   */
  public markAllParentPermissionAsChecked(permissionId: number) {
    const lookObj = this.formLookupMap.get(permissionId);
    lookObj?.parentPermissionIds.forEach((parentId) => {
      const parentLookUp = this.formLookupMap.get(parentId);
      if (!this.hasCircularDependency(permissionId, parentId)) {
        parentLookUp?.markAsDisabled();
      }
      if (!parentLookUp?.isChecked()) {
        parentLookUp?.markAsChecked();
        this.markAllParentPermissionAsChecked(parentId);
      }
    });
  }

  public getSelectedPermissionsIds(): number[] {
    return Array.from(this.formLookupMap.entries())
      .filter(([_, value]) => {
        return value.isChecked();
      })
      .map(([pId]) => pId);
  }

  public destroy() {
    this.sub.unsubscribe();
  }

  /**
   * Detects circular dependencies between permissions and stores them for reference.
   * A circular dependency exists when permission A depends on permission B and
   * permission B also depends on permission A.
   *
   * @param dependentPermissions - Array of permission dependency relationships
   * @private
   */
  private detectCircularDependencies(
    dependentPermissions: ResourceResponseDataDTO['dependentPermission'],
  ) {
    this.circularDependencies.clear();

    dependentPermissions.forEach((dep) => {
      const reverseExists = dependentPermissions.some(
        (reverseDep) =>
          reverseDep.permissionId === dep.dependentPermissionId &&
          reverseDep.dependentPermissionId === dep.permissionId,
      );

      if (reverseExists) {
        const key1 = `${dep.permissionId}-${dep.dependentPermissionId}`;
        const key2 = `${dep.dependentPermissionId}-${dep.permissionId}`;
        this.circularDependencies.add(key1);
        this.circularDependencies.add(key2);
      }
    });
  }

  /**
   * Checks if there is a circular dependency between two permissions.
   *
   * @param permissionId - The first permission ID
   * @param dependentPermissionId - The second permission ID
   * @returns True if there is a circular dependency between the two permissions
   * @private
   */
  private hasCircularDependency(
    permissionId: number,
    dependentPermissionId: number,
  ): boolean {
    const key = `${permissionId}-${dependentPermissionId}`;
    return this.circularDependencies.has(key);
  }

  /**
   * Determines if a permission can be unchecked based on dependency rules.
   * A permission cannot be unchecked if it has non-circular dependent permissions that are currently checked.
   * Permissions with only circular dependencies can always be unchecked.
   *
   * @param permissionId - The ID of the permission to check
   * @returns True if the permission can be unchecked, false otherwise
   * @public
   */
  public canPermissionBeUnchecked(permissionId: number): boolean {
    const lookupObj = this.formLookupMap.get(permissionId);
    if (!lookupObj) return true;

    // Check if this permission has any non-circular dependents that are checked
    const hasNonCircularDependents = lookupObj.childPermissionIds.some(
      (childId) => {
        const childLookup = this.formLookupMap.get(childId);
        return (
          childLookup?.isChecked() &&
          !this.hasCircularDependency(permissionId, childId)
        );
      },
    );

    return !hasNonCircularDependents;
  }

  /**
   * Refreshes the permission states for all permissions in the form view.
   * Updates the 'canBeUnchecked' property for each permission based on current dependency states.
   * This should be called after any permission state changes to ensure UI reflects current constraints.
   *
   * @public
   */
  public refreshPermissionStates() {
    this.formView.forEach((resource) => {
      Array.from(resource.operations.entries()).forEach(
        ([_, operationData]) => {
          operationData.permissions.forEach((permission) => {
            permission.canBeUnchecked = this.canPermissionBeUnchecked(
              permission.id,
            );
          });
        },
      );
    });
  }

  /**
   * Refreshes the enabled/disabled state of all permission controls based on current dependencies.
   * Should be called after any permission state changes to ensure controls reflect current constraints.
   *
   * @public
   */
  public refreshControlStates() {
    Array.from(this.formLookupMap.entries()).forEach(
      ([permissionId, control]) => {
        // Check if this permission has any non-circular dependent children that are checked
        const hasNonCircularDependents = control.childPermissionIds.some(
          (childId) => {
            const childLookup = this.formLookupMap.get(childId);
            return (
              childLookup?.isChecked() &&
              !this.hasCircularDependency(permissionId, childId)
            );
          },
        );

        // Enable/disable based on dependencies
        if (hasNonCircularDependents) {
          control.markAsDisabled();
        } else {
          control.markAsEnabled();
        }
      },
    );
  }
  private buildLookUp(resources: ResourceDTO[]) {
    resources.forEach((resource) => {
      resource.permissions.forEach((permission) => {
        const newLook: IPermissionFormControl = {
          permissionId: permission.id,
          parentPermissionIds: [],
          childPermissionIds: [],
          control: new FormControl(false),
          isExplictSet: 'unset',
          operationParentControl: null,
        };
        this.formLookupMap.set(
          permission.id,
          new PermissionFormControl(newLook),
        );
      });
    });
  }

  private setDependance(
    dependancyData: ResourceResponseDataDTO['dependentPermission'],
    lookUp: FormLookupMap,
  ) {
    dependancyData.forEach((item) => {
      lookUp
        .get(item.permissionId)
        ?.parentPermissionIds.push(item.dependentPermissionId);
      lookUp
        .get(item.dependentPermissionId)
        ?.childPermissionIds.push(item.permissionId);
    });
  }

  private getResources(): ResourceFormViewData[] {
    if (this.formViewData) {
      return this.formViewData.resources.map((resource) => {
        return {
          id: resource.id,
          resource: resource.name,
          operations: this.getPermissionGroupByActions(resource),
        };
      });
    }
    return [];
  }

  private getPermissionGroupByActions(resource: ResourceDTO) {
    const groupByoperations: OperationsFormViewData = new Map();
    resource.permissions.forEach((permissionItem) => {
      let operationControl: FormControl;
      const newPermission = {
        ...permissionItem,
        control: this.formLookupMap.get(permissionItem.id)?.control,
        resourceId: resource.id,
        resource: resource.name,
        canBeUnchecked: this.canPermissionBeUnchecked(permissionItem.id),
      };

      if (groupByoperations.has(permissionItem.operation)) {
        groupByoperations
          .get(permissionItem.operation)
          ?.permissions.push(newPermission);
        operationControl = groupByoperations.get(
          permissionItem.operation,
        )!.operationControl;
      } else {
        operationControl = new FormControl();
        groupByoperations.set(permissionItem.operation, {
          permissions: [newPermission],
          indeterminate: false,
          operationControl: operationControl,
        });
      }
      this.formLookupMap.get(permissionItem.id)!.operationParentControl =
        operationControl;
    });
    return groupByoperations;
  }

  private setUpIndeterminate() {
    this.formView.forEach((resource) => {
      Array.from(resource.operations.entries()).forEach(([_, value]) => {
        const childControl$ = value.permissions.map(
          (permission) => permission.control!.valueChanges,
        );
        const sub = merge(...childControl$).subscribe(() => {
          const status = this.getPermissionMarkStatusByOperationGroup(
            value.permissions.map((permission) => permission.control!.value),
          );
          value.indeterminate = status.isParitalChecked;
          value.operationControl.setValue(status.isAllChecked ? true : false);
        });
        this.sub.add(sub);
      });
    });
  }

  private getPermissionMarkStatusByOperationGroup(arr: boolean[]): {
    isAllChecked: boolean;
    isParitalChecked: boolean;
    isAllUnchecked: boolean;
  } {
    const trueCount = arr.filter((value) => value === true).length;
    const falseCount = arr.length - trueCount;

    if (trueCount > 0 && falseCount > 0) {
      return {
        isAllChecked: false,
        isAllUnchecked: false,
        isParitalChecked: true,
      };
    }

    if (trueCount === arr.length) {
      return {
        isAllChecked: true,
        isAllUnchecked: false,
        isParitalChecked: false,
      };
    }

    return {
      isAllChecked: false,
      isAllUnchecked: true,
      isParitalChecked: false,
    };
  }
}
