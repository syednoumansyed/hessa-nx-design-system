import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { InAppNotification } from './in-app-notification.model';
import { NotificationService } from './notification.service';
import { InAppNotificationCardComponent } from './in-app-notification-card.component';

@Component({
  standalone: true,
  selector: 'ds-app-notification-container',
  imports: [CommonModule, InAppNotificationCardComponent],
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-0 z-[2000] flex justify-center pt-2"
      [ngStyle]="{ 'padding-top': 'env(safe-area-inset-top)' }"
      *ngIf="notifications$ | async as notifications"
    >
      <div class="flex w-full max-w-[361px] flex-col gap-2 px-2">
        <app-in-app-notification-card
          *ngFor="let n of notifications"
          [notification]="n"
        ></app-in-app-notification-card>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationContainerComponent {
  notifications$: Observable<InAppNotification[]> =
    this.notificationService.notifications$;

  constructor(private notificationService: NotificationService) {}
}
