import { Directive, HostBinding, Input } from '@angular/core';
import { IonRadio } from '@ionic/angular/standalone';

@Directive({
  selector: 'ion-radio, ion-radio[hesRadio]',
  standalone: true,
  providers: [IonRadio],
})
export class HesRadioDirective {
  @Input() hesSize: 'sm' | 'md' = 'md';

  constructor(public ionRadio: IonRadio) {}

  @HostBinding('class')
  get elementClasses() {
    const classes = ['hes-radio'];
    classes.push(`hes-radio--${this.hesSize}`);
    if (this.ionRadio.disabled) {
      classes.push(`hes-radio--disabled`);
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
}
