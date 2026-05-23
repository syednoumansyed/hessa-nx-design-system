import { DsObjId } from '@ds/common.types';
import { DsIconSize, DsIcon } from '@ds/icon/icon.component';

export interface DsActionListItemAvatarConfig {
  imageUrl?: string;
  fullName?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface DsActionListItemSupportingTextConfig {
  text: string;
  icon?: DsIcon;
  count?: number;
  variant?: 'success' | 'danger' | 'default';
}

export interface DsActionListItemConfig {
  id?: DsObjId;
  avatar?: DsActionListItemAvatarConfig;
  title: string;
  upperSupportingText?: string;
  bgColor?: string;
  showActiveBorder?: boolean;
  showActiveBg?: boolean;
  supportingText?:
    | DsActionListItemSupportingTextConfig
    | DsActionListItemSupportingTextConfig[];
  endIconConfig?: {
    showArrow?: boolean;
    icon?: DsIcon;
    size?: DsIconSize;
    cssClass?: string;
    disableRtlRotate?: boolean;
  };
  isActive?: boolean;
}

export interface DsActionListConfig {
  title?: string;
  showCloseButton?: boolean;
  items: DsActionListItemConfig[];
  onItemAction?: (item: DsActionListItemConfig, index: number) => void;
  activeItemIndex?: number;
}

export interface DsActionListResult {
  cancelled: boolean;
  actionItem?: DsActionListItemConfig;
}
