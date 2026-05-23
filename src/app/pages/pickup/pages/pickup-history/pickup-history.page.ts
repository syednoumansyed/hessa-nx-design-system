import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { DateSliderComponent } from '@shared/components/date-slider/date-slider.component';
import { GuardianStudentRequestCardComponent } from '@pages/pickup/components/guardian-student-request-card/guardian-student-request-card.component';
import { format, startOfMonth, subMonths } from 'date-fns';
import { PickupService } from '@pages/pickup/data-access/pickup.service';
import { PickupResponse } from '@shared/dto-transformation/pick-up/pickup.interface';
import { isMobile } from '@shared/utils/platform';
import { CommonModule } from '@angular/common';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';

@Component({
  selector: 'app-pickup-history',
  templateUrl: './pickup-history.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    TranslocoDirective,
    DateSliderComponent,
    GuardianStudentRequestCardComponent,
    HesIconComponent,
  ],
  providers: [],
})
export class PickupHistoryPage implements OnInit {
  readonly isMobile = isMobile();
  sliderStartDate = signal<string>('');
  sliderEndDate = signal<string>('');
  selectedDate = signal<string>('');
  pickupHistory = signal<PickupResponse[]>([]);
  noData = signal<boolean>(false);
  readonly isLoading = signal(false);

  isTodaysDateSelected = computed(() => {
    return this.selectedDate() === format(new Date(), 'yyyy-MM-dd');
  });

  private pickupService = inject(PickupService);

  constructor() {}

  ngOnInit(): void {
    this.selectedDate.set(format(new Date(), 'yyyy-MM-dd'));
    this.setSliderDates();
    this.fetchPickupHistory();
  }

  private fetchPickupHistory() {
    this.isLoading.set(true);
    this.pickupService
      .getGuardianPickupRequests({
        date: this.selectedDate(),
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.pickupHistory.set(res.data);
          this.noData.set(res.data.length === 0);
        },
        error: () => {
          this.isLoading.set(false);
          this.noData.set(true);
        },
      });
  }

  private setSliderDates() {
    const currentDate = new Date();
    const previousMonthStartDate = startOfMonth(subMonths(currentDate, 1));
    this.sliderStartDate.set(format(previousMonthStartDate, 'yyyy-MM-dd'));
    this.sliderEndDate.set(format(currentDate, 'yyyy-MM-dd'));
  }

  onDateSelected(selectedDate: string) {
    this.selectedDate.set(selectedDate);
    this.fetchPickupHistory();
  }
}
