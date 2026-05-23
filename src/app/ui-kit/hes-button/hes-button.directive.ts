import {
  AfterContentInit,
  ContentChild,
  Directive,
  HostBinding,
  Input,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IonButton } from '@ionic/angular/standalone';

@Directive({
  selector: 'ion-button, ion-button[hesBtn]',
  standalone: true,
  providers: [IonButton],
})
export class HessaBtnDirective implements AfterContentInit {
  @Input() hesSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';
  @Input() hesColor:
    | 'primary'
    | 'secondary'
    | 'link'
    | 'gray'
    | 'white'
    | 'error'
    | 'info' = 'primary';

  @Input() hesFill: 'outline' | 'solid' | 'clear' | null = null;

  constructor(public ionButton: IonButton) {}

  @ContentChild(FaIconComponent) icon: FaIconComponent | undefined;

  ngAfterContentInit() {
    if (this.icon) {
      this.icon.size = this.hesSize !== '2xl' ? 'lg' : 'xl';
    }
  }

  @HostBinding('class')
  get elementClasses() {
    const classes = ['hes-btn'];
    classes.push(`hes-btn--${this.hesColor}`);
    classes.push(`hes-btn--${this.hesSize}`);
    if (this.ionButton.disabled) {
      classes.push(`hes-btn--disabled`);
    }
    if (this.hesFill === 'outline') {
      classes.push(`hes-btn--outline`);
    }
    return classes.join(' ');
  }

  /* prevent using ionic color attribute */
  @HostBinding('attr.color')
  get color() {
    return undefined;
  }

  /* prevent using ionic size attribute */
  @HostBinding('attr.size')
  get size() {
    return undefined;
  }
}
