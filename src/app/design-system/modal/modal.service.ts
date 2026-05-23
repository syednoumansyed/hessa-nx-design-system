import { inject, Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';
import { DsModalWrapperComponent } from './modal-wrapper.component';
import {
  DsModalConfig,
  DsModalRef,
  DsModalResult,
  DsModalSize,
} from './modal.types';

/**
 * Size to CSS class mapping for desktop modals
 * sm: 500px, md: 560px, lg: 800px
 */
const SIZE_CLASS_MAP: Record<DsModalSize, string> = {
  sm: 'ds-modal-sm',
  md: 'ds-modal-md',
  lg: 'ds-modal-lg',
};

/**
 * Service for opening modals with consistent behavior across the application.
 *
 * Features:
 * - Automatic mobile/desktop handling (bottom sheet on mobile, dialog on desktop)
 * - Configurable header and footer
 * - Type-safe component props
 * - Promise-based result handling
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await this.modalService.open({
 *   component: MyContentComponent,
 *   headerConfig: { title: 'My Modal', showCloseButton: true },
 *   footerConfig: {
 *     primaryButton: { text: 'Save' },
 *     secondaryButton: { text: 'Cancel' }
 *   }
 * });
 *
 * if (result.role === 'confirm') {
 *   // Handle confirmation
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With programmatic control
 * const modalRef = await this.modalService.open({
 *   component: MyContentComponent,
 *   headerConfig: { title: 'Processing...' }
 * });
 *
 * // Later, dismiss programmatically
 * await modalRef.dismiss({ success: true }, 'confirm');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DsModalService {
  private readonly modalCtrl = inject(ModalController);
  private readonly isMobile = isMobile();

  /**
   * Opens a modal with the specified configuration.
   *
   * @param config - Modal configuration options
   * @returns Promise resolving to a modal reference for programmatic control
   */
  async open<TProps = Record<string, unknown>, TResult = unknown>(
    config: DsModalConfig<TProps>,
  ): Promise<DsModalRef<TResult>> {
    const {
      component,
      componentProps = {} as TProps,
      headerConfig,
      headerComponent,
      headerComponentProps,
      footerConfig,
      size = 'lg',
      cssClass,
      backdropDismiss = true,
      showBackdrop = true,
      contentClass = 'p-ds-xl',
      mobileBreakpoint = 1,
      mobileBreakpoints = [0, 1],
      mobileHandle = false,
      respectTopSafeArea = false,
      scrollableContent = true,
    } = config;

    // Build CSS classes for desktop
    const cssClasses = this.buildCssClasses(size, cssClass, scrollableContent);

    // Create dismiss function that will be passed to the wrapper
    let modalInstance: HTMLIonModalElement;
    const dismissFn = (data?: unknown, role?: string) => {
      modalInstance?.dismiss(data, role);
    };

    // On mobile the modal is presented as a bottom sheet. Match the sidebar
    // bottom-sheet design: default to full-width buttons and lg button size so
    // single-button footers don't right-align. Caller can still override.
    const effectiveFooterConfig =
      this.isMobile && footerConfig
        ? {
            ...footerConfig,
            fullWidthButtons: footerConfig.fullWidthButtons ?? true,
            buttonSize: footerConfig.buttonSize ?? 'lg',
          }
        : footerConfig;

    // When the handlebar is shown on mobile, it visually signals "drag to
    // close" so the close (X) button is redundant. Default it off unless the
    // caller explicitly set it.
    const effectiveHeaderConfig =
      this.isMobile && mobileHandle && headerConfig
        ? {
            ...headerConfig,
            showCloseButton: headerConfig.showCloseButton ?? false,
          }
        : headerConfig;

    // Create the modal
    const modal = await this.modalCtrl.create({
      component: DsModalWrapperComponent,
      componentProps: {
        contentComponent: component,
        contentProps: componentProps,
        headerConfig: effectiveHeaderConfig,
        headerComponent,
        headerComponentProps,
        footerConfig: effectiveFooterConfig,
        contentClass,
        modalSize: size,
        dismissFn,
        respectTopSafeArea: this.isMobile && respectTopSafeArea,
        scrollableContent,
      },
      backdropDismiss,
      showBackdrop,
      ...(this.isMobile
        ? {
            initialBreakpoint: mobileBreakpoint,
            breakpoints: mobileBreakpoints,
            handle: mobileHandle,
            // Overflow-based scroll content: tell Ionic not to capture content
            // gestures for sheet resize. Sheet only drags via header or handle.
            expandToScroll: false,
            cssClass: [
              'ds-modal-mobile-sheet',
              ...(scrollableContent ? ['ds-modal-scrollable'] : []),
              ...(mobileHandle ? ['ds-modal-with-handle'] : []),
            ],
          }
        : {
            cssClass: cssClasses,
          }),
    });

    modalInstance = modal;
    await modal.present();

    // Return modal reference
    return {
      dismiss: async (data?: TResult, role?: string) => {
        return modal.dismiss(data, role);
      },
      onDismiss: async (): Promise<DsModalResult<TResult>> => {
        const { data, role } = await modal.onWillDismiss<TResult>();
        return { data, role };
      },
    };
  }

  /**
   * Dismisses the top-most modal.
   *
   * @param data - Optional data to return
   * @param role - Optional role for the dismissal
   */
  async dismiss<T = unknown>(data?: T, role?: string): Promise<boolean> {
    return this.modalCtrl.dismiss(data, role);
  }

  /**
   * Gets the top-most modal element.
   */
  async getTop(): Promise<HTMLIonModalElement | undefined> {
    return this.modalCtrl.getTop();
  }

  /**
   * Builds the CSS class array for the modal.
   */
  private buildCssClasses(
    size: DsModalSize,
    additionalClasses?: string | string[],
    scrollableContent?: boolean,
  ): string[] {
    const classes: string[] = [];

    // Add size class
    const sizeClass = SIZE_CLASS_MAP[size];
    if (sizeClass) {
      classes.push(sizeClass);
    }

    // Add scrollable content class for proper height constraints
    if (scrollableContent) {
      classes.push('ds-modal-scrollable');
    }

    // Add additional classes
    if (additionalClasses) {
      if (Array.isArray(additionalClasses)) {
        classes.push(...additionalClasses);
      } else {
        classes.push(additionalClasses);
      }
    }

    return classes;
  }
}
