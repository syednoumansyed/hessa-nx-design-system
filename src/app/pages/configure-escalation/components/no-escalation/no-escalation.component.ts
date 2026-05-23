import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { IonImg } from '@ionic/angular/standalone';

@Component({
  selector: 'app-no-escalation',
  templateUrl: './no-escalation.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, IonImg],
})
export class NoEscalationComponent {
  mainImagePath = 'assets/illustrations/no_data.svg';
}
