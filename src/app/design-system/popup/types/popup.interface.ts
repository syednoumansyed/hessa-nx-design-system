import { IconDefinition } from '@fortawesome/pro-regular-svg-icons';

export interface PopupItem<T = unknown> {
  id?: string;
  title: string;
  subtitle?: string;
  state?: 'default' | 'danger' | 'success';
  icon?: string | IconDefinition;
  textClass?: string | string[];
  iconClass?: string | string[];
  children?: PopupItem<T>[];
  action?: (data?: T) => void;
  selected?: boolean;
  selectable?: boolean;
  visible?: boolean | ((data?: T) => boolean);
  disabled?: boolean | ((data?: T) => boolean);
}
