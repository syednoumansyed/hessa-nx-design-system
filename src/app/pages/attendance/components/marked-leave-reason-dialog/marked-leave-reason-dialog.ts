import { DsModalService } from '@ds/modal/modal.service';
import { MarkedLeaveReasonDialogComponent } from './marked-leave-reason-dialog.component';

export async function openMarkedLeaveReasonModal({
  modalService,
  onSubmit,
  reason,
  t,
}: {
  modalService: DsModalService;
  onSubmit: (value: string) => void;
  reason: string | null;
  t: (key: string) => string;
}) {
  const modalRef = await modalService.open<{ reason: string | null }, string>({
    component: MarkedLeaveReasonDialogComponent,
    componentProps: { reason },
    headerConfig: {
      title: t('attendance.marked_leave.title'),
      showCloseButton: true,
    },
    footerConfig: {
      primaryButton: { text: t('global.save.btn') },
      secondaryButton: { text: t('global.cancel.btn') },
    },
    size: 'sm',
  });

  const result = await modalRef.onDismiss();
  if (result.role === 'confirm' && result.data != null) {
    onSubmit(result.data);
  }
}
