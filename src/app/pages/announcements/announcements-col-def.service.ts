import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { IAnnouncementListItem } from '@shared/interfaces/announcements.interface';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ActivatedRoute, Router } from '@angular/router';
import { AttachmentsTableCellComponent } from './components/attachments-table-cell/attachments-table-cell.component';
import { faEye, faPen, faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { DsModalService } from '@ds/modal/modal.service';
import { AnnouncementPreviewModalComponent } from './components/announcement-preview-modal/announcement-preview-modal.component';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { AnnouncementsService } from './announcements.service';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { CreateAnnouncementModalService } from './utils/create-announcement-modal.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { AnnouncementType } from '@shared/enums';

@Injectable()
export class AnnouncementsColDefService {
  private readonly translocoService = inject(TranslocoService);
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private readonly announcementService = inject(AnnouncementsService);
  private readonly toasterService = inject(ToastrService);
  private readonly createAnnouncementModalService = inject(
    CreateAnnouncementModalService,
  );
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly modalService = inject(DsModalService);
  private _refresh = new Subject<void>();
  readonly refresh$ = this._refresh.asObservable();
  private _createClicked = new Subject<void>();
  readonly createClicked$ = this._createClicked.asObservable();
  actions: IAction<IAnnouncementListItem>[] = [
    {
      iconProps: { icon: faEye },
      text: this.translateGlobal('global.view.btn'),
      onClick: (data) => this.openPreviewModal(data),
      hasPermission: (data) => {
        // Only show View action for POST type announcements (not SMS or Notification)
        if (data.type === AnnouncementType.POST) {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.announcement.announcementListView,
          );
        }
        return false;
      },
    },
    {
      iconProps: { icon: faPen },
      text: this.translateGlobal('global.edit.btn'),
      onClick: (data) => {
        const path =
          data.type === AnnouncementType.POST
            ? 'post'
            : data.type === AnnouncementType.SMS
              ? 'sms'
              : 'notification';
        this.router.navigate(['../', path, data?.id], {
          relativeTo: this.route,
        });
      },
      hasPermission: (data) => {
        if (data.type === AnnouncementType.POST) {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.announcement.announcementUpdatePost,
          );
        }
        return false;
      },
    },
    {
      iconProps: { icon: faTrashCan },
      text: this.translateGlobal('global.delete.btn'),
      onClick: (data) => {
        this.genericModalSerivce.show(
          () => {
            this.announcementService
              .deleteAnnouncement(data.id, data.type)
              .subscribe(() => {
                this._refresh.next();
                this.toasterService.success(
                  '',
                  this.translate(
                    'announcements.successfully_delete_announcement_msg.txt',
                  ),
                );
              });
          },
          {
            modalMessage: this.translate(
              'announcements.delete_announcement_msg.txt',
            ),
            modalTitle: this.translate(
              'announcements.delete_aannouncement.title',
            ),
            primaryBtnStr: this.translocoService.translate('global.delete.btn'),
          },
        );
      },
      hasPermission: (data) => {
        if (data.type === AnnouncementType.POST) {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.announcement.announcementDeletePost,
          );
        }
        return false;
      },
    },
  ];

  columns: ITableCol<IAnnouncementListItem>[] = [
    {
      field: 'type',
      headerName: this.translateGlobal('global.type.title'),
      sortable: false,
      filter: false,
      // TODO: Due to enum type should change to uppercase once the backend is done
      type: 'enum',
    },
    {
      field: 'title',
      headerName: this.translate('announcements.title.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'content',
      headerName: this.translate('announcements.content.title'),
      sortable: false,
      filter: false,
      wrapText: true,
      autoHeight: true,
    },
    {
      field: 'attachments',
      headerName: this.translateGlobal('global.attachments.title'),
      sortable: false,
      filter: false,
      cellRenderer: AttachmentsTableCellComponent,
    },
    {
      field: 'targetSchools',
      headerName: this.translate('announcements.target_schools.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'targetRoles',
      headerName: this.translate('announcements.target_roles.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'createdBy',
      headerName: this.translateGlobal('global.created_by.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'createdAt',
      headerName: this.translateGlobal('global.date_time.title'),
      sortable: false,
      filter: false,
      type: 'dateTime',
    },
    {
      field: 'sendCount',
      headerName: this.translate('announcements.sends.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'viewsCount',
      headerName: this.translate('announcements.impressions.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'status',
      headerName: this.translateGlobal('global.status.title'),
      sortable: false,
      filter: false,
      // for MVP there is only one status (Published) that's why we use a function to render the badge
      // in the future we can refactor to custom cell renderer component to render based on status
      cellRenderer: (params: any) => {
        return `<div class="w-fit hes-badge hes-badge--success capitalize text-xs font-medium leading-[1.125rem]">${this.translate('enum.' + params.value)}</div>`;
      },
    },
    {
      field: 'actions',
      headerName: this.translateGlobal('global.actions.title'),
      sortable: false,
      filter: false,
      type: 'action',
      actions: this.actions,
    },
  ];

  noRowsOverlayComponentParams: INoRowsOverlay = {
    imgSrc: 'assets/illustrations/no_data.svg',
    ...(this.rbacService.hasSomePermission([
      RESOURCE_PERMISSION.announcement.announcementCreateNotification,
      RESOURCE_PERMISSION.announcement.announcementCreatePost,
      RESOURCE_PERMISSION.announcement.announcementCreateSms,
    ]) && {
      subTitle: this.translate('announcements.no_announcements_msg.txt'),
      btnText: this.translate('announcements.create_announcement.btn'),
      btnClick: () => {
        this._createClicked.next();
        this.createAnnouncementModalService.showCreateAnnouncementModal();
      },
    }),
  };

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  private async openPreviewModal(data: IAnnouncementListItem) {
    const canEdit = this.rbacService.hasPermission(
      RESOURCE_PERMISSION.announcement.announcementUpdatePost,
    );

    const modalRef = await this.modalService.open({
      component: AnnouncementPreviewModalComponent,
      componentProps: {
        announcementId: data.id,
        announcementType: data.type,
      },
      headerConfig: {
        title: this.translate('announcements.post_preview.title'),
        showCloseButton: true,
      },
      ...(canEdit && {
        footerConfig: {
          primaryButton: {
            text: this.translateGlobal('global.edit.btn'),
          },
          fullWidthButtons: true,
        },
      }),
      size: 'md',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm') {
      this.router.navigate(['announcements', 'post', data.id]);
    }
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  private translateGlobal(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
