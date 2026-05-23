import { NotificationSettingsResource } from './notification.dto';
import { resolveNotificationSettingsResourceConfig } from './notification-settings.config';

const FALLBACK_NOTIFICATION_RESOURCE = NotificationSettingsResource.GLOBAL;

export function resolveNotificationIcon(
  resource?: NotificationSettingsResource | null,
): string {
  const resolvedResource = resource ?? FALLBACK_NOTIFICATION_RESOURCE;
  const config = resolveNotificationSettingsResourceConfig(resolvedResource);

  return config.icon;
}
