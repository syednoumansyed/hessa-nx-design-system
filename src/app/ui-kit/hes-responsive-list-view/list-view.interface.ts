import { FaIconComponentsProps, hesIcon } from '@shared/types';

export type HesButtonColor = 'primary' | 'secondary';
export interface IListViewPrimaryAction {
  onClick: () => void;
  text: string;
  iconProps?: FaIconComponentsProps;
  hesIconProps?: hesIcon;
  isVisible?: () => boolean;
  isDisabled?: boolean;
  hesColor?: HesButtonColor;
}
