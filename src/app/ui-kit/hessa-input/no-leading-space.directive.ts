import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appNoLeadingSpace]',
  standalone: true,
})
export class NoLeadingSpaceDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = this.el.nativeElement.value;
    if (input.startsWith(' ')) {
      this.el.nativeElement.value = input.trimStart();
    }
  }
}
