import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { InAppNotification } from './in-app-notification.model';
import { NotificationService } from './notification.service';
import { AnimatedIconComponent } from '@ds-layout/components/animated-icon/animated-icon.component';
import { DeepLinkService } from '@core/services/deep-link.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-in-app-notification-card',
  imports: [CommonModule, AnimatedIconComponent],
  templateUrl: './in-app-notification-card.component.html',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-120%)', opacity: 0 }),
        animate(
          '220ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }),
        ),
      ]),
      transition(':leave', [
        animate(
          '180ms ease-in',
          style({ transform: 'translateY(-120%)', opacity: 0 }),
        ),
      ]),
    ]),
  ],
})
export class InAppNotificationCardComponent {
  @Input() notification!: InAppNotification;

  private startY: number | null = null;

  constructor(
    private notificationService: NotificationService,
    private deepLinkService: DeepLinkService,
    private router: Router,
  ) {}

  onClick(event: MouseEvent) {
    event.stopPropagation();

    // Navigate using deep link if destination is available
    if (this.notification.destination) {
      try {
        const destination = this.deepLinkService.handleNotificationClick(
          this.notification.destination,
          this.notification.metadata || {},
        );
        this.deepLinkService.navigateToDestination(destination);
      } catch (error) {
        console.error('Error navigating from notification:', error);
        // Fallback to home page
        this.router.navigate(['/home']);
      }
    }

    // Dismiss the notification after navigation
    this.dismiss();
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length > 0) {
      this.startY = event.touches[0].clientY;
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (this.startY == null) return;
    const endY = event.changedTouches[0].clientY;
    const deltaY = endY - this.startY;
    this.startY = null;

    // swipe up
    if (deltaY < -30) {
      this.dismiss();
    }
  }

  onMouseDown(event: MouseEvent) {
    this.startY = event.clientY;
  }

  onMouseUp(event: MouseEvent) {
    if (this.startY == null) return;
    const endY = event.clientY;
    const deltaY = endY - this.startY;
    this.startY = null;

    if (deltaY < -30) {
      this.dismiss();
    }
  }

  dismiss() {
    this.notificationService.dismiss(this.notification.id);
  }
}
