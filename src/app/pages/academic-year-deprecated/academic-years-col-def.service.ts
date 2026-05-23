import { Injectable, computed, inject } from '@angular/core';
import { faEye, faPen, faTrashCan } from '@fortawesome/pro-light-svg-icons';
import { TranslocoService } from '@jsverse/transloco';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ITableCol } from '@ui-kit/hes-table/model';
import { SemesterDTO } from './data-access/academic-year.dto';
import { SemesterTableCellComponent } from './components/semester-table-cell/semester-table-cell.component';
import { AcademicYearModalService } from './utils/academic-year-modal.service';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';

export interface AcademicYearsTableCol {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  semesters: SemesterDTO[];
}

@Injectable({
  providedIn: 'root',
})
export class AcademicYearTableColDefService {
  private readonly translocoService = inject(TranslocoService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly academicModalService = inject(AcademicYearModalService);
  readonly actions = computed<IAction<AcademicYearsTableCol>[]>(() => {
    return [
      {
        iconProps: { icon: faEye },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.academicYear.academicYearDetailView,
          );
        },
        text: this.translocoService.translate('global.view.btn'),
        onClick: (data) => {
          this.academicModalService.viewAcademic(data.id);
        },
      },
      {
        iconProps: { icon: faPen },
        text: this.translocoService.translate('global.edit.btn'),
        onClick: (data) => {
          this.academicModalService.showAcademicForm(data.id);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.academicYear.academicYearUpdate,
          );
        },
      },
      {
        iconProps: { icon: faPlus },
        text: this.translate('academic_enrolment.add_semester.btn'),
        onClick: (data) => {
          this.academicModalService.showSemesterForm(data.id);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.semester.semesterCreate,
          );
        },
      },

      {
        iconProps: { icon: faTrashCan },
        text: this.translocoService.translate('global.delete.btn'),
        onClick: (data) => {
          this.academicModalService.deleteAcademicConfirmationModal(data.id);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.academicYear.academicYearDelete,
          );
        },
      },
    ];
  });

  colDef: ITableCol<AcademicYearsTableCol>[] = [
    {
      field: 'name',
      headerName: this.translate('global.name.title'),
      sortable: true,
      filter: false,
    },
    {
      field: 'startDate',
      headerName: this.translate('global.start_date.title'),
      sortable: true,
      filter: false,
      type: 'date',
    },
    {
      field: 'endDate',
      headerName: this.translate('global.end_date.title'),
      sortable: true,
      filter: false,
      type: 'date',
    },
    {
      field: 'semesters',
      headerName: this.translate('global.semester.title'),
      sortable: true,
      filter: false,
      cellRenderer: SemesterTableCellComponent,
      cellRendererParams: (data: AcademicYearsTableCol) => {
        return data;
      },
    },

    {
      field: 'actions',
      headerName: this.translate('global.actions.title'),
      sortable: false,
      filter: false,
      type: 'action',
      actions: this.actions(),
    },
  ];

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
