import {
  FlipProp,
  IconProp,
  SizeProp,
} from '@fortawesome/fontawesome-svg-core';

// Extracted from node_modules/@fortawesome/angular-fontawesome/icon/icon.component.ts
// This is the interface for passing props to the icon component
export type FaIconComponentsProps = {
  icon: IconProp;
  /**
   * Specify a title for the icon.
   *
   * This text will be displayed in a tooltip on hover and presented to the
   * screen readers.
   */
  title?: string;
  /**
   * Swap the default opacity of each duotone icon’s layers. This will make an
   * icon’s primary layer have the default opacity of 40% rather than its
   * secondary layer.
   *
   * @default false
   */
  swapOpacity?: 'true' | 'false' | boolean;
  /**
   * Customize the opacity of the primary icon layer.
   * Valid values are in range [0, 1.0].
   *
   * @default 1.0
   */
  primaryOpacity?: string | number;
  /**
   * Customize the opacity of the secondary icon layer.
   * Valid values are in range [0, 1.0].
   *
   * @default 0.4
   */
  secondaryOpacity?: string | number;
  /**
   * Customize the color of the primary icon layer.
   * Accepts any valid CSS color value.
   *
   * @default CSS inherited color
   */
  primaryColor?: string;
  /**
   * Customize the color of the secondary icon layer.
   * Accepts any valid CSS color value.
   *
   * @default CSS inherited color
   */
  secondaryColor?: string;

  flip?: FlipProp;
  size?: SizeProp;
  class?: string;
};

export type hesIcon = {
  src: string;
  class?: string;
  size?: 'sm' | 'md' | 'lg';
};
