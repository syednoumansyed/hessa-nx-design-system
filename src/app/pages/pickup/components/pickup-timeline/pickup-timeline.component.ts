import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { faClock } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PickupService } from '@pages/pickup/data-access/pickup.service';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { PickupRequestStatus } from '@shared/enums';
import { Timeline } from '@shared/dto-transformation/pick-up/pickup.interface';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { FaIconComponentsProps } from '@shared/types';

@Component({
  selector: 'app-pickup-timeline',
  standalone: true,
  templateUrl: './pickup-timeline.component.html',
  imports: [
    TranslocoDirective,
    CommonModule,
    HesIconComponent,
    HesTimePipe,
    EnumLangPipe,
  ],
})
export class PickupTimelineComponent implements OnInit {
  @Input() timelineId: number;

  currentLang: string = '';
  readonly pickupRequestStatus = PickupRequestStatus;
  translocoService = inject(TranslocoService);
  pickupService = inject(PickupService);
  timelineResult = signal<Timeline[] | undefined>(undefined);

  readonly faClock: FaIconComponentsProps = {
    icon: faClock,
    size: 'sm',
  };

  ngOnInit() {
    this.currentLang = this.translocoService.getActiveLang();
    this.pickupService
      .getPickupTimelineById(this.timelineId)
      .subscribe((res) => {
        this.timelineResult.set(res);
      });
  }
}
