import { RoleListTableCol } from './role-list-table-col-def.service';
import { RolePermission } from '@core/api-services/role-api/dto/role.interface';
export const mapToRoleListTableData = (
  roles: RolePermission[],
): RoleListTableCol[] => {
  return roles.map((role) => {
    return {
      id: role.id,
      name: role.displayName,
      assignable: role.assignable,
      deletable: role.deletable,
      editable: role.editable,
      createdAt: role.createdAt,
      createdBy: role.createdBy?.displayName,
    };
  });
};
