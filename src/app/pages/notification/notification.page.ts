import { CommonModule, NgClass } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  TemplateRef,
  computed,
  effect,
  inject,
  signal,
  input,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Observable, Subject, Subscription, of } from 'rxjs';
import {
  catchError,
  finalize,
  shareReplay,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { TuiLoaderModule } from '@taiga-ui/core';
import { NotificationService } from './data-access/notification.service';
import {
  Notification,
  NotificationListResponse,
} from './data-access/notification.interface';
import { differenceInCalendarDays } from '@shared/utils/time-format.util';
import { NotificationListItemComponent } from './components/notification-list-item/notification-list-item.component';
import { HesLogService } from '@shared/services/hes-log.service';
import { DsSegmentedControlComponent } from '@ds/segmented-control/segmented-control.component';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faGear } from '@fortawesome/pro-regular-svg-icons';
import { TemplateProjectionService } from '@shared/services/template-projection.service';
import { LayoutService } from '@layout/layout.service';
import { isMobile } from '@shared/utils/platform';
import { DeepLinkService } from '@core/services/deep-link.service';
import { DurationPipe } from '@shared/pipes/duration.pipe';

type NotificationFilter = 'all' | 'unread';

type NotificationGroup = {
  label: string;
  dateKey: string;
  timestamp: number;
  notifications: Notification[];
};

const NOTIFICATION_PAGE_SIZE = 10;

@Component({
  standalone: true,
  selector: 'app-notification-page',
  templateUrl: './notification.page.html',
  imports: [
    CommonModule,
    TranslocoModule,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    NotificationListItemComponent,
    TuiLoaderModule,
    DsSegmentedControlComponent,
    NoDataCardComponent,
    DsIconComponent,
    NgClass,
  ],
  providers: [DurationPipe],
})
export class NotificationPage implements OnInit, OnDestroy {
  @ViewChild('mobileHeaderActions', { read: TemplateRef })
  set mobileHeaderActionsTemplate(template: TemplateRef<unknown> | undefined) {
    this.mobileHeaderActionsTemplateRef.set(template ?? null);
  }

  private readonly notificationService = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);
  private readonly durationPipe = inject(DurationPipe);
  private readonly logService = inject(HesLogService);
  private readonly templateProjectionService = inject(
    TemplateProjectionService,
  );
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly mobileHeaderActionsTemplateRef =
    signal<TemplateRef<unknown> | null>(null);
  private readonly deepLinkService = inject(DeepLinkService);

  readonly onSettingsNavigate = input<(() => void | Promise<void>) | null>(
    null,
  );

  readonly isMobile = isMobile();
  readonly filter = signal<NotificationFilter>('all');

  readonly notifications = signal<Notification[]>([]);
  readonly isLoading = signal(false);
  protected readonly canLoadMore = signal(true);

  private unreadItemsTotal = 0;
  private readAllCompleted = false;
  private readAllInFlight$?: Observable<void>;
  private readonly pageNumber = signal(1);
  private isPaging = false;
  private currentLoadSub?: Subscription;

  readonly groupedNotifications = computed<NotificationGroup[]>(() => {
    const bucket = new Map<string, NotificationGroup>();
    const now = new Date();

    for (const notification of this.notifications()) {
      const date = new Date(notification.createdAt);
      const diff = differenceInCalendarDays(now, date);
      const key = diff > 1 ? 'older' : date.toISOString().slice(0, 10);
      let group = bucket.get(key);
      if (!group) {
        let label: string;
        if (diff === 0) {
          label = this.transloco.translate('global.today.txt');
        } else if (diff === 1) {
          label = this.transloco.translate('global.yesterday.txt');
        } else {
          label = this.transloco.translate('global.older.txt');
        }

        group = {
          label,
          dateKey: key,
          timestamp: date.getTime(),
          notifications: [],
        };
        bucket.set(key, group);
      }
      group.timestamp = Math.max(group.timestamp, date.getTime());
      group.notifications.push(notification);
    }

    return Array.from(bucket.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  });

  readonly hasNotifications = computed(() => this.notifications().length > 0);

  protected readonly settingsIcon = faGear;

  private readonly headerActionsEffect = effect(() => {
    const template = this.mobileHeaderActionsTemplateRef();
    const isMobile = this.layoutService.isMobileOrTablet();

    if (template && isMobile) {
      this.templateProjectionService.renderHeaderActionsTemplate(template);
    } else {
      this.templateProjectionService.clearHeaderActionsTemplate();
    }
  });

  ngOnInit(): void {
    this.notificationService.refreshUnreadCount();
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.markAllAsReadIfNeeded().pipe(take(1)).subscribe();
    this.templateProjectionService.clearHeaderActionsTemplate();
    this.currentLoadSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFilter(nextFilter: NotificationFilter): void {
    const currentFilter = this.filter();
    if (currentFilter === nextFilter) {
      return;
    }

    this.filter.set(nextFilter);
    this.resetPagination();

    if (nextFilter === 'unread') {
      this.readAllCompleted = false;
    }

    if (currentFilter === 'unread' && nextFilter === 'all') {
      this.isLoading.set(true);
      this.markAllAsReadIfNeeded()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoading.set(false);
            this.loadNotifications();
          },
          error: (error) => {
            this.logService.error('NotificationListComponent.setFilter', error);
            this.isLoading.set(false);
            this.loadNotifications();
          },
        });
      return;
    }

    this.loadNotifications();
  }

  onFilterChange(value: string): void {
    if (value === 'all' || value === 'unread') {
      this.setFilter(value);
    }
  }

  async openSettings(): Promise<void> {
    await this.router.navigate(['/notifications/settings']);
    const callback = this.onSettingsNavigate();
    if (callback) {
      await Promise.resolve(callback());
    }
  }

  loadNotifications(event?: InfiniteScrollCustomEvent): void {
    const isFirstPage = this.pageNumber() === 1;

    if (isFirstPage) {
      if (this.isLoading()) {
        event?.target.complete();
        return;
      }
    } else {
      if (this.isPaging || !this.canLoadMore()) {
        event?.target.complete();
        return;
      }
    }

    this.isLoading.set(isFirstPage);
    this.isPaging = !isFirstPage;

    const params = {
      pageNumber: this.pageNumber(),
      itemsPerPage: NOTIFICATION_PAGE_SIZE,
    };

    const currentFilter = this.filter();
    const source$ =
      currentFilter === 'all'
        ? this.notificationService.getAll(params)
        : this.notificationService.getUnread(params);

    this.currentLoadSub?.unsubscribe();
    this.currentLoadSub = source$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
          this.isPaging = false;
          event?.target.complete();
          this.currentLoadSub = undefined;
        }),
      )
      .subscribe({
        next: (response: NotificationListResponse) => {
          const pageData = response?.data ?? [];

          if (isFirstPage) {
            this.notifications.set(pageData);
          } else {
            this.notifications.update((current) => [...current, ...pageData]);
          }

          const paginate = response?.paginate;
          let hasMore = false;
          let nextPage = this.pageNumber() + 1;

          if (paginate) {
            const totalPages = paginate.totalPages ?? 0;
            const currentPage = paginate.pageNumber ?? this.pageNumber();
            hasMore = totalPages > 0 && currentPage < totalPages;
            nextPage = currentPage + 1;

            if (currentFilter === 'unread') {
              const totalUnread = paginate.totalItems ?? pageData.length;
              this.unreadItemsTotal = totalUnread;
              this.readAllCompleted = totalUnread === 0;
            } else {
              this.unreadItemsTotal = 0;
            }
          } else {
            hasMore = pageData.length === NOTIFICATION_PAGE_SIZE;

            if (currentFilter === 'unread') {
              const totalUnread = this.notifications().length;
              this.unreadItemsTotal = totalUnread;
              this.readAllCompleted = totalUnread === 0;
            } else {
              this.unreadItemsTotal = 0;
            }
          }

          if (hasMore) {
            this.pageNumber.set(nextPage);
          }

          this.canLoadMore.set(hasMore);
        },
        error: (error) => {
          this.logService.error(
            'NotificationListComponent.loadNotifications',
            error,
          );
          if (isFirstPage) {
            this.notifications.set([]);
          }
        },
      });
  }

  private markAllAsReadIfNeeded(): Observable<void> {
    if (this.readAllInFlight$) {
      return this.readAllInFlight$;
    }

    const unreadCount = this.notificationService.unreadCount();
    const hasUnread =
      !this.readAllCompleted && (this.unreadItemsTotal > 0 || unreadCount > 0);

    if (!hasUnread) {
      return of(void 0);
    }

    const request$ = this.notificationService.markAllAsRead().pipe(
      tap(() => {
        this.unreadItemsTotal = 0;
        this.readAllCompleted = true;
        this.notificationService.refreshUnreadCount();
      }),
      catchError((error) => {
        this.logService.error(
          'NotificationListComponent.markAllAsReadIfNeeded',
          error,
        );
        return of(void 0);
      }),
      finalize(() => {
        this.readAllInFlight$ = undefined;
      }),
      shareReplay(1),
    );

    this.readAllInFlight$ = request$;
    return request$;
  }

  private resetPagination(): void {
    this.currentLoadSub?.unsubscribe();
    this.currentLoadSub = undefined;
    this.notifications.set([]);
    this.pageNumber.set(1);
    this.canLoadMore.set(true);
    this.isPaging = false;
    this.isLoading.set(false);
  }

  onNotificationSelected(notification: Notification): void {
    if (!notification.destination) {
      return;
    }

    try {
      const metadata = (notification.metadata ?? {}) as Record<string, any>;
      const deepLink = this.deepLinkService.handleNotificationClick(
        notification.destination,
        metadata,
      );

      if (
        deepLink.route === '/notifications' ||
        deepLink.route === 'notifications'
      ) {
        return;
      }

      this.deepLinkService.navigateToDestination(deepLink);
    } catch (error) {
      this.logService.error(
        'NotificationListComponent.onNotificationSelected',
        error,
      );
    }
  }
}
