import { Component, Input, signal, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { faClose } from '@fortawesome/pro-solid-svg-icons';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { TimePeriodService } from '@pages/time-periods/data-access/time-periods.service';
import { TimeRangePipe } from '@shared/pipes/time-range.pipe';
import { Language } from '@shared/enums';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { days } from '@pages/time-periods/data-access/time-periods.utils';
import { TimePeriodDetail } from '@shared/dto-transformation';

@Component({
  selector: 'view-add-time-period-modal',
  templateUrl: './view-time-period-modal.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    HesButtonModule,
    CommonModule,
    TimeRangePipe,
    EnumLangPipe,
  ],
  providers: [SchoolStructureListingService],
})
export class ViewTimePeriodModalComponent implements OnInit {
  faClose = faClose;
  currentLang: Language;
  @Input() closeModal: () => void;
  @Input() id: number;
  days: string = '';

  readonly timePeriodDetail = signal<TimePeriodDetail | undefined>(undefined);

  constructor(
    private translocoService: TranslocoService,
    private timePeriodService: TimePeriodService,
    private hesTranslateService: HesTranslateService,
  ) {
    this.currentLang = this.translocoService.getActiveLang() as Language;
  }

  ngOnInit() {
    this.getTimePeriod();
  }

  getTimePeriod() {
    this.timePeriodService
      .getTimePeriodById(this.id)
      .subscribe((res: TimePeriodDetail) => {
        this.timePeriodDetail.set(res);
        this.days = res.days
          ? res.days
              .map((day) => this.hesTranslateService.enumT(days[day.dayOfWeek]))
              .join(', ')
          : '-';
      });
  }
}
