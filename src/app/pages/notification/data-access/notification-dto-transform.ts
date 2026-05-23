import { ensureArray } from '@shared/utils/array.util';
import { NotificationDTO } from './notification.dto';
import { Notification } from './notification.interface';
import { resolveNotificationIcon } from './notification-config';
import { getLocalizedName } from '@shared/utils/localization.util';

const resolveCreatedAt = (dto: NotificationDTO): string =>
  dto.createdAt ?? new Date().toISOString();

const resolveReadState = (dto: NotificationDTO): boolean =>
  typeof dto.isRead === 'boolean' ? dto.isRead : false;

export const NOTIFICATION_MAP_FROM_DTO = new (class {
  notification(dto: NotificationDTO): Notification {
    const icon = resolveNotificationIcon(dto.resource ?? null);
    const localizedTitle = getLocalizedName({
      enName: dto.title?.en ?? null,
      arName: dto.title?.ar ?? null,
    });
    const localizedDescription = getLocalizedName({
      enName: dto.body?.en ?? null,
      arName: dto.body?.ar ?? null,
    });
    const notification: Notification = {
      id: dto.id,
      title: localizedTitle ?? 'notifications.generic.title',
      description: localizedDescription ?? 'notifications.generic.description',
      icon,
      createdAt: resolveCreatedAt(dto),
      isRead: resolveReadState(dto),
      destination: dto.destination ?? null,
      metadata: dto.metadata ?? null,
    };

    return notification;
  }

  notifications(dto: NotificationDTO[] | null): Notification[] {
    return ensureArray(dto).map((item) => this.notification(item));
  }
})();
