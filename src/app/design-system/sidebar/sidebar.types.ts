import { Type } from '@angular/core';
import {
  DsModalHeaderConfig,
  DsModalFooterConfig,
} from '../modal/modal.component';

export { DsModalHeaderConfig as DsSidebarHeaderConfig };
export { DsModalFooterConfig as DsSidebarFooterConfig };

/**
 * Result returned when sidebar is dismissed
 */
export interface DsSidebarResult<T = unknown> {
  role?: string;
  data?: T;
}

/**
 * Configuration for opening a sidebar with DsSidebarService
 */
export interface DsSidebarConfig<TProps = Record<string, unknown>> {
  /**
   * The component to render inside the sidebar body.
   * This component will receive all componentProps plus a `closeModal` function.
   */
  component: Type<unknown>;

  /**
   * Props to pass to the content component.
   * The component will also receive `closeModal: (data?, role?) => void`
   */
  componentProps?: TProps;

  /**
   * Header configuration. If not provided, no header will be shown.
   * Ignored when headerComponent is provided.
   */
  headerConfig?: DsModalHeaderConfig;

  /**
   * Custom header component. When provided, replaces the standard header entirely.
   * The component receives headerComponentProps as inputs and a closeModal function.
   */
  headerComponent?: Type<unknown>;

  /**
   * Props to pass to the custom header component.
   */
  headerComponentProps?: Record<string, unknown>;

  /**
   * Footer configuration. If not provided, no footer will be shown.
   */
  footerConfig?: DsModalFooterConfig;

  /**
   * Additional CSS classes to apply to the sidebar.
   */
  cssClass?: string | string[];

  /**
   * Whether clicking the backdrop should dismiss the sidebar.
   * Defaults to true.
   */
  backdropDismiss?: boolean;

  /**
   * Whether to show the backdrop.
   * Defaults to true.
   */
  showBackdrop?: boolean;

  /**
   * Custom CSS class for the sidebar content area.
   * Defaults to 'p-ds-xl'.
   */
  contentClass?: string;

  /**
   * Whether the content area should scroll independently while header and footer remain sticky.
   * Defaults to true.
   */
  scrollableContent?: boolean;

  /**
   * Mobile-specific: Initial breakpoint for the bottom sheet.
   * Value between 0 and 1 representing percentage of screen height.
   * Defaults to 1 (full height).
   */
  mobileBreakpoint?: number;

  /**
   * Mobile-specific: Available breakpoints for the bottom sheet.
   * Defaults to [1] (only full height).
   */
  mobileBreakpoints?: number[];

  /**
   * Mobile-specific: Whether to show the drag handle.
   * Defaults to false.
   */
  mobileHandle?: boolean;

  /**
   * Mobile-specific: Presentation style for mobile.
   * - 'bottom-sheet' (default): Uses Ionic bottom sheet with breakpoints and optional drag handle.
   * - 'modal-sheet': Uses a custom iOS page-sheet style modal that supports stacking.
   *   No drag/resize gestures. Better suited for multi-step forms.
   */
  mobilePresentation?: 'bottom-sheet' | 'modal-sheet';

  /**
   * Determines close button behavior when multiple sidebars are stacked.
   * - 'current' (default): Close button dismisses only this instance.
   * - 'all': Close button dismisses the entire sidebar stack.
   *
   * The back button always dismisses only the current instance regardless of this setting.
   */
  closeBehavior?: 'current' | 'all';
}

/**
 * Internal stack entry tracked by DsSidebarService.
 */
interface SidebarStackEntryBase {
  id: number;
  closeBehavior: 'current' | 'all';
}

export interface IonicModalStackEntry extends SidebarStackEntryBase {
  type: 'ionic-modal';
  modal: HTMLIonModalElement;
}

export interface ModalSheetStackEntry extends SidebarStackEntryBase {
  type: 'modal-sheet';
  dismissFn: (data?: unknown, role?: string) => void;
}

export type SidebarStackEntry = IonicModalStackEntry | ModalSheetStackEntry;

/**
 * Reference to an open sidebar instance.
 */
export interface DsSidebarRef<T = unknown> {
  dismiss: (data?: T, role?: string) => Promise<boolean>;
  onDismiss: () => Promise<DsSidebarResult<T>>;
}
