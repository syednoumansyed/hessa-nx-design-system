import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  formatToHesDate,
  formatToHesDateDay,
  formatToHestime,
} from '@shared/utils/date';
import { isRtl } from '@shared/utils/platform';

@Component({
  selector: 'app-hes-date-viewer',
  templateUrl: './hes-date-viewer.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HesDateViewerComponent implements OnInit {
  isRtl = signal(isRtl());

  date = input.required<string>();
  format = input<'dateTime' | 'dateDay' | 'date' | 'time'>('date');

  formattedDate = computed(() => {
    const date = this.date();
    return formatToHesDate(date, this.isRtl());
  });

  formattedTime = computed(() => {
    const date = this.date();
    return formatToHestime(date, this.isRtl());
  });

  formattedDay = computed(() => {
    const date = this.date();
    return formatToHesDateDay(date);
  });

  constructor() {}

  ngOnInit() {}
}
