import { PopupItem } from '../popup/types/popup.interface';

export interface DsAccordionTag {
  text: string;
  variant?: 'default' | 'primary' | 'custom';
  customClasses?: string;
}

export type DsAccordionIconPosition = 'start' | 'end';

export interface DsAccordionConfig {
  allowMultiple?: boolean;
  defaultExpandedIds?: string[];
}

export type DsAccordionMenuItem = PopupItem;
