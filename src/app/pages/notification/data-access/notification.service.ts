import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ApiUrl } from '@shared/utils/api-url.util';
import { HesLogService } from '@shared/services/hes-log.service';
import { UnreadNotificationService } from '@shared/services/unread-notification.service';
import { NOTIFICATION_MAP_FROM_DTO } from './notification-dto-transform';
import {
  NotificationListResponse,
  NotificationSettingsList,
} from './notification.interface';
import {
  NotificationListResponseDTO,
  NotificationQueryDTO,
  NotificationCounterResponseDTO,
  NotificationSettingsResponseDTO,
  NotificationSettingUpdateDTO,
} from './notification.dto';
import { NOTIFICATION_SETTINGS_MAP_FROM_DTO } from './notification-settings-dto-transform';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly logService = inject(HesLogService);
  private readonly unreadNotificationService = inject(
    UnreadNotificationService,
  );

  private readonly unreadCountSignal = signal(0);

  readonly unreadCount = this.unreadCountSignal.asReadonly();

  getAll(
    params: NotificationQueryDTO = {},
  ): Observable<NotificationListResponse> {
    return this.fetch(params);
  }

  getUnread(
    params: NotificationQueryDTO = {},
  ): Observable<NotificationListResponse> {
    return this.fetch({
      ...params,
      isRead: false,
    });
  }

  refreshUnreadCount(): void {
    this.http
      .get<NotificationCounterResponseDTO>(
        `${ApiUrl.v2BE}/notifications/counter`,
      )
      .pipe(map((response) => response?.data?.count ?? 0))
      .subscribe({
        next: (count) => {
          this.unreadCountSignal.set(count);
          if (count > 0) {
            this.unreadNotificationService.loadUnread();
          }
        },
        error: (error) =>
          this.logService.error(
            'NotificationService.refreshUnreadCount',
            error,
          ),
      });
  }

  markAllAsRead(): Observable<void> {
    return this.http
      .post<void>(`${ApiUrl.v2BE}/notifications/mark-read`, {})
      .pipe(
        tap(() => {
          this.unreadCountSignal.set(0);
          this.unreadNotificationService.loadUnread();
        }),
      );
  }

  getSettings(): Observable<NotificationSettingsList> {
    return this.http
      .get<NotificationSettingsResponseDTO>(
        `${ApiUrl.v2BE}/notification-settings/`,
      )
      .pipe(
        map((response) =>
          NOTIFICATION_SETTINGS_MAP_FROM_DTO.notifications(response?.data),
        ),
      );
  }

  updateSetting(payload: NotificationSettingUpdateDTO): Observable<void> {
    return this.http
      .put(`${ApiUrl.v2BE}/notification-settings/`, payload)
      .pipe(map(() => void 0));
  }

  private fetch(
    params: NotificationQueryDTO = {},
  ): Observable<NotificationListResponse> {
    const queryParams = this.buildQueryParams(params);

    return this.http
      .get<NotificationListResponseDTO>(`${ApiUrl.v2BE}/notifications`, {
        params: queryParams,
      })
      .pipe(
        map(
          (response): NotificationListResponse => ({
            ...response,
            data: NOTIFICATION_MAP_FROM_DTO.notifications(response?.data),
          }),
        ),
      );
  }

  private buildQueryParams(
    params: NotificationQueryDTO,
  ): Record<string, string> {
    const query: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      query[key] = String(value);
    });

    return query;
  }
}
