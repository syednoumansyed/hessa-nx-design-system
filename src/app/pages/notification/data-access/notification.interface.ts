import { NotificationDestination } from '@shared/enums';
import { IPaginatedResponse } from '@shared/interfaces';
import { NotificationSettingsResource } from './notification.dto';

export interface Notification {
  id: number;
  title: string;
  description: string;
  icon: string;
  createdAt: string;
  isRead: boolean;
  destination: NotificationDestination | null;
  metadata: Record<string, unknown> | null;
}

export type NotificationList = Notification[];

export type NotificationListResponse = IPaginatedResponse<NotificationList>;

export interface NotificationSetting {
  resourceId: number;
  resourceName: NotificationSettingsResource;
  labelKey: string;
  enabled: boolean;
  snoozeStartTime: string | null;
  snoozeEndTime: string | null;
  icon: string;
}

export type NotificationSettingsList = NotificationSetting[];
