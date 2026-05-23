import { Injectable, inject } from '@angular/core';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { DsModalService } from '@ds/modal';
import { SupportTicketStatus } from '@shared/enums';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { AuthService } from '@auth/auth.service';
import { SupportTicketsService } from '@shared/services/support-tickets.service';
import { firstValueFrom, Subject } from 'rxjs';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { DsAttachmentControlValue } from '@ds/attachment/attachment-control-value.interface';
import { SupportHubTicketsService } from '../data-access/support-hub-tickets.service';
import { SupportHubTicket } from '../data-access/support-hub-initiated-tickets.interface';
import {
  SupportTicketResolveModalComponent,
  SupportTicketResolvePayload,
} from '../components/resolve-ticket-modal/support-ticket-resolve-modal.component';
import {
  SupportTicketDeescalateModalComponent,
  SupportTicketDeescalatePayload,
} from '../components/de-escalate-ticket-modal/support-ticket-deescalate-modal.component';
import {
  SupportTicketEscalateModalComponent,
  SupportTicketEscalatePayload,
} from '../components/escalate-ticket-modal/support-ticket-escalate-modal.component';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import {
  faArrowDown,
  faCircleCheck,
  faEye,
  faUserPlus,
} from '@fortawesome/pro-regular-svg-icons';
import { faArrowTurnUp } from '@fortawesome/pro-solid-svg-icons';
import { LayoutService } from '@layout/layout.service';
import { faPencilAlt } from '@fortawesome/pro-light-svg-icons';
import {
  CategoryUpdateWizardModalComponent,
  UpdateCategoryPayload,
} from '@pages/support-hub/components/category-modal/category-update-wizard-modal.component';
import { openSupportHubAddRemoveAssigneeModal } from '../components/add-remove-assignee/support-hub-add-remove-assignee.modal';
import { HesTranslateService } from '@shared/services/hes-translate.service';

export interface SupportTicketMenuOptions {
  readonly includeViewItem?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupportTicketActionsService {
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly authService = inject(AuthService);
  private readonly supportTicketsService = inject(SupportTicketsService);
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly layoutService = inject(LayoutService);
  private readonly translateService = inject(HesTranslateService);
  private readonly modalService = inject(DsModalService);
  private readonly ticketUpdatedSubject = new Subject<number>();
  private readonly navigateToListSubject = new Subject<void>();
  private readonly listRefreshSubject = new Subject<void>();

  readonly ticketUpdated$ = this.ticketUpdatedSubject.asObservable();
  readonly navigateToList$ = this.navigateToListSubject.asObservable();
  readonly listRefresh$ = this.listRefreshSubject.asObservable();

  requestNavigateToList(): void {
    this.navigateToListSubject.next();
  }

  requestListRefresh(): void {
    this.listRefreshSubject.next();
  }

  async refreshTicketById(
    ticketId: number,
    isInitiatorTicket: boolean,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.supportHubTicketsService.refreshTicket(
          ticketId,
          isInitiatorTicket,
        ),
      );
      this.ticketUpdatedSubject.next(ticketId);
    } catch {
      // Ignore refresh failures; list state will recover on next load.
    }
  }

  buildMenuItems(
    ticket: SupportHubTicket,
    options: SupportTicketMenuOptions = {},
  ): PopupItem[] {
    const includeViewItem = options.includeViewItem ?? true;
    const items: PopupItem[] = [];

    if (includeViewItem) {
      items.push(this.buildViewDetailsItem());
    }

    if (this.canViewActions(ticket)) {
      if (this.canResolveTicket() && !this.isResolved(ticket)) {
        items.push(this.buildResolveItem(ticket));
      }

      if (
        ticket.status !== SupportTicketStatus.RESOLVED &&
        this.canUpdateCategory()
      ) {
        items.push(this.buildUpdateCategory(ticket));
      }

      if (this.isReviewStatus(ticket)) {
        if (this.canReassignTicket()) {
          items.push(this.buildAssignItem(ticket));
        }

        if (this.canEscalateTicket(ticket)) {
          items.push(this.buildEscalateItem(ticket));
        }

        if (this.canDeEscalateTicket(ticket)) {
          items.push(this.buildDeEscalateItem(ticket));
        }
      }
    }

    if (items.length === 1 && items[0]?.id === 'view-details') {
      return [];
    }

    return items;
  }

  private buildViewDetailsItem(): PopupItem {
    return {
      id: 'view-details',
      title: 'global.view.btn',
      icon: faEye,
    };
  }

  private buildResolveItem(ticket: SupportHubTicket): PopupItem {
    return {
      id: 'resolve-ticket',
      title: 'support_ticket.resolve.btn',
      icon: faCircleCheck,
      action: () => {
        void this.openResolveModal(ticket);
      },
    };
  }

  private buildAssignItem(ticket: SupportHubTicket): PopupItem {
    const isMobile = this.layoutService.isMobile();

    return {
      id: 'assign-ticket',
      title: 'support.action.add_remove_assignee',
      icon: faUserPlus,
      action: async () => {
        const modalRef = await openSupportHubAddRemoveAssigneeModal({
          modalService: this.modalService,
          isMobile: isMobile,
          ticketId: ticket.id,
          isInitiatorTicket: ticket.isInitiatorTicket,
        });
        const { data } = await modalRef.onDismiss();
        if (!data?.updated) {
          return;
        }
        await this.refreshTicketStore(ticket);
        this.ticketUpdatedSubject.next(ticket.id);
      },
    };
  }

  private buildEscalateItem(ticket: SupportHubTicket): PopupItem {
    return {
      id: 'escalate-ticket',
      title: 'support_ticket.escalate.btn',
      icon: faArrowTurnUp,
      textClass: 'text-content-error',
      iconClass: 'text-icon-error',
      action: () => {
        void this.openEscalateModal(ticket);
      },
    };
  }

  private buildDeEscalateItem(ticket: SupportHubTicket): PopupItem {
    return {
      id: 'de-escalate-ticket',
      title: 'support_ticket.de_escalate.btn',
      icon: faArrowDown,
      action: () => {
        void this.openDeEscalateModal(ticket);
      },
    };
  }

  private buildUpdateCategory(ticket: SupportHubTicket): PopupItem {
    return {
      id: 'update-category',
      title: 'support.category.update.title', // todo: Add translation key
      icon: faPencilAlt,
      action: () => {
        void this.openUpdateCategoryModal(ticket);
      },
    };
  }

  private async openUpdateCategoryModal(
    ticket: SupportHubTicket,
  ): Promise<void> {
    let modalRef: {
      dismiss: (data?: unknown, role?: string) => Promise<boolean>;
    } | null = null;
    modalRef = await this.modalService.open({
      component: CategoryUpdateWizardModalComponent,
      componentProps: {
        ticket,
        onSubmit: (payload: UpdateCategoryPayload) =>
          this.handleUpdateCategorySubmit(ticket, payload, modalRef!),
      },
      size: 'lg',
      contentClass: 'p-0',
      backdropDismiss: this.layoutService.isMobile(),
    });
  }

  async handleUpdateCategorySubmit(
    ticket: SupportHubTicket,
    payload: UpdateCategoryPayload,
    modalRef: { dismiss: (data?: unknown, role?: string) => Promise<boolean> },
  ) {
    await firstValueFrom(
      this.supportHubTicketsService.updateTicketCategory(ticket, payload),
    );
    await this.refreshTicketStore(ticket);
    this.ticketUpdatedSubject.next(ticket.id);
    this.requestListRefresh();
    await modalRef.dismiss({ resolved: true }, 'resolved');
  }

  private async openResolveModal(ticket: SupportHubTicket): Promise<void> {
    let modalRef: {
      dismiss: (data?: unknown, role?: string) => Promise<boolean>;
    } | null = null;
    modalRef = await this.modalService.open({
      component: SupportTicketResolveModalComponent,
      componentProps: {
        ticket,
        onSubmit: (payload: SupportTicketResolvePayload) =>
          this.handleResolveSubmit(ticket, payload, modalRef!),
      },
      headerConfig: {
        title: this.translateService.t('support.action.resolve_ticket'),
        subtitle: this.translateService.t('support.form.resolve.instruction'),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.translateService.t('action.ticket.resolve'),
        },
        secondaryButton: {
          text: this.translateService.t('global.cancel.btn'),
          variant: 'secondary',
        },
        buttonSize: 'lg',
      },
      size: 'lg',
      contentClass: 'p-ds-xl',
      backdropDismiss: this.layoutService.isMobile(),
    });
  }

  private async handleResolveSubmit(
    ticket: SupportHubTicket,
    payload: SupportTicketResolvePayload,
    modalRef: { dismiss: (data?: unknown, role?: string) => Promise<boolean> },
  ): Promise<void> {
    try {
      const attachmentKeys = await this.uploadAttachments(payload.attachments);

      await firstValueFrom(
        this.supportTicketsService.resolveTicket(
          ticket.id.toString(),
          payload.message,
          ticket.schoolId,
          attachmentKeys.length > 0 ? attachmentKeys : undefined,
        ),
      );

      this.supportHubTicketsService.updateTicketStatus(
        ticket.id,
        SupportTicketStatus.RESOLVED,
      );

      await this.refreshTicketStore(ticket);

      this.ticketUpdatedSubject.next(ticket.id);

      await modalRef.dismiss({ resolved: true }, 'resolved');
    } catch (error) {
      throw error;
    }
  }

  private async openEscalateModal(ticket: SupportHubTicket): Promise<void> {
    let modalRef: {
      dismiss: (data?: unknown, role?: string) => Promise<boolean>;
    } | null = null;
    modalRef = await this.modalService.open({
      component: SupportTicketEscalateModalComponent,
      componentProps: {
        ticket,
        onSubmit: (payload: SupportTicketEscalatePayload) =>
          this.handleEscalateSubmit(ticket, payload, modalRef!),
      },
      headerConfig: {
        title: this.translateService.t('support_ticket.escalate_ticket.title'),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.translateService.t('support_ticket.escalate.btn'),
          variant: this.layoutService.isMobile()
            ? 'dangerStroke'
            : 'dangerFill',
          iconStart: faArrowTurnUp,
        },
        secondaryButton: {
          text: this.translateService.t('global.cancel.btn'),
          variant: 'secondary',
        },
        buttonSize: 'lg',
      },
      size: 'lg',
      contentClass: 'p-ds-xl',
      backdropDismiss: this.layoutService.isMobile(),
    });
  }

  private async openDeEscalateModal(ticket: SupportHubTicket): Promise<void> {
    let modalRef: {
      dismiss: (data?: unknown, role?: string) => Promise<boolean>;
    } | null = null;
    modalRef = await this.modalService.open({
      component: SupportTicketDeescalateModalComponent,
      componentProps: {
        ticket,
        onSubmit: (payload: SupportTicketDeescalatePayload) =>
          this.handleDeEscalateSubmit(ticket, payload, modalRef!),
      },
      headerConfig: {
        title: this.translateService.t('support.ticket.deescalate.action'),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.translateService.t('action.ticket.de_escalate'),
        },
        secondaryButton: {
          text: this.translateService.t('global.cancel.btn'),
          variant: 'ghost',
        },
        buttonSize: 'lg',
      },
      size: 'lg',
      contentClass: 'p-ds-xl',
      backdropDismiss: this.layoutService.isMobile(),
    });
  }

  private async handleEscalateSubmit(
    ticket: SupportHubTicket,
    payload: SupportTicketEscalatePayload,
    modalRef: { dismiss: (data?: unknown, role?: string) => Promise<boolean> },
  ): Promise<void> {
    try {
      const attachmentKeys = await this.uploadAttachments(payload.attachments);

      await firstValueFrom(
        this.supportTicketsService.escalateTicket(
          ticket.id.toString(),
          payload.message,
          ticket.schoolId,
          attachmentKeys.length > 0 ? attachmentKeys : undefined,
        ),
      );

      await this.refreshTicketStore(ticket);

      this.ticketUpdatedSubject.next(ticket.id);

      await modalRef.dismiss({ escalated: true }, 'escalated');
    } catch (error) {
      throw error;
    }
  }
  private async handleDeEscalateSubmit(
    ticket: SupportHubTicket,
    payload: SupportTicketDeescalatePayload,
    modalRef: { dismiss: (data?: unknown, role?: string) => Promise<boolean> },
  ): Promise<void> {
    try {
      const attachmentKeys = await this.uploadAttachments(payload.attachments);

      await firstValueFrom(
        this.supportTicketsService.escalateTicket(
          ticket.id.toString(),
          payload.message,
          ticket.schoolId,
          attachmentKeys.length > 0 ? attachmentKeys : undefined,
          true,
        ),
      );

      await this.refreshTicketStore(ticket);

      this.ticketUpdatedSubject.next(ticket.id);

      await modalRef.dismiss({ deEscalated: true }, 'de-escalated');
    } catch (error) {
      throw error;
    }
  }

  private async uploadAttachments(
    attachments: ReadonlyArray<DsAttachmentControlValue>,
  ): Promise<string[]> {
    if (!attachments?.length) {
      return [];
    }

    const preparedAttachments = Array.from(
      attachments,
    ) as IAttachmentControlValue[];

    const uploaded = await firstValueFrom(
      this.supportHubTicketsService.uploadTicketAttachments(
        preparedAttachments,
      ),
    );

    return uploaded.map((item) => item.key);
  }

  private isReviewStatus(ticket: SupportHubTicket): boolean {
    return (
      ticket.status === SupportTicketStatus.REVIEW ||
      ticket.status === SupportTicketStatus.RE_OPEN
    );
  }

  private isResolved(ticket: SupportHubTicket): boolean {
    return ticket.status === SupportTicketStatus.RESOLVED;
  }

  private canReassignTicket(): boolean {
    return this.rbacService.hasPermission(
      SupportTicketActionsService.PERMISSIONS.reassign,
    );
  }

  private canResolveTicket(): boolean {
    return this.rbacService.hasPermission(
      SupportTicketActionsService.PERMISSIONS.resolve,
    );
  }

  private canUpdateCategory(): boolean {
    return this.rbacService.hasPermission(
      SupportTicketActionsService.PERMISSIONS.updateCategoryAction,
    );
  }

  private canEscalateTicket(ticket: SupportHubTicket): boolean {
    if (
      !this.rbacService.hasPermission(
        SupportTicketActionsService.PERMISSIONS.escalate,
      )
    ) {
      return false;
    }

    const current = ticket.currentEscalationLevelNumber;
    const last = ticket.lastEscalationLevelNumber;

    if (current === null || current === undefined) {
      return false;
    }

    if (last === null || last === undefined) {
      return false;
    }

    return current < last;
  }

  private canDeEscalateTicket(ticket: SupportHubTicket): boolean {
    if (
      !this.rbacService.hasPermission(
        SupportTicketActionsService.PERMISSIONS.deEscalate,
      )
    ) {
      return false;
    }

    const current = ticket.currentEscalationLevelNumber;
    const first = ticket.firstEscalationLevelNumber;

    if (current === null || current === undefined) {
      return false;
    }

    if (first === null || first === undefined) {
      return false;
    }

    return current > first;
  }

  private canViewActions(ticket: SupportHubTicket): boolean {
    if (this.rbacService.isSuperAdmin()) {
      return true;
    }

    const currentUser = this.authService.user();
    const currentIds = new Set<number>();
    if (currentUser?.id != null) {
      currentIds.add(currentUser.id);
    }
    if (currentUser?.userTypeId != null) {
      currentIds.add(currentUser.userTypeId);
    }

    if (currentIds.size === 0) {
      return false;
    }

    const currentEscalation =
      ticket.ticketEscalations?.find(
        (escalation) =>
          escalation.levelNumber === ticket.currentEscalationLevelNumber,
      ) ?? ticket.ticketEscalation;
    const personnels = currentEscalation?.ticketEscalationPersonnels ?? [];

    return personnels.some((personnel) => {
      if (personnel.personnel?.id && currentIds.has(personnel.personnel.id)) {
        return true;
      }
      return (
        personnel.personnelId != null && currentIds.has(personnel.personnelId)
      );
    });
  }

  private static readonly PERMISSIONS = {
    reassign: RESOURCE_PERMISSION.supportTicket.reassign,
    escalate: RESOURCE_PERMISSION.supportTicket.escalateTicket,
    deEscalate: RESOURCE_PERMISSION.supportTicket.deEscalate,
    resolve: RESOURCE_PERMISSION.supportTicket.resolveTicket,
    updateCategoryAction:
      RESOURCE_PERMISSION.supportTicket.updateCategoryAction,
  } as const;

  private async refreshTicketStore(ticket: SupportHubTicket): Promise<void> {
    try {
      await this.refreshTicketById(ticket.id, ticket.isInitiatorTicket);
    } catch {
      // Ignore refresh failures; list state will recover on next load.
    }
  }
}
