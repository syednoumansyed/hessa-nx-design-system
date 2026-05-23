import { Type } from '@angular/core';
import {
  DsModalHeaderConfig,
  DsModalFooterConfig,
} from '../modal/modal.component';

/**
 * Configuration for presenting a modal sheet.
 */
export interface ModalSheetConfig {
  /** The component to render inside the sheet body */
  component: Type<unknown>;

  /** Props to pass to the content component */
  componentProps?: Record<string, unknown>;

  /** Header configuration. If not provided, no header will be shown. Ignored when headerComponent is provided. */
  headerConfig?: DsModalHeaderConfig;

  /** Custom header component. When provided, replaces the standard header entirely. */
  headerComponent?: Type<unknown>;

  /** Props to pass to the custom header component. */
  headerComponentProps?: Record<string, unknown>;

  /** Footer configuration. If not provided, no footer will be shown. */
  footerConfig?: DsModalFooterConfig;

  /** CSS class for the content area. Defaults to 'p-ds-xl'. */
  contentClass?: string;

  /** Whether the content area should scroll independently. Defaults to true. */
  scrollableContent?: boolean;

  /** Whether tapping backdrop dismisses the top sheet. Defaults to false. */
  backdropDismiss?: boolean;

  /** Optional intercept for close button behavior. When set, close button calls this instead of dismissFn. */
  onCloseIntercept?: () => void;
}

/**
 * Internal stack entry tracked by the service.
 */
export interface ModalSheetEntry {
  id: number;
  config: ModalSheetConfig;
  state: 'active' | 'behind' | 'hidden';
  dismissFn: (data?: unknown, role?: string) => void;
  onDismissResolve: (result: ModalSheetResult) => void;
}

/**
 * Result returned when a sheet is dismissed.
 */
export interface ModalSheetResult<T = unknown> {
  role?: string;
  data?: T;
}

/**
 * Reference to an open modal sheet instance.
 * Compatible with DsSidebarRef for seamless integration.
 */
export interface ModalSheetRef<T = unknown> {
  dismiss: (data?: T, role?: string) => Promise<boolean>;
  onDismiss: () => Promise<ModalSheetResult<T>>;
}
