import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'newline', standalone: true })
export class NewlinePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;

    // Replace only multiple consecutive spaces with &nbsp;
    const withSpaces = value.replace(/ {2,}/g, (match) =>
      '&nbsp;'.repeat(match.length),
    );
    // Replace newline characters with <br>
    return withSpaces.replace(/\n/g, '<br>');
  }
}
