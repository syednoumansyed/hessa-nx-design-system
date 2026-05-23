import { computed, inject, Injectable, signal } from '@angular/core';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ITableCol } from '@ui-kit/hes-table/model';
import { SessionActionTableCellComponent } from './components/session-action-table-cell/session-action-table-cell.component';
import { Router } from '@angular/router';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { VirtualClassroomServiceProviders } from './data-access/vcr.enum';
import { LectureVCRTableCellComponent } from './components/lecture-vcr-table-cell/lecture-vcr-table-cell.component';
import { VcrAPIService } from './data-access/vcr.api-service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { Subject } from 'rxjs';
import { AuthService } from '@auth/auth.service';
import {
  VirtualClassroom,
  VirtualClassroomLecture,
} from './data-access/vcr.interface';

@Injectable({
  providedIn: 'root',
})
export class VCRColDefService {
  // #region injection
  private readonly translateService = inject(HesTranslateService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly virtualClassroomService = inject(VcrAPIService);
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private readonly toastr = inject(HesToasterService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  // #endregion

  //#region private Properties
  private readonly refreshTableSubject = new Subject<void>();
  // #endregion

  // #region public properties
  readonly refreshTable = this.refreshTableSubject.asObservable();

  readonly columnsDef = computed<ITableCol<VCRTableItem>[]>(() => {
    const isPersonnel = this.authService.isUserPersonnel();
    const isStudent = this.authService.isUserStudent();
    let classAndLevelCol: ITableCol<VCRTableItem>[] = [];
    let teacherCol: ITableCol<VCRTableItem>[] = [];
    const isAdvanceFilter = this.rbacService.hasPermission(
      RESOURCE_PERMISSION.VCR.READ.VIEW_ADVANCED_FILTERS,
    );
    if (!isStudent) {
      classAndLevelCol = [
        {
          field: 'className',
          headerName: this.translateService.t('global.class.title'),
          sortable: false,
          filter: false,
          filterPlaceholder: this.translateService.t('global.class.title'),
        },
        {
          field: 'levelName',
          headerName: this.translateService.t('global.level.title'),
          sortable: false,
          filter: false,
          SchoolStructureListingType: 'level',
        },
      ];
    }
    if (isAdvanceFilter || !isPersonnel) {
      teacherCol = [
        {
          field: 'teacherName',
          sortable: false,
          filter: false,
          headerName: this.translate('global.teacher.title'),
        },
      ];
    }
    return [
      {
        field: 'subjectName',
        sortable: false,
        filter: false,
        headerName: this.translate('global.subject.title'),
      },
      ...teacherCol,
      {
        field: 'providerName',
        sortable: false,
        filter: false,
        headerName: this.translate('virtual_classrooms.service_provider.title'),
      },
      ...classAndLevelCol,
      {
        field: 'lectureId',
        sortable: false,
        filter: false,
        headerName: this.translate('resource.lecture'),
        cellRenderer: LectureVCRTableCellComponent,
        cellRendererParams: {
          hideLectureDialog: true,
        },
      },
      {
        field: '',
        headerName: this.translate('global.actions.title'),
        sortable: false,
        filter: false,
        cellRenderer: SessionActionTableCellComponent,
      },
      {
        field: '',
        headerName: this.translate(''),
        sortable: false,
        filter: false,
        type: 'action',
        actions: this.actions(),
      },
    ];
  });
  // #endregion

  // region public methods
  mapToTableRow(data: VirtualClassroom[]): VCRTableItem[] {
    return data.map((item) => {
      return {
        id: item.id,
        providerName: this.getProviderName(item.serviceProvider),
        levelName: item.level.displayName,
        className: item.class.displayName,
        subjectName: item.subject.displayName,
        lectures: item.lectures ?? [],
        hasPastSession: item.hasPastSession,
        hasUpcomingSession: item.hasUpcomingSession,
        meetingLink: item.meetingLink,
        teacherName: item?.personnel?.displayName,
        vcrLectureId: item.nextVirtualClassroomLectureId,
      };
    });
  }

  // #endregion

  // #region private methods
  readonly actions = computed<IAction<VCRTableItem>[]>(() => {
    return [
      {
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.VCR.CREATE.MANAGE_RECORDINGS,
          );
        },
        text: this.translateService.t(
          'virtual_classrooms.manage_recordings.btn',
        ),
        onClick: (data) => {
          this.router.navigate([`vcr/manage-recordings/${data.id}`]);
        },
      },
      {
        hasPermission: () => {
          return true;
        },
        text: this.translateService.t(
          'virtual_classrooms.manage_attendance.btn',
        ),
        onClick: (data) => {
          this.router.navigate([`vcr/attendance/${data.id}`]);
        },
      },
      {
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.VCR.UPDATE.UPDATE_VCR,
            true,
          );
        },
        text: this.translateService.t('global.edit.btn'),
        onClick: (data) => {
          this.router.navigate([`vcr/${data.id}/update`]);
        },
      },
      {
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.VCR.READ.VIEW_VCR_DETAILS,
            true,
          );
        },
        text: this.translateService.t('global.view.btn'),
        onClick: (data) => {
          this.router.navigate([`vcr/${data.id}`]);
        },
      },
      {
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.VCR.DELETE.DELETE_VCR,
            true,
          );
        },
        text: this.translateService.t('global.delete.btn'),
        onClick: (data) => {
          this.deleteVCRConfirmationModal(data.id);
        },
      },
    ];
  });

  private translate(key: string) {
    return this.translateService.t(key);
  }

  private getProviderName(provider: VirtualClassroomServiceProviders) {
    return this.translateService.enumT(provider);
  }
  deleteVCRConfirmationModal(id: number) {
    this.genericModalSerivce.show(
      () => {
        this.virtualClassroomService.deleteVirtualClassroom(id).subscribe({
          next: (_resp) => {
            this.toastr.success(_resp.message);
            this.refreshTableSubject.next();
          },
          error: (_errorResp) => {
            this.toastr.showBackendError(_errorResp);
          },
        });
      },
      {
        modalTitle: this.translate('virtual_classrooms.delete_msg.text'),
        modalMessage: '',
        primaryBtnStr: this.translate('global.delete.btn'),
      },
    );
  }
  // #endregion
}

// #endregion external
export interface VCRTableItem {
  id: number;
  subjectName: string;
  teacherName: string;
  providerName: string;
  levelName: string;
  className: string;
  lectures: VirtualClassroomLecture[];
  hasPastSession: boolean;
  hasUpcomingSession: boolean;
  meetingLink: string;
  vcrLectureId: number;
}

// #region internal
