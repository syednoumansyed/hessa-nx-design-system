import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'periodBreak',
  standalone: true,
})
export class PeriodBreakPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/\./g, '.\n');
  }
}
