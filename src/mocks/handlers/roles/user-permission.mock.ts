import { RoleResponseDataDTO } from '@core/api-services/role-api/dto/role.dto';
import { IResponse } from '@shared/interfaces';

export const userPermission: IResponse<RoleResponseDataDTO[]> = {
  message: 'Role(s) fetched successfully!',
  data: [
    {
      id: 3,
      arName: 'super admin',
      enName: 'super admin',
      createdAt: '2024-02-27T13:04:30.000Z',
      updatedAt: '2024-02-27T13:04:30.000Z',
      editable: false,
      deletable: false,
      assignable: true,
      resources: [
        {
          id: 1,
          name: 'resource.student',
          permissions: [
            {
              id: 1,
              action: 'action.student.list.view',
              operation: 'operation.read',
            },
            {
              id: 1,
              action: 'action.student.list.view',
              operation: 'operation.read',
            },
            {
              id: 2,
              action: 'action.student.profile.view',
              operation: 'operation.read',
            },
          ],
        },
      ],
      dependentPermission: [
        {
          id: 163,
          permissionId: 2,
          dependentPermissionId: 1,
        },
      ],
    },
  ],
};
