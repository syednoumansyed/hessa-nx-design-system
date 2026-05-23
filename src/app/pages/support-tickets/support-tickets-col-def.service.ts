import { Injectable, computed, inject } from '@angular/core';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { faEye, faUserCheck, faPen } from '@fortawesome/pro-regular-svg-icons';
import { IAssignedSupportTicketListItem } from '@shared/interfaces/support-tickets.interface';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import { TranslocoService } from '@jsverse/transloco';
import { openDeEscalationModal } from './escalation-resolve-modal';
import { HelpCenterSupportTicketsService } from '@pages/help-center/data-access/support-tickets.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { Subject, switchMap } from 'rxjs';
import { createReassignModal } from './modals/reassign-ticket.modal';
import { ModalController } from '@ionic/angular/standalone';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { SupportTicketStatus } from '@shared/enums';

@Injectable()
export class AssignedSupportTicketsColDefService {
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly supportTicketsService = inject(SupportTicketsService);
  private readonly reassignModal = createReassignModal();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly transloco = inject(TranslocoService);
  private readonly supportTicketService = inject(
    HelpCenterSupportTicketsService,
  );
  private schoolScopeService = inject(SchoolStructureScopeService);
  private translocoService = inject(TranslocoService);
  private modalCtrl = inject(ModalController);
  private toastr = inject(HesToasterService);
  private reloadSource = new Subject<void>();
  readonly reload$ = this.reloadSource.asObservable();
  readonly actions = computed<IAction<IAssignedSupportTicketListItem>[]>(() => {
    return [
      {
        iconProps: { icon: faEye },
        text: this.transloco.translate('global.view.btn'),
        onClick: (data) => {
          this.openTicketDetailsPage(data.id);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.viewMyAssignedTicketDetails,
          );
        },
      },
      {
        hesIconProps: { src: 'assets/icons/ticket-discount.svg' },
        text: this.transloco.translate('global.de_escalate.btn'),
        onClick: (data) => {
          this.openDeescalateModal(data.id);
        },
        hasPermission: (data) => {
          if (data.status === SupportTicketStatus.RESOLVED) {
            return false;
          } else if (
            data.currentEscalationLevelNumber == data.firstEscalationLevelNumber
          ) {
            return false;
          }
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.deEscalate,
          );
        },
      },
      {
        iconProps: { icon: faUserCheck },
        text: this.transloco.translate('global.re_assign.btn'),
        onClick: (data) => {
          this.reassignModal({
            ticketId: data.id.toString(),
            afterReassigned: () => {
              this.reloadSource.next();
            },
          });
        },
        hasPermission: (data) => {
          if (data.status === SupportTicketStatus.RESOLVED) {
            return false;
          }
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.supportTicket.reassign,
          );
        },
      },
    ];
  });

  openDeescalateModal(ticketId: number) {
    openDeEscalationModal({
      modalCtrl: this.modalCtrl,
      deEscalate: true,
      closeModal: () => this.modalCtrl.dismiss(),
      onDeEscalate: (description: any, attachments: File[]) => {
        const attachmentsToUpload = attachments ?? [];
        this.supportTicketService
          .uploadFile(attachmentsToUpload)
          .pipe(
            switchMap((uploadedAttachments) => {
              const attachmentKeys =
                uploadedAttachments?.map((file) => file.key) || [];
              const payload: any = {
                description: description,
                ...(attachmentKeys.length && { attachments: attachmentKeys }),
                schoolStructureId:
                  this.schoolScopeService.selectedSchoolStructureItem()?.id!,
                deEscalate: true,
              };
              return this.supportTicketsService.escalateTicket(
                ticketId.toString(),
                payload.description,
                payload.schoolStructureId,
                payload.attachments,
                payload.deEscalate,
              );
            }),
          )
          .subscribe({
            next: () => {
              this.modalCtrl.dismiss();
              this.toastr.success(
                this.translocoService.translate(
                  'api.success.ticket.deescalation.found',
                ),
              );
            },
            error: (_err) => {
              this.toastr.showBackendError(_err);
            },
          });
      },
    });
  }

  noRowsOverlayComponentParams = computed<INoRowsOverlay>(() => {
    return {
      imgSrc: 'assets/illustrations/no_data.svg',
      title: this.translate('global.no_data.txt'),
    };
  });

  columns = computed<ITableCol<IAssignedSupportTicketListItem>[]>(() => [
    {
      field: 'id',
      headerName: this.translate('support_ticket.ticket_id.label'),
      sortable: false,
      filter: true,
    },
    {
      field: 'createdAt',
      headerName: this.translate('support_ticket.create_date_time.title'),
      sortable: false,
      type: 'dateTime',
      filter: true,
      filterType: 'date',
    },
    {
      field: 'supportType',
      headerName: this.translate('support_ticket.category_req.label'),
      sortable: false,
      filter: true,
      filterType: 'select',
      filterSelectOptions: this.supportTicketsService
        .ticketTypes()
        .map((type) => {
          return {
            displayedValue: type.displayName,
            value: type.id,
          };
        }),
      valueFormatter: (params) => params.value,
    },
    {
      field: 'supportCategory',
      headerName: this.translate('support_tickets.sub_category_title.label'),
      sortable: false,
      filter: true,
      filterType: 'select',
      filterSelectOptionsSignal:
        this.supportTicketsService.ticketCategoriesDropdownList,
      valueFormatter: (params) => params.value,
    },
    {
      field: 'title',
      headerName: this.translate('support_ticket.title.title'),
      sortable: false,
      filter: true,
    },
    {
      field: 'createdByName',
      headerName: this.translate('global.created_by.title'),
      sortable: false,
      filter: true,
    },
    {
      field: 'assignedTo',
      headerName: this.translate('support_ticket.assigned_to.label'),
      sortable: false,
      filter: false,
    },
    {
      field: 'status',
      headerName: this.translate('global.status.title'),
      sortable: false,
      filter: true,
      filterType: 'select',
      filterSelectOptions: [
        SupportTicketStatus.REVIEW,
        SupportTicketStatus.RESOLVED,
      ].map((key) => ({
        value: SupportTicketStatus[key as keyof typeof SupportTicketStatus],
        displayedValue: this.translate(
          'enum.' +
            SupportTicketStatus[
              key as keyof typeof SupportTicketStatus
            ].toUpperCase(),
        ),
      })),
      cellRenderer: (params: any) => {
        return `<div class="w-fit hes-badge hes-badge--${params.data.status == SupportTicketStatus.RESOLVED ? 'success' : 'warnning'} capitalize text-xs font-medium leading-[1.125rem]">
        ${this.translate('enum.' + params.data.status.toUpperCase())}
        </div>`;
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
  ]);

  private openTicketDetailsPage(id: number) {
    this.router.navigate([id], { relativeTo: this.route });
  }

  private translate(key: string, params: object = {}): string {
    return this.transloco.translate(key, params);
  }
}
