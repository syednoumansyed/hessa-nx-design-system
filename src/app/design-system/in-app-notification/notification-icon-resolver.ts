import { NotificationResource } from '@ds/in-app-notification/in-app-notification.model';

const DEFAULT_NOTIFICATION_ICON = 'announcement';

const NOTIFICATION_SETTINGS_RESOURCE_OVERRIDES: Partial<
  Record<NotificationResource, string>
> = {
  [NotificationResource.ACADEMIC_YEAR]: 'school-structure',
  [NotificationResource.ANNOUNCEMENT]: 'announcement',
  [NotificationResource.ATTENDANCE]: 'attendance',
  [NotificationResource.CAMPUS]: 'school-structure',
  [NotificationResource.CHAT]: 'chat',
  [NotificationResource.CLASS]: 'course',
  [NotificationResource.COMPANY]: 'school-structure',
  [NotificationResource.COURSE]: 'course',
  [NotificationResource.COURSE_CONTENTS]: 'course',
  [NotificationResource.GLOBAL]: 'feed',
  [NotificationResource.GRADES]: 'grade-management',
  [NotificationResource.GUARDIAN]: 'user-management',
  [NotificationResource.HELP_CENTER]: 'support',
  [NotificationResource.HOLIDAY]: 'feed',
  [NotificationResource.JOURNAL]: 'journal',
  [NotificationResource.LECTURE]: 'course',
  [NotificationResource.LEVEL]: 'course',
  [NotificationResource.LOGIN]: 'feed',
  [NotificationResource.PERSONNEL]: 'user-management',
  [NotificationResource.PICKUP_REQUEST]: 'pickup',
  [NotificationResource.REPORT]: 'report',
  [NotificationResource.ROLE_PERMISSION]: 'roles',
  [NotificationResource.SCHOOL]: 'school-structure',
  [NotificationResource.SEMESTER]: 'course',
  [NotificationResource.STUDENT]: 'user-management',
  [NotificationResource.TICKET]: 'support',
  [NotificationResource.TIME_PERIOD]: 'report',
  [NotificationResource.VCR]: 'VCR',
};

export function resolveNotificationIcon(
  resource: NotificationResource,
): string {
  return (
    NOTIFICATION_SETTINGS_RESOURCE_OVERRIDES[resource] ??
    DEFAULT_NOTIFICATION_ICON
  );
}
