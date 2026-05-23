import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface IDateItem {
  day: string;
  month: string;
  dayOfWeek: string;
  fullDate: string;
}

@Component({
  selector: 'app-date-slider',
  standalone: true,
  templateUrl: './date-slider.component.html',
  imports: [CommonModule],
})
export class DateSliderComponent implements OnInit {
  @Input() startDate!: string; // ISO format e.g., '2024-11-01'
  @Input() endDate!: string; // ISO format e.g., '2024-11-30'
  @Output() dateSelected = new EventEmitter<string>();
  @Input() initialSelectedDate?: string;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  currentLang: string = '';
  translocoService = inject(TranslocoService);

  dateRange: IDateItem[] = [];
  selectedDate: string;

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.selectedDate) {
        this.scrollToSelectedDate();
      }
    }, 1000);
  }

  ngOnInit() {
    this.currentLang = this.translocoService.getActiveLang();
    this.generateDateRange();
    this.selectedDate =
      this.initialSelectedDate ||
      this.dateRange[this.dateRange.length - 1].fullDate;
  }

  generateDateRange() {
    const start = parseISO(this.startDate);
    const end = parseISO(this.endDate);
    const localeSettings = this.currentLang === 'ar' ? ar : enUS;

    this.dateRange = eachDayOfInterval({ start, end }).map((date) => ({
      day: format(date, 'd', { locale: localeSettings }),
      month: format(date, 'MMM', { locale: localeSettings }),
      dayOfWeek: format(date, 'EEE', { locale: localeSettings }),
      fullDate: format(date, 'yyyy-MM-dd'),
    }));
  }

  selectDate(date: IDateItem, dateItem: HTMLElement) {
    this.selectedDate = date.fullDate;
    this.dateSelected.emit(this.selectedDate);

    // Use manual scroll instead of scrollIntoView
    const container = this.scrollContainer.nativeElement;
    const itemRect = dateItem.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const scrollLeft =
      container.scrollLeft +
      (itemRect.left - containerRect.left) -
      container.offsetWidth / 2 +
      dateItem.offsetWidth / 2;

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
  }

  private scrollToSelectedDate() {
    const dateIndex = this.dateRange.findIndex(
      (date) => date.fullDate === this.selectedDate,
    );

    if (dateIndex !== -1) {
      setTimeout(() => {
        const dateItem = this.scrollContainer.nativeElement.children[
          dateIndex
        ] as HTMLElement;

        if (dateItem) {
          // Use the same manual scroll approach instead of scrollIntoView
          const container = this.scrollContainer.nativeElement;
          const itemRect = dateItem.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          const scrollLeft =
            container.scrollLeft +
            (itemRect.left - containerRect.left) -
            container.offsetWidth / 2 +
            dateItem.offsetWidth / 2;

          container.scrollTo({
            left: scrollLeft,
            behavior: 'smooth',
          });
        }
      });
    }
  }
}
