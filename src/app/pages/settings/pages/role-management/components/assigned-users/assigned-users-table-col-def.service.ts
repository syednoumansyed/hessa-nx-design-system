import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ITableCol } from '@ui-kit/hes-table/model';
import { TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { faEye, faUserXmark } from '@fortawesome/pro-light-svg-icons';
import { AssignedUsersDTO } from '@core/api-services/role-api/dto/assigned-users.dto';
import { UserType } from '@shared/enums';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RoleAssignedUser } from '@core/api-services/role-api/dto/role.interface';

export interface AssignedUsersTableCol {
  id: number;
  fullName: string;
  nationalId: number;
  phoneNumber: string;
  createdBy: string;
  type: UserType;
  createdAt: string;
}

@Injectable()
export class AssignedUsersTableColDefService {
  private readonly router = inject(Router);
  private readonly translocoService = inject(TranslocoService);
  private readonly onUnLinkSource = new Subject<number>();
  private readonly rbacService = inject(RoleBaseAccessControlService);
  readonly onUnLink$ = this.onUnLinkSource.asObservable();

  readonly actions: IAction<AssignedUsersTableCol>[] = [
    {
      iconProps: { icon: faEye },
      text: 'View',
      onClick: (data) => {
        if (data.type === UserType.STUDENT) {
          this.router.navigate(['user-management/students', data.id]);
        } else if (data.type === UserType.GUARDIAN) {
          this.router.navigate(['user-management/guardians', data.id]);
        } else if (data.type === UserType.PERSONNEL) {
          this.router.navigate(['user-management/personnels', data.id]);
        }
      },
      hasPermission: (data) => {
        if (data.type === UserType.STUDENT) {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.viewStudentProfile,
          );
        } else if (data.type === UserType.GUARDIAN) {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.guardians.viewGuardianProfile,
          );
        } else if (data.type === UserType.PERSONNEL) {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.viewPersonnelProfile,
          );
        } else {
          return false;
        }
      },
    },
    {
      iconProps: { icon: faUserXmark },
      text: 'UnLink',
      onClick: (data) => {
        if (data.type === UserType.PERSONNEL) this.onUnLinkSource.next(data.id);
      },
      hasPermission: (data) => {
        if (data.type === UserType.STUDENT) {
          return false;
        } else if (data.type === UserType.GUARDIAN) {
          return false;
        } else if (data.type === UserType.PERSONNEL) {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.editPersonnelProfile,
          );
        } else {
          return false;
        }
      },
    },
  ];

  colDef: ITableCol<AssignedUsersTableCol>[] = [
    {
      field: 'fullName',
      headerName: this.translocoService.translate('global.name.title'),
      sortable: false,
      filter: false,
      filterPlaceholder: this.translocoService.translate('global.name.title'),
    },
    {
      field: 'nationalId',
      headerName: this.translocoService.translate('global.national_id.title'),
      sortable: false,
      filter: false,
      filterPlaceholder: this.translocoService.translate(
        'global.national_id.title',
      ),
    },
    {
      field: 'phoneNumber',
      headerName: this.translocoService.translate('global.phone_number.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'createdBy',
      headerName: this.translocoService.translate(
        'roles_permissions.assigned_by.title',
      ),
      sortable: false,
      filter: false,
    },
    {
      field: 'createdAt',
      headerName: this.translocoService.translate('global.date_time.title'),
      sortable: false,
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

  mapTableData(data: RoleAssignedUser[]): AssignedUsersTableCol[] {
    return data.map((item) => {
      return {
        id: item.id,
        fullName: item.displayName,
        nationalId: item.nationalId,
        createdBy: item.createdBy.displayName || '-',
        createdAt: item.createdAt,
        phoneNumber: item.phoneNumber,
        type: item.type,
      };
    });
  }
}
