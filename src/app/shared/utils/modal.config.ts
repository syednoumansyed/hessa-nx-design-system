import { ModalOptions } from '@ionic/angular/standalone';

/**
 * Standardized modal configuration for application modals
 * Provides consistent behavior across all modals:
 * - Bottom sheet on mobile (with breakpoints)
 * - Standard modal on desktop
 */
export interface ModalConfig {
  /** The modal component to display */
  component: any;
  /** Props to pass to the modal component */
  componentProps?: Record<string, any>;
  /** Additional custom CSS classes (will be added alongside defaults) */
  customCssClasses?: string[];
  /** Custom breakpoints for mobile (default: [0, 0.9]) */
  mobileBreakpoints?: number[];
  /** Initial breakpoint for mobile (default: 0.9) */
  mobileInitialBreakpoint?: number;
  /** Function to check if current device is mobile */
  isMobile: () => boolean;
}

/**
 * Creates standardized modal options for application modals
 * @param config Modal configuration including isMobile check function
 * @returns ModalOptions ready to pass to modalController.create()
 */
export function createModalOptions(config: ModalConfig): ModalOptions {
  const isMobile = config.isMobile();

  const baseCssClasses = isMobile
    ? ['modal-reset']
    : ['xl-modal', 'overflow-y-auto'];

  const cssClass = [...baseCssClasses, ...(config.customCssClasses ?? [])];

  const modalOptions: ModalOptions = {
    component: config.component,
    componentProps: config.componentProps,
    cssClass,
    // Disable backdrop dismiss on desktop
    backdropDismiss: isMobile,
  };

  if (isMobile) {
    const breakpoints = config.mobileBreakpoints ?? [0, 0.9];
    const initialBreakpoint = config.mobileInitialBreakpoint ?? 0.9;

    modalOptions.breakpoints = breakpoints;
    modalOptions.initialBreakpoint = initialBreakpoint;
  }

  return modalOptions;
}

/**
 * Computes modal CSS classes for use with ion-modal in templates
 * @param isMobile Function to check if current device is mobile
 * @param customClasses Optional custom CSS classes to add
 * @returns Array of CSS classes to apply
 */
export function computeModalCssClasses(
  isMobile: boolean,
  customClasses?: string[],
): string[] {
  const baseCssClasses = isMobile
    ? ['modal-reset']
    : ['xl-modal', 'overflow-y-auto'];

  return [...baseCssClasses, ...(customClasses ?? [])];
}

/**
 * Computes modal breakpoints for ion-modal on mobile
 * @param isMobile Whether device is mobile
 * @param customBreakpoints Optional custom breakpoints
 * @returns Breakpoints array or undefined (for desktop)
 */
export function computeModalBreakpoints(
  isMobile: boolean,
  customBreakpoints?: number[],
): number[] | undefined {
  return isMobile ? (customBreakpoints ?? [0, 0.9]) : undefined;
}

/**
 * Computes initial breakpoint for ion-modal on mobile
 * @param isMobile Whether device is mobile
 * @param customInitialBreakpoint Optional custom initial breakpoint
 * @returns Initial breakpoint or undefined (for desktop)
 */
export function computeModalInitialBreakpoint(
  isMobile: boolean,
  customInitialBreakpoint?: number,
): number | undefined {
  return isMobile ? (customInitialBreakpoint ?? 0.9) : undefined;
}
