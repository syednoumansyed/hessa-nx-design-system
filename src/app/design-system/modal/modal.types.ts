import { Type } from '@angular/core';
import { DsModalHeaderConfig, DsModalFooterConfig } from './modal.component';

/**
 * Modal size options
 * - sm: 500px width - for simple forms and confirmations, buttons are always full width (50/50 if two)
 * - md: 560px width - for medium content like previews, buttons can be full width or right-aligned
 * - lg: 800px width - for complex content, buttons on right side (desktop) or full width (mobile)
 */
export type DsModalSize = 'sm' | 'md' | 'lg';

/**
 * Result returned when modal is dismissed
 */
export interface DsModalResult<T = unknown> {
  /** The role used to dismiss the modal (e.g., 'confirm', 'cancel', 'backdrop') */
  role?: string;
  /** Optional data returned from the modal */
  data?: T;
}

/**
 * Configuration for opening a modal with the DsModalService
 */
export interface DsModalConfig<TProps = Record<string, unknown>> {
  /**
   * The component to render inside the modal body.
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
   * Set to `{ showCloseButton: true }` for a minimal header with just close button.
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
   * Modal size. Defaults to 'lg'.
   * On mobile, this is ignored as modals use bottom sheet behavior.
   */
  size?: DsModalSize;

  /**
   * Additional CSS classes to apply to the modal.
   * Can be a string or array of strings.
   */
  cssClass?: string | string[];

  /**
   * Whether clicking the backdrop should dismiss the modal.
   * Defaults to true.
   */
  backdropDismiss?: boolean;

  /**
   * Whether to show the backdrop.
   * Defaults to true.
   */
  showBackdrop?: boolean;

  /**
   * Custom CSS class for the modal content area.
   * Useful for adding padding or scroll behavior.
   */
  contentClass?: string;

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
   * Mobile-specific: Whether to add top safe area padding.
   * Use this for full-height modals that reach the top of the screen (Dynamic Island/notch).
   * Bottom safe area is always applied on mobile.
   * Defaults to false.
   */
  respectTopSafeArea?: boolean;

  /**
   * Whether the content area should scroll independently while header and footer remain sticky.
   * When true, the header and footer stay fixed and only the content area scrolls.
   * Defaults to false (entire modal scrolls together).
   */
  scrollableContent?: boolean;
}

/**
 * Reference to an open modal instance.
 * Use this to programmatically dismiss the modal or listen for dismissal.
 */
export interface DsModalRef<T = unknown> {
  /**
   * Dismiss the modal with optional data and role.
   * @param data - Optional data to return to the caller
   * @param role - Optional role indicating how the modal was dismissed
   */
  dismiss: (data?: T, role?: string) => Promise<boolean>;

  /**
   * Promise that resolves when the modal is dismissed.
   * Returns the result containing data and role.
   */
  onDismiss: () => Promise<DsModalResult<T>>;
}

/**
 * Props that are automatically injected into modal content components
 */
export interface DsModalContentProps {
  /**
   * Function to close the modal from within the content component.
   * @param data - Optional data to return to the caller
   * @param role - Optional role indicating how the modal was dismissed
   */
  closeModal: (data?: unknown, role?: string) => void;
}
