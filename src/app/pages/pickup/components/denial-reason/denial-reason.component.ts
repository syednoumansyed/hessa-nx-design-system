import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { IonImg } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PickupService } from '@pages/pickup/data-access/pickup.service';
import { PickupRequestStatus } from '@shared/enums';
import { Timeline } from '@shared/dto-transformation/pick-up/pickup.interface';

@Component({
  selector: 'app-denial-reason',
  standalone: true,
  templateUrl: './denial-reason.component.html',
  imports: [TranslocoDirective, CommonModule, IonImg],
})
export class DenialReasonComponent implements OnInit {
  @Input() timelineId: number;
  currentLang: string = '';

  translocoService = inject(TranslocoService);
  pickupService = inject(PickupService);
  denialReasonTitle = signal<string>('');
  denialReasonDescription = signal<string>('');
  denialReasonImageUrl = signal<string>('');
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.currentLang = this.translocoService.getActiveLang();
    this.pickupService
      .getPickupTimelineById(this.timelineId)
      .subscribe((res) => {
        const reason = res.filter(
          (item: Timeline) => item.status === PickupRequestStatus.DENIED,
        );
        const lastReason = reason.sort(
          (a: Timeline, b: Timeline) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        this.denialReasonTitle.set(lastReason.deniedOption.title);
        this.denialReasonDescription.set(lastReason.deniedOption.description);
        this.denialReasonImageUrl.set(lastReason.deniedOption.url);
        this.isLoading.set(false);
      });
  }
}
