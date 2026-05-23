import { COMMON_MAP_FROM_DTO } from '@shared/dto-transformation';
import { RoleDetailDTO, RoleDTO } from './role.dto';
import {
  RolePermission,
  RolePermissionDetail,
  Resource,
  ResourceResponseData,
  RoleAssignedUser,
} from './role.interface';
import {
  getLocalizedFullName,
  getLocalizedName,
} from '@shared/utils/localization.util';
import { ensureArray } from '@shared/utils/array.util';
import { ResourceDTO, ResourceResponseDataDTO } from './resource.dto';
import { AssignedUsersDTO } from './assigned-users.dto';

export const ROLE_PERMISSION_FROM_DTO = new (class {
  role(roleDto: RoleDTO): RolePermission {
    return {
      id: roleDto.id,
      arName: roleDto.arName,
      enName: roleDto.enName,
      displayName: getLocalizedName(roleDto),
      createdAt: roleDto.createdAt,
      updatedAt: roleDto.updatedAt,
      createdBy: roleDto.createdBy
        ? COMMON_MAP_FROM_DTO.createdBy(roleDto.createdBy)
        : null,
      editable: roleDto.editable,
      deletable: roleDto.deletable,
      assignable: roleDto.assignable,
    };
  }

  roles(roleDtos: RoleDTO[] | null): RolePermission[] {
    return ensureArray(roleDtos).map((roleDto) => this.role(roleDto));
  }

  roleDetail(roleDetailDto: RoleDetailDTO): RolePermissionDetail {
    return {
      ...this.role(roleDetailDto),
      resources: ensureArray(roleDetailDto.resources),
      dependentPermission: ensureArray(roleDetailDto.dependentPermission),
    };
  }

  resourceResponseData(dto: ResourceResponseDataDTO): ResourceResponseData {
    return {
      resources: this.resources(dto.resources),
      dependentPermission: ensureArray(dto.dependentPermission),
    };
  }

  resource(dto: ResourceDTO): Resource {
    return {
      id: dto.id,
      name: dto.name,
      createAt: dto.createAt,
      createBy: dto.createBy,
      permissions: ensureArray(dto.permissions),
    };
  }

  resources(dtos: ResourceDTO[] | null): Resource[] {
    return ensureArray(dtos).map((dto) => this.resource(dto));
  }

  users(dtos: AssignedUsersDTO[]): RoleAssignedUser[] {
    return ensureArray(dtos).map((dto) => ({
      id: dto.id,
      displayName: getLocalizedFullName(dto),
      nationalId: dto.nationalId,
      phoneNumber: dto.phoneNumber,
      createdBy: COMMON_MAP_FROM_DTO.createdBy(dto.createdBy),
      type: dto.type,
      createdAt: dto.createdAt,
    }));
  }
})();
