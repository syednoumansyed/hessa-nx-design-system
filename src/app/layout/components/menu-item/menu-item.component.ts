import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonItem, IonLabel } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { getAccessibleRoutePath } from '@layout/utils/get-accessible-route-path.util';
import { NgIconComponent } from '@ng-icons/core';
import { UnreadNotificationService } from '@shared/services/unread-notification.service';
@Component({
  selector: 'app-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonItem,
    RouterModule,
    NgIconComponent,
    IonLabel,
    TranslocoDirective,
  ],
})
export class MenuItemComponent implements OnInit {
  menuRoute = input.required<IMenuRoutes>();
  isSideNavCollapsed = input<boolean>(false);
  readonly routePathResolver = getAccessibleRoutePath();
  routerPath = computed<string>(() => {
    const menuItem = this.menuRoute();
    const routes = this.routePathResolver(menuItem);
    return routes;
  });
  private readonly unreadNotificationService = inject(
    UnreadNotificationService,
  );

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
