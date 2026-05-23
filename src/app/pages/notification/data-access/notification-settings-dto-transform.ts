import { NotificationSettingDTO } from './notification.dto';
import { NotificationSetting } from './notification.interface';
import { resolveNotificationSettingsResourceConfig } from './notification-settings.config';

class NotificationSettingsMapFromDto {
  notification(dto: NotificationSettingDTO): NotificationSetting {
    const config = resolveNotificationSettingsResourceConfig(dto.resourceName);

    return {
      resourceId: dto.resourceId,
      resourceName: dto.resourceName,
      labelKey: dto.resourceName,
      enabled: dto.enabled,
      snoozeStartTime: dto.snoozeStartTime,
      snoozeEndTime: dto.snoozeEndTime,
      icon: config.icon,
    };
  }

  notifications(
    dtos: NotificationSettingDTO[] | null | undefined,
  ): NotificationSetting[] {
    if (!Array.isArray(dtos) || dtos.length === 0) {
      return [];
    }

    return dtos.map((dto) => this.notification(dto));
  }
}

export const NOTIFICATION_SETTINGS_MAP_FROM_DTO =
  new NotificationSettingsMapFromDto();
