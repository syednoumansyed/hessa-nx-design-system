import { inject, Injectable, signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { LayoutService } from '@layout/layout.service';
import { DsSidebarWrapperComponent } from './sidebar-wrapper.component';
import { DsModalWrapperComponent } from '../modal/modal-wrapper.component';
import { ModalSheetService } from '../modal-sheet/modal-sheet.service';
import {
  DsSidebarConfig,
  DsSidebarRef,
  DsSidebarResult,
  SidebarStackEntry,
} from './sidebar.types';
import {
  sidebarEnterAnimation,
  sidebarLeaveAnimation,
} from './sidebar.animations';

@Injectable({ providedIn: 'root' })
export class DsSidebarService {
  private readonly modalCtrl = inject(ModalController);
  private readonly layoutService = inject(LayoutService);
  private readonly modalSheetService = inject(ModalSheetService);

  private nextId = 0;
  private readonly sidebarStack = signal<SidebarStackEntry[]>([]);

  async open<TProps = Record<string, unknown>, TResult = unknown>(
    config: DsSidebarConfig<TProps>,
  ): Promise<DsSidebarRef<TResult>> {
    const {
      component,
      componentProps = {} as TProps,
      headerConfig,
      headerComponent,
      headerComponentProps,
      footerConfig,
      cssClass,
      backdropDismiss = true,
      showBackdrop = true,
      contentClass = 'p-ds-xl',
      scrollableContent = true,
      mobileBreakpoint = 1,
      mobileBreakpoints = [0, 1],
      mobileHandle = false,
      mobilePresentation = 'bottom-sheet',
      closeBehavior = 'current',
    } = config;

    const entryId = this.nextId++;
    const useMobile = this.layoutService.isMobileOrTablet();

    // Mobile + modal-sheet: use the custom stacking modal sheet system
    if (useMobile && mobilePresentation === 'modal-sheet') {
      const ref = this.modalSheetService.present<TResult>({
        component,
        componentProps: componentProps as Record<string, unknown>,
        headerConfig,
        headerComponent,
        headerComponentProps,
        footerConfig,
        contentClass,
        scrollableContent,
        backdropDismiss,
        ...(closeBehavior === 'all'
          ? { onCloseIntercept: () => this.dismissAll() }
          : {}),
      });

      const stackEntry: SidebarStackEntry = {
        id: entryId,
        type: 'modal-sheet',
        closeBehavior,
        dismissFn: (data?, role?) => ref.dismiss(data as TResult, role),
      };
      this.sidebarStack.update((s) => [...s, stackEntry]);

      // Cleanup when dismissed externally (backdrop, back button, etc.)
      ref.onDismiss().then(() => this.removeFromStack(entryId));

      return {
        dismiss: async (data?: TResult, role?: string) => {
          return ref.dismiss(data, role);
        },
        onDismiss: ref.onDismiss,
      };
    }

    let modalInstance: HTMLIonModalElement;
    const dismissFn = (data?: unknown, role?: string) => {
      if (role === 'close' && closeBehavior === 'all') {
        this.dismissAll(data, role);
      } else {
        modalInstance?.dismiss(data, role);
      }
    };

    // When the handlebar is shown on mobile, it visually signals "drag to
    // close" so the close (X) button is redundant. Default it off unless the
    // caller explicitly set it.
    const effectiveHeaderConfig =
      useMobile && mobileHandle && headerConfig
        ? {
            ...headerConfig,
            showCloseButton: headerConfig.showCloseButton ?? false,
          }
        : headerConfig;

    const modal = await this.modalCtrl.create(
      useMobile
        ? {
            // Mobile: use the modal wrapper as a bottom sheet
            component: DsModalWrapperComponent,
            componentProps: {
              contentComponent: component,
              contentProps: componentProps,
              headerConfig: effectiveHeaderConfig,
              headerComponent,
              headerComponentProps,
              footerConfig: footerConfig
                ? {
                    ...footerConfig,
                    fullWidthButtons: footerConfig.fullWidthButtons ?? true,
                    buttonSize: footerConfig.buttonSize ?? 'lg',
                  }
                : footerConfig,
              contentClass,
              modalSize: 'lg',
              dismissFn,
              scrollableContent,
            },
            backdropDismiss,
            showBackdrop,
            initialBreakpoint: mobileBreakpoint,
            breakpoints: mobileBreakpoints,
            handle: mobileHandle,
            expandToScroll: false,
            cssClass: [
              'ds-modal-mobile-sheet',
              ...(scrollableContent ? ['ds-modal-scrollable'] : []),
              ...(mobileHandle ? ['ds-modal-with-handle'] : []),
            ],
          }
        : {
            // Desktop: use the sidebar wrapper with slide-in animation
            component: DsSidebarWrapperComponent,
            componentProps: {
              contentComponent: component,
              contentProps: componentProps,
              headerConfig,
              headerComponent,
              headerComponentProps,
              footerConfig,
              contentClass,
              dismissFn,
              scrollableContent,
            },
            backdropDismiss,
            showBackdrop,
            cssClass: this.buildCssClasses(cssClass),
            enterAnimation: sidebarEnterAnimation,
            leaveAnimation: sidebarLeaveAnimation,
          },
    );

    modalInstance = modal;

    const stackEntry: SidebarStackEntry = {
      id: entryId,
      type: 'ionic-modal',
      closeBehavior,
      modal,
    };
    this.sidebarStack.update((s) => [...s, stackEntry]);

    // Cleanup when dismissed externally (swipe, backdrop, hardware back)
    modal.onWillDismiss().then(() => this.removeFromStack(entryId));

    await modal.present();

    return {
      dismiss: async (data?: TResult, role?: string) => {
        return modal.dismiss(data, role);
      },
      onDismiss: async (): Promise<DsSidebarResult<TResult>> => {
        const { data, role } = await modal.onWillDismiss<TResult>();
        return { data, role };
      },
    };
  }

  /**
   * Dismiss the entire sidebar stack (all open sidebars, bottom sheets, and modal sheets).
   * Entries are dismissed top-down for clean visual teardown.
   */
  async dismissAll(data?: unknown, role?: string): Promise<void> {
    const entries = [...this.sidebarStack()];
    this.sidebarStack.set([]);

    for (const entry of entries.reverse()) {
      try {
        if (entry.type === 'ionic-modal') {
          await entry.modal.dismiss(data, role);
        } else {
          entry.dismissFn(data, role);
        }
      } catch {
        // Entry may already be dismissed
      }
    }
  }

  async dismiss<T = unknown>(data?: T, role?: string): Promise<boolean> {
    return this.modalCtrl.dismiss(data, role);
  }

  async getTop(): Promise<HTMLIonModalElement | undefined> {
    return this.modalCtrl.getTop();
  }

  private removeFromStack(entryId: number): void {
    this.sidebarStack.update((s) => s.filter((e) => e.id !== entryId));
  }

  private buildCssClasses(additionalClasses?: string | string[]): string[] {
    const classes: string[] = ['ds-sidebar'];

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
