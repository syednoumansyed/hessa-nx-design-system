import { RoleResponseDataDTO } from '@core/api-services/role-api/dto/role.dto';
import { IResponse } from '@shared/interfaces';

export const RoleMock = (roleId: number): IResponse<RoleResponseDataDTO> => ({
  message: 'Role(s) fetched successfully!',
  data: {
    id: roleId,
    deletable: true,
    editable: true,
    assignable: true,
    arName: 'Teacher mock',
    enName: 'Teacher mock',
    createdAt: '2024-02-01T10:41:39.000Z',
    updatedAt: '2024-02-01T10:41:39.000Z',
    createdBy: {
      id: 1,
      arFullName: 'Admin',
      enFullName: 'Admin',
    },
    resources: [
      {
        id: 1,
        name: 'student',
        permissions: [
          {
            id: 11,
            action: 'unlink guardian',
            operation: 'UPDATE',
          },
          {
            id: 10,
            action: 'deactivate/activate profile',
            operation: 'UPDATE',
          },
          {
            id: 2,
            action: 'view student profile',
            operation: 'READ',
          },
          {
            id: 5,
            action: 'bulk upload',
            operation: 'CREATE',
          },
          {
            id: 8,
            action: 'change phone number',
            operation: 'UPDATE',
          },
          {
            id: 6,
            action: 'import from pioneers',
            operation: 'CREATE',
          },
          {
            id: 4,
            action: 'add new student',
            operation: 'CREATE',
          },
          {
            id: 1,
            action: 'view students list',
            operation: 'READ',
          },
          {
            id: 3,
            action: 'export to excel',
            operation: 'READ',
          },
          {
            id: 9,
            action: 'update password',
            operation: 'UPDATE',
          },
          {
            id: 7,
            action: 'edit student profile',
            operation: 'UPDATE',
          },
        ],
      },
      {
        id: 2,
        name: 'guardian',
        permissions: [
          {
            id: 14,
            action: 'export to excel',
            operation: 'READ',
          },
          {
            id: 15,
            action: 'add new guardian',
            operation: 'CREATE',
          },
          {
            id: 16,
            action: 'bulk upload',
            operation: 'CREATE',
          },
          {
            id: 17,
            action: 'import from pioneers',
            operation: 'CREATE',
          },
          {
            id: 18,
            action: 'edit guardian profile',
            operation: 'UPDATE',
          },
          {
            id: 20,
            action: 'update password',
            operation: 'UPDATE',
          },
          {
            id: 12,
            action: 'view guardian list',
            operation: 'READ',
          },
          {
            id: 13,
            action: 'view guardian profile',
            operation: 'READ',
          },
          {
            id: 21,
            action: 'deactivate/activate profile',
            operation: 'UPDATE',
          },
          {
            id: 19,
            action: 'change phone number',
            operation: 'UPDATE',
          },
          {
            id: 22,
            action: 'unlink student',
            operation: 'UPDATE',
          },
        ],
      },
      {
        id: 3,
        name: 'company',
        permissions: [
          {
            id: 25,
            action: 'export to excel',
            operation: 'READ',
          },
          {
            id: 26,
            action: 'add new company',
            operation: 'CREATE',
          },
          {
            id: 27,
            action: 'bulk upload',
            operation: 'CREATE',
          },
          {
            id: 33,
            action: 'unlink student',
            operation: 'UPDATE',
          },
          {
            id: 31,
            action: 'update password',
            operation: 'UPDATE',
          },
          {
            id: 34,
            action: 'delete',
            operation: 'DELETE',
          },
          {
            id: 32,
            action: 'deactivate/activate profile',
            operation: 'UPDATE',
          },
          {
            id: 24,
            action: 'view company profile',
            operation: 'READ',
          },
          {
            id: 28,
            action: 'import from pioneers',
            operation: 'CREATE',
          },
          {
            id: 30,
            action: 'change phone number',
            operation: 'UPDATE',
          },
          {
            id: 29,
            action: 'edit company profile',
            operation: 'UPDATE',
          },
          {
            id: 23,
            action: 'view company list',
            operation: 'READ',
          },
        ],
      },
    ],
    dependentPermission: [
      {
        id: 1,
        permissionId: 11,
        dependentPermissionId: 8,
      },
      {
        id: 2,
        permissionId: 14,
        dependentPermissionId: 9,
      },
      {
        id: 3,
        permissionId: 15,
        dependentPermissionId: 9,
      },
      {
        id: 4,
        permissionId: 16,
        dependentPermissionId: 9,
      },
      {
        id: 5,
        permissionId: 17,
        dependentPermissionId: 9,
      },
      {
        id: 6,
        permissionId: 18,
        dependentPermissionId: 8,
      },
    ],
  },
});
