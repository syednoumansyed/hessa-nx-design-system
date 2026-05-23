import { DsModalService } from '@ds/modal/modal.service';
import { TranslocoService } from '@jsverse/transloco';
import { PickupTimelineComponent } from './components/pickup-timeline/pickup-timeline.component';

export async function openPickupTimelineModal({
  modalService,
  translocoService,
  timelineId,
}: {
  modalService: DsModalService;
  translocoService: TranslocoService;
  timelineId: number;
}) {
  await modalService.open({
    component: PickupTimelineComponent,
    componentProps: {
      timelineId,
    },
    headerConfig: {
      title: translocoService.translate('dismissal.pickup_timeline.title'),
      showCloseButton: true,
    },
    size: 'sm',
  });
}
