import { UserType } from '@shared/enums';
import { UnreadNotification } from '@shared/services/unread-notification.service';
import { FaIconComponentsProps } from '@shared/types';

export interface IMenuRoutes {
  path: string;
  titleI18nKey: string;
  iconName?: string;
  iconClass?: string;
  permissions?: number[];
  permission?: number;
  isHide?: boolean | undefined;
  UserTypes?: Array<UserType>;
  notificationUnreadCountFn?: (notification: UnreadNotification) => number;
  faIcon?: FaIconComponentsProps;
  subRoutes?: IMenuRoutes[];
  placement?: 'upper' | 'lower';
  isPublic?: boolean;
  isHideFromSuperAdmin?: boolean;
  backgroundImage?: string;
}
