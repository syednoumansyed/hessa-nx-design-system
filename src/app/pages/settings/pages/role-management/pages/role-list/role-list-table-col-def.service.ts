import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ITableCol } from '@ui-kit/hes-table/model';
import { TranslocoService } from '@jsverse/transloco';
import { faEye, faPen } from '@fortawesome/pro-light-svg-icons';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

export interface RoleListTableCol {
  id: number;
  name: string;
  assignable: boolean;
  deletable: boolean;
  editable: boolean;
  createdAt: string | null;
  createdBy?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RoleListTableColDefService {
  private readonly router = inject(Router);
  private readonly translocoService = inject(TranslocoService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  readonly actions: IAction<RoleListTableCol>[] = [
    {
      iconProps: { icon: faEye },
      text: 'View',
      onClick: (data) => {
        this.router.navigate(['settings/roles/detail', data.id]);
      },
      hasPermission: () => {
        return this.rbacService.hasPermission(
          RESOURCE_PERMISSION.rolesAndPermission.viewRoleDetail,
        );
      },
    },
    {
      iconProps: { icon: faPen },
      text: 'Edit',
      onClick: (data) => {
        this.router.navigate(['settings/roles/edit', data?.id]);
      },
      hasPermission: (data) => {
        return (
          data.editable &&
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.rolesAndPermission.updateRole,
          )
        );
      },
    },
  ];
  colDef: ITableCol<RoleListTableCol>[] = [
    {
      field: 'name',
      headerName: this.translocoService.translate(
        'roles_permissions.role_name.title',
      ),
      sortable: true,
      filter: true,
    },
    {
      field: 'createdAt',
      headerName: this.translocoService.translate('global.date_time.title'),
      sortable: true,
      filter: false,
      type: 'dateTime',
    },
    {
      field: 'actions',
      headerName: this.translocoService.translate('global.actions.title'),
      sortable: false,
      filter: false,
      type: 'action',
      actions: this.actions,
    },
  ];
}
