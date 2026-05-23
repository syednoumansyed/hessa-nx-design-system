import { Injectable, inject } from '@angular/core';
import { LastActiveDateCellComponent } from '@pages/user-management/components/last-active-date-cell/last-active-date-cell.component';
import {
  Gender,
  ResourceStatus,
  UserStatus,
  dropdownArrayFromEnum,
  enumArrayFromEnum,
} from '@shared/enums';
import { Idropdown, IStudentListItem } from '@shared/interfaces';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ITableCol } from '@ui-kit/hes-table/model';
import { ICellRendererParams } from 'ag-grid-community';

export interface AssigendStudentFilterInit {
  academicYearId?: number;
  studentClassStatus?: string;
  academicYearList: Idropdown[];
  isStudentClassStatusFilter: boolean;
}
@Injectable()
export class StudentColDefinition {
  private readonly translocoService = inject(HesTranslateService);

  columns = (initFilter: AssigendStudentFilterInit, actions?: IAction[]) => {
    const colDef: ITableCol<IStudentListItem>[] = [
      {
        field: 'displayName',
        headerName: this.translocoService.t('global.name.title'),
        sortable: true,
        filter: false,
      },
      {
        field: 'nationalId',
        headerName: this.translocoService.t('global.national_id.title'),
        sortable: true,
        filter: false,
      },
      {
        field: 'id',
        headerName: this.translocoService.t('global.student_id.title'),
        sortable: true,
        filter: false,
      },
      {
        field: 'pioneerId',
        headerName: 'Pioneer ID',
        sortable: false,
        filter: false,
      },
      {
        field: 'guardian',
        headerName: this.translocoService.t('global.linked_guardians.title'),
        sortable: false,
        filter: false,
      },
      {
        field: 'phoneNumber',
        headerName: this.translocoService.t('global.phone_number.title'),
        sortable: true,
        filter: false,
        cellRenderer: (params: any) => {
          return `<div class="phone-number-dir">${params.value}</div>`;
        },
      },
      {
        field: 'gender',
        headerName: this.translocoService.t('global.gender.title'),
        sortable: true,
        filter: true,
        filterType: 'chip-selector',
        valueFormatter: (params) => this.translocoService.t(params.value),
        filterSelectOptions: dropdownArrayFromEnum(Gender),
      },
      {
        field: 'nationalityName',
        headerName: this.translocoService.t('global.nationality.title'),
        sortable: false,
        filter: false,
      },
      {
        field: 'companyId',
        headerName: this.translocoService.t('global.company.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'company',
        valueFormatter: ({ data }) => {
          return data.companyName ?? '-';
        },
        filterOrder: -5,
      },
      {
        field: 'campusId',
        headerName: this.translocoService.t('global.campus.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'campus',
        valueFormatter: ({ data }) => {
          return data.campusName ?? '-';
        },
        filterOrder: -4,
      },
      {
        field: 'schoolId',
        headerName: this.translocoService.t('global.school.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'school',
        valueFormatter: ({ data }) => {
          return data.schoolName ?? '-';
        },
        filterOrder: -3,
      },
      {
        field: 'levelId',
        headerName: this.translocoService.t('global.level.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'level',
        valueFormatter: ({ data }) => {
          return data.levelName ?? '-';
        },
        filterOrder: -2,
      },
      {
        field: 'classId',
        headerName: this.translocoService.t('global.class.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'class',
        valueFormatter: ({ data }) => {
          return data.className ?? '-';
        },
        filterOrder: -1,
      },
      {
        field: 'passportNumber',
        headerName: this.translocoService.t('global.passport_num.title'),
        sortable: false,
        filter: false,
      },
      {
        field: 'passportExpiryDate',
        headerName: this.translocoService.t(
          'global.passport_expiry_date.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'date',
        type: 'date',
      },
      {
        field: 'dateOfBirth',
        headerName: this.translocoService.t('global.date_of_birth.title'),
        sortable: false,
        filter: true,
        filterType: 'date',
        type: 'date',
      },
      {
        field: 'registrationDate',
        headerName: this.translocoService.t('global.registration_date.title'),
        sortable: false,
        filter: true,
        filterType: 'date',
        type: 'date',
      },
      {
        field: 'aId',
        headerName: this.translocoService.t('global.academic_year.title'),
        filterPlaceholder: this.translocoService.t(
          'global.academic_year.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        filterinitSelection: initFilter.academicYearId ?? 0,
        filterSelectOptions: initFilter.academicYearList,
        valueFormatter: ({ data }) => {
          return data.academicYearName ?? '-';
        },
      },
      {
        field: 'studentClassStatus',
        headerName: this.translocoService.t(
          'global.student_class.status.title',
        ),
        sortable: false,
        filter: initFilter.isStudentClassStatusFilter,
        type: 'enum',
        filterType: 'chip-selector',
        filterSelectOptions: enumArrayFromEnum(UserStatus).map((status) => ({
          value: status as string | number, // cast status to string | number
          displayedValue: this.translocoService.enumT(status as string),
        })),
        filterinitSelection: initFilter.studentClassStatus || undefined,
      },
      {
        field: 'status',
        headerName: this.translocoService.t('global.status.title'),
        sortable: false,
        filter: false,
        valueFormatter: (params) => {
          return this.translocoService.t('enum.' + params.data.status);
        },
        cellRenderer: (params: ICellRendererParams<IStudentListItem>) => {
          const status =
            params.data?.status === 'INACTIVE'
              ? this.translocoService.t('deactivation_deactivated.txt')
              : this.translocoService.t('enum.' + params.data?.status);
          const color = params.value === 'PAUSED' ? '#B22334' : 'inherit';
          return `<div style="color: ${color};">${status}</div>`;
        },
      },
      {
        field: 'lastActive',
        headerName: this.translocoService.t('global.last_active.txt'),
        sortable: false,
        filter: false,
        cellRenderer: LastActiveDateCellComponent,
      },
    ];

    if (actions?.length) {
      colDef.push({
        field: 'actions',
        headerName: this.translocoService.t('global.actions.title'),
        sortable: false,
        filter: false,
        type: 'action',
        actions: actions,
      });
    }
    return colDef;
  };
}
