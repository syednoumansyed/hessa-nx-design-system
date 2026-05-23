import { Directive, HostBinding, Input } from '@angular/core';
import { IonCheckbox } from '@ionic/angular/standalone';

@Directive({
  selector: 'ion-checkbox, ion-checkbox[hesCheckbox]',
  standalone: true,
  providers: [IonCheckbox],
})
export class HesCheckboxDirective {
  @Input() hesSize: 'sm' | 'md' = 'md';

  constructor(public ionCheckbox: IonCheckbox) {}

  @HostBinding('class')
  get elementClasses() {
    const classes = ['hes-checkbox'];
    classes.push(`hes-checkbox--${this.hesSize}`);
    if (this.ionCheckbox.disabled) {
      classes.push(`hes-checkbox--disabled`);
    }
    return classes.join(' ');
  }

  /* prevent using ionic color attribute */
  @HostBinding('attr.color')
  get color() {
    return undefined;
  }

  /* prevent using ionic mode attribute */
  @HostBinding('attr.mode')
  get mode() {
    return 'md';
  }

  @HostBinding('labelPlacement')
  get labelPlacement() {
    return 'end';
  }
}
