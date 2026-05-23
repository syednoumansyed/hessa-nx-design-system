import { NotificationSettingsResource } from './notification.dto';

export interface NotificationSettingsResourceConfig {
  icon: string;
  backgroundImage?: string | null;
}

const DEFAULT_NOTIFICATION_SETTINGS_RESOURCE_CONFIG: NotificationSettingsResourceConfig =
  {
    icon: 'announcement',
    backgroundImage: 'assets/images/bg-brand.svg',
  };

const NOTIFICATION_SETTINGS_RESOURCE_OVERRIDES: Partial<
  Record<NotificationSettingsResource, NotificationSettingsResourceConfig>
> = {
  [NotificationSettingsResource.ACADEMIC_YEAR]: {
    icon: 'school-structure',
    backgroundImage: 'assets/images/bg-cyan.svg',
  },
  [NotificationSettingsResource.ANNOUNCEMENT]: {
    icon: 'announcement',
    backgroundImage: 'assets/images/bg-brand.svg',
  },
  [NotificationSettingsResource.ATTENDANCE]: {
    icon: 'attendance',
    backgroundImage: 'assets/images/bg-blue.svg',
  },
  [NotificationSettingsResource.CAMPUS]: {
    icon: 'school-structure',
    backgroundImage: 'assets/images/bg-cyan.svg',
  },
  [NotificationSettingsResource.CHAT]: {
    icon: 'chat',
    backgroundImage: 'assets/images/bg-brand.svg',
  },
  [NotificationSettingsResource.CLASS]: {
    icon: 'course',
    backgroundImage: 'assets/images/bg-coral.svg',
  },
  [NotificationSettingsResource.COMPANY]: {
    icon: 'school-structure',
    backgroundImage: 'assets/images/bg-cyan.svg',
  },
  [NotificationSettingsResource.COURSE]: {
    icon: 'course',
    backgroundImage: 'assets/images/bg-coral.svg',
  },
  [NotificationSettingsResource.COURSE_CONTENTS]: {
    icon: 'course',
    backgroundImage: 'assets/images/bg-coral.svg',
  },
  [NotificationSettingsResource.GLOBAL]: {
    icon: 'feed',
    backgroundImage: 'assets/images/bg-brand.svg',
  },
  [NotificationSettingsResource.GRADES]: {
    icon: 'grade-management',
    backgroundImage: 'assets/images/bg-yellow.svg',
  },
  [NotificationSettingsResource.GUARDIAN]: {
    icon: 'user-management',
    backgroundImage: 'assets/images/bg-brand.svg',
  },
  [NotificationSettingsResource.HELP_CENTER]: {
    icon: 'support',
    backgroundImage: 'assets/images/bg-indigo.svg',
  },
  [NotificationSettingsResource.HOLIDAY]: {
    icon: 'feed',
    backgroundImage: 'assets/images/bg-brand.svg',
  },
  [NotificationSettingsResource.JOURNAL]: {
    icon: 'journal',
    backgroundImage: 'assets/images/bg-orange.svg',
  },
  [NotificationSettingsResource.LECTURE]: {
    icon: 'course',
    backgroundImage: 'assets/images/bg-coral.svg',
  },
  [NotificationSettingsResource.LEVEL]: {
    icon: 'course',
    backgroundImage: 'assets/images/bg-coral.svg',
  },
  [NotificationSettingsResource.LOGIN]: {
    icon: 'feed',
    backgroundImage: 'assets/images/bg-brand.svg',
  },
  [NotificationSettingsResource.PERSONNEL]: {
    icon: 'user-management',
    backgroundImage: 'assets/images/bg-brand.svg',
  },
  [NotificationSettingsResource.PICKUP_REQUEST]: {
    icon: 'pickup',
    backgroundImage: 'assets/images/bg-green.svg',
  },
  [NotificationSettingsResource.REPORT]: {
    icon: 'report',
    backgroundImage: 'assets/images/bg-indigo.svg',
  },
  [NotificationSettingsResource.ROLE_PERMISSION]: {
    icon: 'roles',
    backgroundImage: 'assets/images/bg-indigo.svg',
  },
  [NotificationSettingsResource.SCHOOL]: {
    icon: 'school-structure',
    backgroundImage: 'assets/images/bg-cyan.svg',
  },
  [NotificationSettingsResource.SEMESTER]: {
    icon: 'course',
    backgroundImage: 'assets/images/bg-coral.svg',
  },
  [NotificationSettingsResource.STUDENT]: {
    icon: 'user-management',
    backgroundImage: 'assets/images/bg-brand.svg',
  },
  [NotificationSettingsResource.TICKET]: {
    icon: 'support',
    backgroundImage: 'assets/images/bg-indigo.svg',
  },
  [NotificationSettingsResource.TIME_PERIOD]: {
    icon: 'report',
    backgroundImage: 'assets/images/bg-indigo.svg',
  },
  [NotificationSettingsResource.VCR]: {
    icon: 'VCR',
    backgroundImage: 'assets/images/bg-gray-rich.svg',
  },
};

export function resolveNotificationSettingsResourceConfig(
  resource: NotificationSettingsResource,
): NotificationSettingsResourceConfig {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS_RESOURCE_CONFIG,
    ...(NOTIFICATION_SETTINGS_RESOURCE_OVERRIDES[resource] ?? {}),
  };
}
