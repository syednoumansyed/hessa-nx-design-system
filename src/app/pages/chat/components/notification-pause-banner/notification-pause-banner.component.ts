import { Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';
import { faSnooze } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-notification-pause-banner',
  standalone: true,
  imports: [TranslocoDirective, HesIconComponent],
  templateUrl: './notification-pause-banner.component.html',
})
export class NotificationPauseBannerComponent {
  /** The display name of the user who has paused notifications. */
  displayName = input.required<string>();

  protected readonly snoozeIcon: FaIconComponentsProps = {
    icon: faSnooze,
    size: 'sm',
  };
}
