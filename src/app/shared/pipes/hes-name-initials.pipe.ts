import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hesInitials',
  standalone: true,
})
export class HesInitialsPipe implements PipeTransform {
  transform(fullName: string | undefined): string {
    let initials = fullName
      ?.split(/\s+/)
      .slice(0, 2) // Only take the first two words
      .map((name) => name.charAt(0))
      .join('');

    return this.transformCharIfAR(initials ?? '').toLocaleUpperCase();
  }

  transformCharIfAR(value: string): string {
    const arabicRegex = /[\u0600-\u06FF]/; // Unicode range for Arabic characters
    if (arabicRegex.test(value) && value.length >= 2) {
      value = value.slice(0, 1) + ' ' + value.slice(1);
    }
    return value;
  }
}
