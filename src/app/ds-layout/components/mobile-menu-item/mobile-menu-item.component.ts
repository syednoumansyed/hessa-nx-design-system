import {
  Component,
  computed,
  inject,
  input,
  output,
  NgZone,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LottieComponent } from 'ngx-lottie';
import { AnimationItem } from 'lottie-web';
import { UnreadNotificationService } from '@shared/services/unread-notification.service';
import { getAccessibleRoutePath } from '@layout/utils/get-accessible-route-path.util';
import { NgIcon } from '@ng-icons/core';
import { AnimatedIconComponent } from '../animated-icon/animated-icon.component';
import { ISideMenuItem } from '../side-nav/side-nav.component';
@Component({
  selector: 'ds-mobile-menu-item',
  templateUrl: './mobile-menu-item.component.html',
  styleUrls: ['./mobile-menu-item.component.scss'],
  standalone: true,
  imports: [
    FontAwesomeModule,
    RouterLink,
    TranslocoDirective,
    NgIcon,
    AnimatedIconComponent,
  ],
})
export class MobileMenuItemComponent {
  menuRoute = input.required<ISideMenuItem>();
  clickableItemClick = output<ISideMenuItem>();
  playFunction = {};
  private readonly unreadNotificationService = inject(
    UnreadNotificationService,
  );
  private readonly zone = inject(NgZone);

  // Available background colors
  private readonly backgroundColors = [
    'bg-blue.svg',
    'bg-green.svg',
    'bg-grey.svg',
    'bg-pink.svg',
    'bg-purple.svg',
    'bg-cream.svg',
  ];

  // Animation management
  private animationItem: AnimationItem | null = null;

  readonly routePathResolver = getAccessibleRoutePath();

  routerPath = computed<string>(() => {
    const menuItem = this.menuRoute();
    const route = this.routePathResolver(menuItem);
    return `../${route}`;
  });

  backgroundImage = computed<string>(() => {
    return this.menuRoute().backgroundImage || 'assets/images/bg-brand.svg';
  });

  count = computed<number | undefined>(() => {
    const unreadCount =
      this.unreadNotificationService.unReadNotificationsCount();
    if (unreadCount) {
      return this.menuRoute().notificationUnreadCountFn?.(unreadCount);
    }
    return 0;
  });

  constructor() {}

  /**
   * Handle animation creation for Lottie
   */
  onAnimationCreated(
    item: AnimationItem,
    lottieComponent: LottieComponent,
  ): void {
    this.zone.runOutsideAngular(() => {
      if (item) {
        this.animationItem = item;
      }
    });
  }

  /**
   * Handle menu item click - play animation once
   */
  onMenuItemClick(event: Event): void {
    if (this.menuRoute().clickable) {
      event.preventDefault();
      this.clickableItemClick.emit(this.menuRoute());
    }

    if (this.animationItem) {
      this.zone.runOutsideAngular(() => {
        try {
          // Reset to first frame then play
          this.animationItem!.goToAndStop(0, true);
          setTimeout(() => {
            this.animationItem!.play();
          }, 50);
        } catch (error) {
          console.warn('Animation playback error:', error);
        }
      });
    }
  }

  // Simple hash function to generate consistent color assignment
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Save play function with item path context
   */
  savePlayFunctionForItem(playFunction: () => void): void {
    this.playFunction = playFunction;
  }
}
