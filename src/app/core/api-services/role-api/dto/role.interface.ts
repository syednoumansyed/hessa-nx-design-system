import { CreatedBy } from '@shared/dto-transformation';
import {
  FullNameLocalizedEntity,
  LocalizedEntity,
} from '@shared/dto-transformation/shared/localized-entity.interface';
import { UserType } from '@shared/enums';

export type Permission = {
  id: number;
  action: string;
  operation: string;
};

export type Resource = {
  id: number;
  name: string;
  createAt?: string;
  createBy?: string;
  permissions: Permission[];
};

export interface RolePermission extends LocalizedEntity {
  id: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: CreatedBy | null;
  editable: boolean;
  deletable: boolean;
  assignable: boolean;
}

export interface RolePermissionDetail extends RolePermission {
  resources: Resource[];
  dependentPermission: DependetPermission[];
}

export type ResourceResponseData = {
  resources: Resource[];
  dependentPermission: DependetPermission[];
};

export interface DependetPermission {
  id: number;
  permissionId: number;
  dependentPermissionId: number;
}

export interface RoleAssignedUser {
  id: number;
  displayName: string;
  nationalId: number;
  phoneNumber: string;
  createdBy: CreatedBy;
  type: UserType;
  createdAt: string;
}
