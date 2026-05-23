import {
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  TemplateRef,
  signal,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { NgTemplateOutlet, Location, NgClass } from '@angular/common';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { BreadcrumbComponent } from '@ui-kit/hes-breadcrumbs/breadcrumb.component';
import { BreadcrumbItemDirective } from '@ui-kit/hes-breadcrumbs/breadcrumb-item.directive';
import { ClassLevelBadgesComponent } from '@pages/course-management/components/class-level-badges/class-level-badges.component';
import { IonButtons, IonPopover, IonToolbar } from '@ionic/angular/standalone';
import { NgIcon } from '@ng-icons/core';
import { LayoutService } from '@layout/layout.service';
import { filter, map, Subject } from 'rxjs';
import { PageTitleService } from '@layout/page-title.service';
import { Router, NavigationEnd } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { takeUntil } from 'rxjs/operators';
import { isRtl } from '@utils/platform';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faBell, faHeadset } from '@fortawesome/pro-regular-svg-icons';
import { NotificationPage } from '@pages/notification/notification.page';

@Component({
  selector: 'ds-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  host: {
    '[class.has-banner-above]': 'hasBannerAbove()',
  },
  imports: [
    AvatarComponent,
    IonButtons,
    IonToolbar,
    NgIcon,
    TranslocoDirective,
    NgClass,
    NgTemplateOutlet,
    DsIconComponent,
    IonPopover,
    NotificationPage,
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private location = inject(Location);
  layoutService = inject(LayoutService);
  pageTitleService = inject(PageTitleService);
  breadCrumbService = inject(BreadcrumbService);
  isRtl = isRtl();

  private router$ = new Subject<void>();

  @Output() onMenuToggle = new EventEmitter<void>();
  exceptionRoutes: string[] = [];
  username = input<string>('');
  pageTitle = input<string>(''); // New input for mobile title
  rootLevelRoutes = input<string[]>([]);
  showNotificationIcon = input<boolean>(false);
  showHelpCenterIcon = input<boolean>(true);
  notificationCount = input<number>(0);
  mobileActionsTemplate = input<TemplateRef<any> | null>(null);
  hasBannerAbove = input<boolean>(false);
  isMobileOrTablet = this.layoutService.isMobileOrTablet;
  isMobile = this.layoutService.isMobile;
  @Output() notificationIconClick = new EventEmitter<MouseEvent>();
  @ViewChild('notificationPopover', { read: IonPopover })
  private notificationPopover?: IonPopover;

  // Create a reactive URL signal
  private currentUrl = signal(this.router.url);

  protected readonly notificationIcon = faBell;
  protected readonly helpCenterIcon = faHeadset;

  protected readonly isNotificationVisible = computed(() => {
    // The parent layout component already handles mobile route logic
    // via showNotificationIcon input, so we just respect that
    return this.showNotificationIcon();
  });

  protected readonly showHelpCenterShortcut = computed(
    () => this.isNotificationVisible() && this.showHelpCenterIcon(),
  );

  protected readonly hasRightContent = computed(
    () =>
      !!this.mobileActionsTemplate() ||
      this.isNotificationVisible() ||
      this.showHelpCenterShortcut(),
  );

  protected readonly shouldShowNotificationBadge = computed(
    () => this.notificationCount() > 0,
  );

  protected readonly notificationBadgeLabel = computed(() => {
    const count = this.notificationCount();
    if (count > 99) {
      return '99+';
    }

    return count.toString();
  });

  readonly closeNotificationsPopover = () => {
    this.notificationPopover?.dismiss();
  };

  isMobileRootPage = computed(() => {
    const url = this.currentUrl();
    const routes = [...this.rootLevelRoutes(), 'home', ''];
    // if the url is exception route, return false
    if (this.exceptionRoutes.some((route) => url.startsWith(route))) {
      return false;
    }

    // Check if current route EXACTLY matches any bottom nav route
    // Child routes should show back button, not hamburger menu
    return routes.some((route) => {
      const normalizedPath = route.startsWith('/') ? route : `/${route}`;
      return url === normalizedPath;
    });
  });

  isLogoVisible = computed(() => false);

  canGoBack = computed(() => {
    const isRootPage = this.isMobileRootPage();
    // Check if the current URL is an exception route
    const isExceptionRoute = this.exceptionRoutes.some((route) =>
      this.router.url.startsWith(route),
    );
    // If it's an exception route, we must allow go back
    if (isExceptionRoute) {
      return true;
    }

    if (this.isMobileOrTablet()) {
      // Prevent back on root even if history length > 1
      return !isRootPage && window.history.length > 1;
    }
    return !isRootPage;
  });

  readonly breadCrumbRestrictRoutes$ = this.router.events.pipe(
    map(() => this.router.url === '/home'),
  );

  constructor() {}

  ngOnInit() {
    // Subscribe to router events to update the URL signal
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.router$),
      )
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.url);
        this.closeNotificationsPopover();
      });
  }

  goBack(): void {
    if (this.canGoBack()) {
      if (this.router.url === '/unauthorized') {
        this.router.navigate(['/home']);
      } else {
        this.location.back();
      }
    }
  }

  ngOnDestroy() {
    // Clean up the subscription to avoid memory leaks
    this.router$.next();
    this.router$.complete();
    this.closeNotificationsPopover();
  }

  onNotificationClick(event: MouseEvent): void {
    if (this.isMobile()) {
      this.notificationIconClick.emit(event);
    }
  }

  onHelpCenterClick(): void {
    this.router.navigate(['/support-hub']);
  }
}
