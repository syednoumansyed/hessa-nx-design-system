import { CreatedByDTO } from '@shared/dto-transformation';
import { DependetPermissionDTO } from './dependent-permissions.dto';
import { ResourceDTO } from './resource.dto';
export interface RoleDTO {
  id: number;
  arName: string;
  enName: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy?: CreatedByDTO;
  editable: boolean;
  deletable: boolean;
  assignable: boolean;
}
export interface RoleDetailDTO extends RoleDTO {
  resources: ResourceDTO[];
  dependentPermission: DependetPermissionDTO[];
}

export interface RolePermissionsResponseDTO {
  isTeacherOnly: boolean; // Only has teacher role without any other role
  isTeacher: boolean; // Has teacher role (with or without other roles)
  isSuperAdmin: boolean;
  rolesAndPermissions: RoleDetailDTO[];
}

export type RoleResponseDataDTO = RoleDetailDTO;

export interface RoleRequest {
  arName: string;
  enName: string;
  permissionIds: Array<number>;
}

export type RolesResponseDataDTO = Array<RoleDTO>;

export type ApiParam = {
  sortByColumn?: string;
  order?: string;
  pageNumber?: number;
  itemsPerPage?: number;
  schoolId?: string;
  academicYearId?: string | number;
};
