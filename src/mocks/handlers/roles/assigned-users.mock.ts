import {
  AssignedUserResponseDTO,
  AssignedUsersDTO,
} from '@core/api-services/role-api/dto/assigned-users.dto';
import { UserType } from '@shared/enums';

const assignedUsersMock: AssignedUsersDTO[] = [
  {
    id: 1,
    arFullName: 'John Doe',
    enFullName: 'John Doe',
    nationalId: 1234567890,
    phoneNumber: '1234567890',
    createdBy: {
      id: 1,
      arFullName: 'Admin',
      enFullName: 'Admin',
    },
    type: UserType.GUARDIAN,
    createdAt: '2022-01-01',
  },
  {
    id: 2,
    arFullName: 'جين سميث',
    enFullName: 'Jane Smith',
    nationalId: 987654321,
    phoneNumber: '0987654321',
    createdBy: {
      id: 2,
      arFullName: 'Admin',
      enFullName: 'Admin',
    },
    type: UserType.STUDENT,
    createdAt: '2022-01-02',
  },
  {
    id: 3,
    arFullName: 'أحمد',
    enFullName: 'Ahmed',
    nationalId: 987654321,
    phoneNumber: '0987654321',
    createdBy: {
      id: 2,
      arFullName: 'Admin',
      enFullName: 'Admin',
    },
    type: UserType.PERSONNEL,
    createdAt: '2022-01-02',
  },
];

export const AssignedUsersResponseMock: AssignedUserResponseDTO = {
  data: assignedUsersMock,
  paginate: {
    pageNumber: 1,
    itemsPerPage: 10,
    totalPages: 1,
    totalItems: 9,
  },
};
