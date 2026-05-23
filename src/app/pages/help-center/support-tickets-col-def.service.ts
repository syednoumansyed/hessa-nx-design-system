import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { faEye, faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { HelpCenterSupportTicketsService } from './data-access/support-tickets.service';
import { Subject } from 'rxjs';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { ModalController } from '@ionic/angular/standalone';
import { SupportTicketFormComponent } from './components/support-ticket-form/support-ticket-form.component';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import { openInitiatorTicketDetailsModal } from './pages/support-tickets/components/my-ticket-details-dialog/ticket-details-dialog';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SupportTicketStatus } from '@shared/enums';
import { SupportTicketListItem } from '@shared/dto-transformation';
@Injectable()
export class SupportTicketsColDefService {
  private readonly translocoService = inject(TranslocoService);
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private readonly helpCenterSupportTicketsService = inject(
    HelpCenterSupportTicketsService,
  );
  private readonly supportTicketsService = inject(SupportTicketsService);
  private readonly toasterService = inject(HesToasterService);
  private schoolScopeService = inject(SchoolStructureScopeService);
  private readonly modalController = inject(ModalController);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  private _refresh = new Subject<void>();
  readonly refresh$ = this._refresh.asObservable();
  readonly actions = computed<IAction<SupportTicketListItem>[]>(() => {
    return [
      {
        iconProps: { icon: faEye },
        text: this.translocoService.translate('global.view.btn'),
        onClick: (data) => {
          this.openTicketDetailsPage(data.id);
        },
        permissionIds: [
          RESOURCE_PERMISSION.supportTicket.viewMyInitiatedTicketDetails,
        ],
        hasPermission: () =>
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.viewMyInitiatedTicketDetails,
          ),
      },
      {
        iconProps: { icon: faTrashCan },
        text: this.translocoService.translate('global.delete.btn'),
        onClick: (data) => {
          this.deleteTicketConfirmationModal(data.id);
        },
        permissionIds: [RESOURCE_PERMISSION.supportTicket.deleteTicket],
        hasPermission: () =>
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.deleteTicket,
          ),
      },
    ];
  });

  columns = computed<ITableCol<SupportTicketListItem>[]>(() => [
    {
      field: 'title',
      headerName: this.translate('support_ticket.title.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'createdAt',
      headerName: this.translate('support_ticket.create_date_time.title'),
      sortable: false,
      filter: false,
      type: 'dateTime',
    },
    {
      field: 'supportType',
      headerName: this.translate('support_ticket.category_req.label'),
      sortable: false,
      filter: false,
      valueFormatter: (params) => params.value.displayName,
    },
    {
      field: 'supportCategory',
      headerName: this.translate('support_tickets.sub_category_title.label'),
      sortable: false,
      filter: false,
      valueFormatter: (params) => params.value.displayName,
    },
    {
      field: 'status',
      headerName: this.translate('global.status.title'),
      sortable: false,
      filter: false,
      type: 'enum',
      cellRenderer: (params: any) => {
        return `<div class="w-fit hes-badge hes-badge--${params.value == SupportTicketStatus.RESOLVED ? 'success' : 'warnning'} capitalize text-xs font-medium leading-[1.125rem]">
        ${this.translate('enum.' + params.value.toUpperCase())}
        </div>`;
      },
    },
    {
      field: 'actions',
      headerName: this.translocoService.translate('global.actions.title'),
      sortable: false,
      filter: false,
      type: 'action',
      actions: this.actions(),
    },
  ]);

  noRowsOverlayComponentParams = computed<INoRowsOverlay>(() => {
    const showButton = this.rbacService.hasPermission(
      RESOURCE_PERMISSION.supportTicket.createTicket,
    );
    return {
      imgSrc: 'assets/illustrations/no_data.svg',
      title: this.translate('support_ticket.no_tickets.title'),
      subTitle: showButton
        ? this.translate('support_ticket.no_tickets_msg.text')
        : undefined,
      btnText: showButton
        ? this.translate('support_ticket.add_ticket.btn')
        : undefined,
      btnClick: showButton
        ? () => {
            this.openTicketForm();
          }
        : undefined,
    };
  });

  async openTicketForm() {
    const modal = await this.modalController.create({
      component: SupportTicketFormComponent,
      cssClass: 'xl-modal overflow-y-auto pt-10',
      componentProps: {
        closeModal: (isReload: boolean) => {
          if (isReload) {
            this._refresh.next();
          }
          modal.dismiss();
        },
      },
    });
    modal.present();
  }

  private openTicketDetailsPage(id: number) {
    this.supportTicketsService.getTicketDetailAsInitiator(id).subscribe({
      next: (res) => {
        openInitiatorTicketDetailsModal({
          ticketDetails: signal(res),
          modalCtrl: this.modalController,
          closeModal: () => {
            this.modalController.dismiss();
          },
        });
      },
      error: (err) => {
        this.toasterService.showBackendError(err);
      },
    });
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  deleteTicketConfirmationModal(id: number) {
    this.genericModalSerivce.show(
      () => {
        this.helpCenterSupportTicketsService.deleteTicketById(id).subscribe({
          next: (_resp) => {
            let params = {
              schoolId:
                this.schoolScopeService.selectedSchoolStructureItem()!.id,
            };
            this.helpCenterSupportTicketsService
              .getMyInitiatedTickets(params)
              .subscribe();
            this.toasterService.success(
              '',
              this.translate('support_ticket.ticket_successfully_deleted.txt'),
            );
          },
          error: (_errorResp) => {
            this.toasterService.error(
              this.translate(
                'support_ticket.ticket_unsuccessfully_deleted.txt',
              ),
              this.translate('global.wrong_msg.title'),
            );
          },
        });
      },
      {
        modalTitle: this.translate('support_ticket.delete_msg.text'),
        modalMessage: '',
        primaryBtnStr: this.translate('global.delete.btn'),
      },
    );
  }
}
