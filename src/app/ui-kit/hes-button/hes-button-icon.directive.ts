import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: 'fa-icon[hesBtnIcon], app-hes-icon[hesBtnIcon]',
  standalone: true,
})
export class HessaButtonIconDirective {
  @Input() slot: string = 'start';
  @Input() hesSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';

  constructor() {}

  @HostBinding('class')
  get elementClasses() {
    const classes = ['hes-btn-icon'];
    if (this.slot === 'start') {
      classes.push(`hes-btn-icon--start`);
    } else if (this.slot === 'end') {
      classes.push(`hes-btn-icon--end`);
    }
    return classes.join(' ');
  }
}
