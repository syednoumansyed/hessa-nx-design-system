import { FaIconComponentsProps, hesIcon } from '@shared/types';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';

export interface IAction<T = any> {
  iconProps?: FaIconComponentsProps;
  hesIconProps?: hesIcon;

  text: string;
  textFormatter?: (data: T) => string;
  onClick?: (data: T) => void;
  hasPermission?: (data: T) => boolean;
  button?: {
    label: string;
    color?:
      | 'primary'
      | 'secondary'
      | 'link'
      | 'gray'
      | 'white'
      | 'error'
      | 'info';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    isDisabled?: (data: T) => boolean;
  };
  mobileViewConfig?: {
    isPrimaryBtn: boolean;
    disabled?: (data: T) => boolean;
    buttonInfo: {
      color?:
        | 'primary'
        | 'secondary'
        | 'link'
        | 'gray'
        | 'white'
        | 'error'
        | 'info';
    };
  };
}
