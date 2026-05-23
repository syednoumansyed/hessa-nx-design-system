import { http, HttpResponse } from 'msw';
import { ResourceResponseMockData } from './permission.mock';
import { RoleListingMock } from './roles.mock';
import { RoleMock } from './role.mock';
import { AssignedUsersResponseMock } from './assigned-users.mock';
import { userPermission } from './user-permission.mock';
import { ApiUrl } from '@shared/utils/api-url.util';
export const RoleHandlers = [
  http.get(`${ApiUrl.v1BE}/permissions`, () => {
    return HttpResponse.json({ data: ResourceResponseMockData });
  }),
  http.get(`${ApiUrl.v1BE}/roles`, () => {
    return HttpResponse.json(RoleListingMock);
  }),
  http.get(`${ApiUrl.v1BE}/roles/:roleId`, ({ params }) => {
    const { roleId } = params;
    return HttpResponse.json(RoleMock(+(roleId ?? 0)));
  }),
  http.get(`${ApiUrl.v1BE}/roles/:roleId/users`, () => {
    return HttpResponse.json(AssignedUsersResponseMock);
  }),
  http.delete(`${ApiUrl.v1BE}/roles/:roleId`, () => {
    return HttpResponse.json({});
  }),
  http.delete(`${ApiUrl.v1BE}/roles/:roleId/users/:userId`, () => {
    return HttpResponse.json({});
  }),
  http.post(`${ApiUrl.v1BE}/users/roles/permissions`, () =>
    HttpResponse.json(userPermission),
  ),
];
