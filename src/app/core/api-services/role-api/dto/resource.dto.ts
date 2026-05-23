import { DependetPermissionDTO } from './dependent-permissions.dto';
import { PermissionDTO } from './permission.dto';
export type ResourceDTO = {
  id: number;
  name: string;
  createAt?: string;
  createBy?: string;
  permissions: PermissionDTO[];
};

export type ResourceResponseDataDTO = {
  resources: ResourceDTO[];
  dependentPermission: DependetPermissionDTO[];
};
