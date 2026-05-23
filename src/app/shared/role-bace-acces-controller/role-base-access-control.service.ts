import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import {
  RoleDetailDTO,
  RolePermissionsResponseDTO,
} from '@core/api-services/role-api/dto/role.dto';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { EMPTY, Observable, tap } from 'rxjs';
import { RESOURCE_PERMISSION } from './resource-permission.constant';

@Injectable({
  providedIn: 'root',
})
export class RoleBaseAccessControlService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly permissionsLookUp = signal<Map<number, string>>(new Map());
  private _isSuperAdmin = signal<boolean>(false);
  public readonly isSuperAdmin = this._isSuperAdmin.asReadonly();
  private _isTeacherOnly = signal<boolean>(false);
  public readonly isTeacherOnly = this._isTeacherOnly.asReadonly();
  private _isTeacher = signal<boolean>(false);
  public readonly isTeacher = this._isTeacher.asReadonly();

  private readonly _hasNationalIdPermission = signal<boolean>(false);
  public readonly hasNationalIdPermission =
    this._hasNationalIdPermission.asReadonly();

  fetchPermission(): Observable<IResponse<RolePermissionsResponseDTO>> {
    const type = this.authService.user()?.type;
    const userId = this.authService.user()?.id;
    if (type && userId) {
      return this.http
        .get<
          IResponse<RolePermissionsResponseDTO>
        >(`${ApiUrl.v1BE}/users/roles/permissions`)
        .pipe(
          tap((res) => {
            // Set super admin status from the response
            this._isSuperAdmin.set(res.data.isSuperAdmin);
            this._isTeacherOnly.set(res.data.isTeacherOnly);
            this._isTeacher.set(res.data.isTeacher);
            // Build permission lookup from roles and permissions
            if (res.data.rolesAndPermissions?.length > 0) {
              this.buildPermissionLookup(res.data.rolesAndPermissions);
            }
          }),
        );
    } else {
      this._isSuperAdmin.set(false);
      this._isTeacherOnly.set(false);
      this._isTeacher.set(false);
      return EMPTY;
    }
  }

  hasPermission(permissionIds: number, bypassSuperAdminCheck = false) {
    if (this._isSuperAdmin() && !bypassSuperAdminCheck) {
      return true;
    }
    return this.permissionsLookUp().has(permissionIds);
  }

  hasSomePermission(permissionIds: number[], bypassSuperAdminCheck = false) {
    if (this._isSuperAdmin() && !bypassSuperAdminCheck) {
      return true;
    }
    return permissionIds.some((permissionId) =>
      this.hasPermission(permissionId),
    );
  }

  hasEveryPermission(permissionIds: number[], bypassSuperAdminCheck = false) {
    if (this._isSuperAdmin() && !bypassSuperAdminCheck) {
      return true;
    }
    return permissionIds.every((permissionId) =>
      this.hasPermission(permissionId),
    );
  }

  isCurrentUser(userId: number): boolean {
    return this.authService.user()?.id === userId;
  }

  private buildPermissionLookup(roles: RoleDetailDTO[]) {
    const newLookUp = new Map();
    roles.forEach((role) => {
      role.resources?.forEach((resource) => {
        role.dependentPermission?.forEach((depPermission) => {
          newLookUp.set(depPermission.dependentPermissionId, '');
        });
        resource.permissions?.forEach((permission) => {
          newLookUp.set(permission.id, permission.action);
        });
      });
    });
    this.permissionsLookUp.set(newLookUp);
    this._hasNationalIdPermission.set(
      this.hasPermission(RESOURCE_PERMISSION.GLOBAL.UPDATE_NATIONAL_ID),
    );
  }
}
