import { Injectable, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ITableCol } from '@ui-kit/hes-table/model';
import { TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { faBan, faEye, faPen, faUser } from '@fortawesome/pro-light-svg-icons';
import {
  Gender,
  ResourceStatus,
  dropdownArrayFromEnum,
  UserType,
  enumArrayFromEnum,
  UserStatus,
} from '@shared/enums';
import { PersonnelStatusService } from './utils/personnel-status.service';
import { NationalitiesApiService } from '@core/api-services/nationalities-api/nationalities.api-service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

import { AuthService } from '@auth/auth.service';
import { LastActiveDateCellComponent } from '../components/last-active-date-cell/last-active-date-cell.component';
import { Personnel } from '@shared/dto-transformation';
import { HesTranslateService } from '@shared/services/hes-translate.service';

export interface PersonnelTableCol {
  id: number;
  nationalId: string;
  displayName: string;
  phoneNumber: string;
  gender: Gender;
  employeeIdentifier: string;
  dateOfBirth: string | null;
  passportNumber: string;
  passportExpiryDate: string | null;
  nationalityId: string;
  status: string;
  email: string;
  userId: number;
}

@Injectable()
export class PersonnelTableColDefService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly translocoService = inject(HesTranslateService);
  private readonly onUnLinkSource = new Subject<number>();
  readonly onUnLink$ = this.onUnLinkSource.asObservable();
  private readonly personnelStatusService = inject(PersonnelStatusService);
  private readonly nationalitiesApiService = inject(NationalitiesApiService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  constructor() {
    this.nationalitiesApiService.populateNationalitiesList().subscribe();
  }
  actions: IAction<PersonnelTableCol>[] = [
    {
      iconProps: { icon: faEye },
      text: this.translocoService.translate('global.view.btn'),
      onClick: (data) => {
        this.router.navigate([data?.id], {
          relativeTo: this.route,
        });
      },
      hasPermission: (data) => {
        return (
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.viewPersonnelProfile,
          ) || this.rbacService.isCurrentUser(data.userId)
        );
      },
    },
    {
      iconProps: { icon: faPen },
      text: this.translocoService.translate('global.edit.btn'),
      onClick: (data) => {
        this.router.navigate([data?.id, 'update'], {
          relativeTo: this.route,
        });
      },
      hasPermission: (data) => {
        return (
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.editPersonnelProfile,
          ) || this.rbacService.isCurrentUser(data.userId)
        );
      },
    },
    {
      iconProps: { icon: faUser },
      text: this.translocoService.translate('global.login_user.btn'),
      onClick: (data) => {
        // show switch confirmation dialog
        this.authService.displayLoginConfirmationDialog(
          data.userId,
          data.id,
          UserType.PERSONNEL,
        );
      },
      hasPermission: (data) => {
        const isSameUser =
          this.authService.user()?.type === UserType.PERSONNEL &&
          this.authService.user()?.userTypeId === data.id;
        return (
          !this.authService.isLoggedInAsOtherUser() &&
          !isSameUser &&
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.LOGIN.LOGIN_AS_USER,
          )
        );
      },
    },
    {
      iconProps: { icon: faBan, flip: 'horizontal' },
      text: this.translocoService.translate('global.de_activate.btn'),
      textFormatter: (data) =>
        data.status === ResourceStatus.ACTIVE
          ? this.translocoService.translate('global.de_activate.btn')
          : this.translocoService.translate('global.activate_account.btn'),
      onClick: (data) => {
        data.status === ResourceStatus.ACTIVE
          ? this.deactivate(data.id)
          : this.activate(data.id);
      },
      hasPermission: (data) => {
        return this.rbacService.hasPermission(
          RESOURCE_PERMISSION.personnel.decativateActivateProfile,
        );
      },
    },
  ];

  columns = computed<ITableCol<PersonnelTableCol>[]>(() => {
    return [
      {
        field: 'displayName',
        headerName: this.translocoService.translate('global.name.title'),
        sortable: true,
        filter: false,
        filterPlaceholder: this.translocoService.translate('global.name.title'),
      },
      {
        field: 'nationalId',
        headerName: this.translocoService.translate('global.national_id.title'),
        sortable: true,
        filter: false,
        filterPlaceholder: this.translocoService.translate(
          'global.national_id.title',
        ),
      },
      {
        field: 'phoneNumber',
        headerName: this.translocoService.translate(
          'global.phone_number.title',
        ),
        sortable: true,
        filter: false,
        filterPlaceholder: this.translocoService.translate(
          'global.phone_number.title',
        ),
        cellRenderer: (params: any) => {
          return `<div class="phone-number-dir">${params.value}</div>`;
        },
      },
      {
        field: 'gender',
        headerName: this.translocoService.translate('global.gender.title'),
        sortable: true,
        filter: true,
        valueFormatter: (params: any) =>
          this.translocoService.translate('enum.' + params.value),
        filterType: 'chip-selector',
        filterSelectOptions: dropdownArrayFromEnum(Gender),
        filterPlaceholder: this.translocoService.translate(
          'global.gender.title',
        ),
      },
      {
        field: 'nationalityId',
        headerName: this.translocoService.translate('global.nationality.title'),
        sortable: false,
        filter: false,
        filterType: 'chip-selector',
        filterPlaceholder: this.translocoService.translate(
          'global.nationality.title',
        ),
        filterSelectOptionsSignal:
          this.nationalitiesApiService.nationalitiesList,
      },
      {
        field: 'employeeIdentifier',
        headerName: this.translocoService.translate('global.employee_id.label'),
        sortable: false,
        filter: false,
        filterPlaceholder: this.translocoService.translate(
          'global.employee_id.label',
        ),
      },
      {
        field: 'dateOfBirth',
        headerName: this.translocoService.translate(
          'global.date_of_birth.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'date',
        filterPlaceholder: this.translocoService.translate(
          'global.date_of_birth.title',
        ),
        type: 'date',
      },
      {
        field: 'passportNumber',
        headerName: this.translocoService.translate(
          'global.passport_num.title',
        ),
        sortable: false,
        filter: true,
        filterPlaceholder: this.translocoService.translate(
          'global.passport_num.title',
        ),
      },
      {
        field: 'passportExpiryDate',
        headerName: this.translocoService.translate(
          'global.passport_expiry_date.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'date',
        type: 'date',
        filterPlaceholder: this.translocoService.translate(
          'global.passport_expiry_date.title',
        ),
      },
      {
        field: 'startDate',
        headerName: this.translocoService.translate('global.start_date.title'),
        sortable: false,
        filter: true,
        filterType: 'date',
        filterPlaceholder: this.translocoService.translate(
          'global.start_date.title',
        ),
        type: 'date',
      },
      {
        field: 'email',
        headerName: this.translocoService.translate('global.email.title'),
        sortable: false,
        filter: false,
        filterPlaceholder:
          this.translocoService.translate('global.email.title'),
      },
      {
        field: 'schoolId',
        headerName: this.translocoService.translate('global.school.title'),
        filterPlaceholder: this.translocoService.translate(
          'global.school.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'school',
        filterOrder: -1,
      },
      {
        field: 'campusId',
        headerName: this.translocoService.translate('global.campus.title'),
        filterPlaceholder: this.translocoService.translate(
          'global.campus.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'campus',
        filterOrder: -2,
      },
      {
        field: 'companyId',
        headerName: this.translocoService.translate('global.company.title'),
        filterPlaceholder: this.translocoService.translate(
          'global.company.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'company',
        filterOrder: -3,
      },
      {
        field: 'userStatus',
        headerName: this.translocoService.t('global.status.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        filterSelectOptions: enumArrayFromEnum(ResourceStatus).map(
          (status) => ({
            value: status as string,
            displayedValue:
              status === 'INACTIVE'
                ? this.translocoService.t('deactivation_deactivated.txt')
                : this.translocoService.enumT(status as string),
          }),
        ),
        valueFormatter: ({ data }) => {
          if (data.status === 'INACTIVE')
            return this.translocoService.t('deactivation_deactivated.txt');
          else return this.translocoService.enumT(data.status);
        },
      },
      {
        field: 'lastActive',
        headerName: this.translocoService.translate('global.last_active.txt'),
        sortable: false,
        filter: false,
        cellRenderer: LastActiveDateCellComponent,
      },
      {
        field: 'actions',
        headerName: this.translocoService.translate('global.actions.title'),
        sortable: false,
        filter: false,
        type: 'action',
        actions: this.actions,
        lockPosition: true,
      },
    ];
  });

  mapTableData(data: Personnel[]): PersonnelTableCol[] {
    return data.map((item) => {
      return {
        id: item.id,
        displayName: item.displayName,
        phoneNumber: item.countryCode + ' ' + item.phoneNumber,
        status: item.status,
        dateOfBirth: item.dateOfBirth ?? null,
        passportNumber: item.passportNumber ?? '-',
        passportExpiryDate: item.passportExpiryDate ?? null,
        gender: item.gender,
        employeeIdentifier: item.employeeIdentifier,
        nationalId: item.nationalId,
        nationalityId: item.nationality?.displayName ?? '-',
        email: item.email,
        userId: item.userId,
        startDate: item.startDate,
        schoolId: [
          ...new Set(item.schools?.map((school) => school.displayName)),
        ].join(', '),
        campusId: [
          ...new Set(item.campuses?.map((campus) => campus.displayName)),
        ].join(', '),
        companyId: [
          ...new Set(item.companies?.map((company) => company.displayName)),
        ].join(', '),
        lastActive: item.userEvent ? item.userEvent[0]?.createdAt : null,
      };
    });
  }

  deactivate(id: number) {
    this.personnelStatusService.onDeactivatePersonnel(id?.toString());
  }

  activate(id: number) {
    this.personnelStatusService.onActivatePersonnel(id.toString());
  }
}
