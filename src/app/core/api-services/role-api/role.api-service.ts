import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Observable, map } from 'rxjs';
import { AssignedUserResponseDTO } from './dto/assigned-users.dto';
import { ResourceResponseDataDTO } from './dto/resource.dto';
import {
  ApiParam,
  RoleDetailDTO,
  RoleRequest,
  RolesResponseDataDTO,
} from './dto/role.dto';
import {
  ResourceResponseData,
  RoleAssignedUser,
  RolePermissionDetail,
  RolePermission,
} from './dto/role.interface';
import { ROLE_PERMISSION_FROM_DTO } from './dto/role-dto-transformation';

@Injectable({
  providedIn: 'root',
})
export class RoleApiService {
  private readonly http = inject(HttpClient);
  fetchRoles(
    params: Partial<ApiParam & { name?: string }> = {},
  ): Observable<IPaginatedResponse<RolePermission[]>> {
    const { name, ...rest } = params;
    const queryParams = {
      ...rest,
      ...(name ? { searchText: name } : {}),
    };
    return this.http
      .get<IPaginatedResponse<RolesResponseDataDTO>>(`${ApiUrl.v1BE}/roles`, {
        params: queryParams,
      })
      .pipe(
        map((res) => {
          const roles = ROLE_PERMISSION_FROM_DTO.roles(res.data);
          return {
            ...res,
            data: roles,
          };
        }),
      );
  }

  fetchResources(): Observable<ResourceResponseData> {
    return this.http
      .get<IResponse<ResourceResponseDataDTO>>(`${ApiUrl.v1BE}/permissions`)
      .pipe(
        map((res) => {
          return ROLE_PERMISSION_FROM_DTO.resourceResponseData(res.data);
        }),
      );
  }

  fetchRolesForDropDown(): Observable<ISelectValue[]> {
    return this.fetchRoles({ itemsPerPage: 100, pageNumber: 1 }).pipe(
      map((roleResponse) => {
        const resources: ISelectValue[] = [];
        roleResponse.data.forEach((item) => {
          resources.push({
            value: item.id,
            displayedValue: item.displayName,
            extraData: item,
          });
        });
        return resources;
      }),
    );
  }

  fetchRoleById(roleId: number): Observable<RolePermissionDetail> {
    return this.http
      .get<IResponse<RoleDetailDTO>>(`${ApiUrl.v1BE}/roles/${roleId}`)
      .pipe(
        map((res) => {
          return ROLE_PERMISSION_FROM_DTO.roleDetail(res.data);
        }),
      );
  }

  fetchAssignedUsers(
    roleId: number,
    params: Partial<ApiParam>,
  ): Observable<IPaginatedResponse<RoleAssignedUser[]>> {
    return this.http
      .get<AssignedUserResponseDTO>(`${ApiUrl.v1BE}/roles/${roleId}/users`, {
        params: params,
      })
      .pipe(
        map((res) => {
          const users = ROLE_PERMISSION_FROM_DTO.users(res.data);
          return {
            ...res,
            data: users,
          };
        }),
      );
  }

  addRole(data: RoleRequest) {
    return this.http.post(`${ApiUrl.v1BE}/roles`, data);
  }

  updateRole(roleId: number, data: RoleRequest) {
    return this.http.put(`${ApiUrl.v1BE}/roles/${roleId}`, data);
  }

  deleteRole(roleId: number) {
    return this.http.delete(`${ApiUrl.v1BE}/roles/${roleId}`);
  }
  unLinkUserFromRole(roleId: number, userId: number) {
    return this.http.put(
      `${ApiUrl.v1BE}/personnels/${userId}/roles/${roleId}/unlink`,
      {},
    );
  }
}
