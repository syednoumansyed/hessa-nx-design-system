import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Optional,
} from '@angular/core';
import { isMobile } from '@shared/utils/platform';
import {
  TuiInputDateComponent,
  TuiInputDateRangeComponent,
} from '@taiga-ui/kit';

@Directive({
  selector: 'input[tuiTextfield][autoOpenDatePicker]',
  standalone: true,
})
export class DatePickerAutoOpenDirective {
  private readonly isMobile = isMobile();
  private readonly inputDate = inject(TuiInputDateComponent, {
    optional: true,
  });
  private readonly rangeDate = inject(TuiInputDateRangeComponent, {
    optional: true,
  });
  private readonly el = inject(ElementRef<HTMLInputElement>);

  @HostListener('click')
  onClick(): void {
    if (!this.isMobile) {
      return;
    }
    this.el.nativeElement.blur();
    this.openDatePicker();
  }

  private openDatePicker(): void {
    setTimeout(() => {
      if (this.inputDate) {
        this.inputDate.onIconClick();
      }
      if (this.rangeDate) {
        this.rangeDate.onIconClick();
      }
    }, 0);
  }
}
