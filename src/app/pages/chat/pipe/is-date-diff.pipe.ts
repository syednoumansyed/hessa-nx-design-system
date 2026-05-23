import { Pipe, PipeTransform } from '@angular/core';
import { format, isSameDay } from 'date-fns';

@Pipe({
  name: 'isSameDay',
  standalone: true,
})
export class IsSameDayPipe implements PipeTransform {
  transform(date1: number, date2: number): unknown {
    return isSameDay(date1, date2);
  }
}
