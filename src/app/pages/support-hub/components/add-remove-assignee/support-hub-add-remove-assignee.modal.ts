import { DsModalRef, DsModalService } from '@ds/modal';
import { SupportHubAddRemoveAssigneeComponent } from './support-hub-add-remove-assignee.component';

export async function openSupportHubAddRemoveAssigneeModal({
  modalService,
  isMobile,
  ticketId,
  isInitiatorTicket,
}: {
  modalService: DsModalService;
  isMobile: boolean;
  ticketId: number;
  isInitiatorTicket: boolean;
}): Promise<DsModalRef<{ updated?: boolean }>> {
  const modalRef = await modalService.open<
    Record<string, unknown>,
    { updated?: boolean }
  >({
    component: SupportHubAddRemoveAssigneeComponent,
    componentProps: {
      isMobile,
      ticketId,
      isInitiatorTicket,
    },
    size: 'lg',
    contentClass: 'p-0',
    mobileBreakpoints: [1],
    mobileBreakpoint: 1,
    mobileHandle: false,
    backdropDismiss: isMobile,
  });

  return modalRef;
}
