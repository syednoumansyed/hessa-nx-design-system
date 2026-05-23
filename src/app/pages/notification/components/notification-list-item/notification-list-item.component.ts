import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Notification } from '../../data-access/notification.interface';
import { AnimatedIconComponent } from '@ds-layout/components/animated-icon/animated-icon.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-list-item',
  standalone: true,
  imports: [CommonModule, TranslocoModule, AnimatedIconComponent, TimeAgoPipe],
  templateUrl: './notification-list-item.component.html',
  host: {
    class: 'block w-full',
  },
})
export class NotificationListItemComponent {
  readonly notification = input.required<Notification>();
}
