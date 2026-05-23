import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconComponentsProps, hesIcon } from '@shared/types';

@Component({
  selector: 'app-hes-icon',
  templateUrl: './hes-icon.component.html',
  standalone: true,
  imports: [FontAwesomeModule, IonIcon],
})
export class HesIconComponent {
  @Input() faIcon: FaIconComponentsProps | undefined;
  @Input() hesIcon: hesIcon | undefined;
  @Input() iconClass: string | undefined;
}
