import { Component, computed, inject, input, OnInit } from '@angular/core';
import { NgIconComponent } from '@ng-icons/core';
import { IonLabel } from '@ionic/angular/standalone';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { UnreadNotificationService } from '@shared/services/unread-notification.service';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { getAccessibleRoutePath } from '@layout/utils/get-accessible-route-path.util';

@Component({
  selector: 'app-mobile-menu-item',
  templateUrl: './mobile-menu-item.component.html',
  styleUrls: ['./mobile-menu-item.component.scss'],
  standalone: true,
  imports: [
    IonLabel,
    FontAwesomeModule,
    RouterLink,
    TranslocoDirective,
    NgIconComponent,
  ],
})
export class MobileMenuItemComponent implements OnInit {
  menuRoute = input.required<IMenuRoutes>();

  private readonly unreadNotificationService = inject(
    UnreadNotificationService,
  );

  readonly routePathResolver = getAccessibleRoutePath();
  routerPath = computed<string>(() => {
    const menuItem = this.menuRoute();
    const route = this.routePathResolver(menuItem);
    return `../${route}`;
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

  ngOnInit() {}
}
