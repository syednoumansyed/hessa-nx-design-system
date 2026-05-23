import {
  Component,
  ComponentRef,
  computed,
  effect,
  inject,
  Injector,
  input,
  OnDestroy,
  OnInit,
  signal,
  Signal,
  Type,
  ViewChild,
  ViewContainerRef,
  WritableSignal,
} from '@angular/core';
import {
  DsModalComponent,
  DsModalHeaderConfig,
  DsModalFooterConfig,
} from './modal.component';
import { DsModalSize } from './modal.types';

/**
 * Interface for modal content components that need to control button states.
 * Content components can optionally implement these properties.
 */
export interface DsModalContentComponent {
  /** Called when primary button is clicked */
  onPrimaryClick?: () => void;
  /** Called when secondary button is clicked */
  onSecondaryClick?: () => void;
  /** Called when back button is clicked */
  onBackClick?: () => void;
  /** Called when close (X) button is clicked. If not provided, modal closes. */
  onCloseClick?: () => void;
  /** Function to close the modal (injected by wrapper) */
  closeModal?: (data?: unknown, role?: string) => void;
  /** Signal to control primary button disabled state */
  primaryButtonDisabled?: WritableSignal<boolean>;
  /** Signal to control primary button loading state */
  primaryButtonLoading?: WritableSignal<boolean>;
  /** Signal to control secondary button disabled state */
  secondaryButtonDisabled?: WritableSignal<boolean>;
  /** Signal to control secondary button loading state */
  secondaryButtonLoading?: WritableSignal<boolean>;
  /** Signal to dynamically control header config */
  headerConfig?: Signal<DsModalHeaderConfig | undefined>;
  /** Signal to dynamically provide a custom header component */
  headerComponent?: Signal<Type<unknown> | undefined>;
  /** Signal to dynamically provide props for the custom header component */
  headerComponentProps?: Signal<Record<string, unknown> | undefined>;
  /** Signal to dynamically control footer config */
  footerConfig?: Signal<DsModalFooterConfig | undefined>;
}

/**
 * Internal wrapper component used by DsModalService.
 * This component dynamically creates the content component and wires up all events.
 * Not intended for direct use - use DsModalService instead.
 *
 * Content components can expose WritableSignal properties to control button states:
 * - primaryButtonDisabled: WritableSignal<boolean> - disables the primary button
 * - primaryButtonLoading: WritableSignal<boolean> - shows loading state on primary button
 * - secondaryButtonDisabled: WritableSignal<boolean> - disables the secondary button
 * - secondaryButtonLoading: WritableSignal<boolean> - shows loading state on secondary button
 *
 * For multi-view modals, content components can also expose:
 * - headerConfig: Signal<DsModalHeaderConfig | undefined> - dynamic header config
 * - footerConfig: Signal<DsModalFooterConfig | undefined> - dynamic footer config
 */
@Component({
  selector: 'ds-modal-wrapper',
  standalone: true,
  imports: [DsModalComponent],
  template: `
    <ds-modal
      [headerConfig]="computedHeaderConfig()"
      [headerComponent]="computedHeaderComponent()"
      [headerComponentProps]="computedHeaderComponentProps()"
      [footerConfig]="computedFooterConfig()"
      [modalSize]="modalSize()"
      [contentClass]="contentClass()"
      [respectTopSafeArea]="respectTopSafeArea()"
      [scrollableContent]="scrollableContent()"
      [dismissFn]="dismissFn()"
      (backClick)="onBackClick()"
      (closeClick)="onCloseClick()"
      (primaryClick)="onPrimaryClick()"
      (secondaryClick)="onSecondaryClick()"
    >
      <ng-container #contentContainer />
    </ds-modal>
  `,
})
export class DsModalWrapperComponent implements OnInit, OnDestroy {
  readonly headerConfig = input<DsModalHeaderConfig>();
  readonly headerComponent = input<Type<unknown>>();
  readonly headerComponentProps = input<Record<string, unknown>>();
  readonly footerConfig = input<DsModalFooterConfig>();
  readonly modalSize = input<DsModalSize>('lg');
  readonly contentClass = input<string>('p-6');
  readonly respectTopSafeArea = input<boolean>(false);
  readonly scrollableContent = input<boolean>(false);
  readonly contentComponent = input.required<Type<unknown>>();
  readonly contentProps = input<Record<string, unknown>>({});
  readonly dismissFn =
    input.required<(data?: unknown, role?: string) => void>();

  @ViewChild('contentContainer', { read: ViewContainerRef, static: true })
  private contentContainer!: ViewContainerRef;

  private contentRef: ComponentRef<unknown> | null = null;
  private readonly injector = inject(Injector);

  // Internal signals to track button states
  private readonly primaryDisabled = signal(false);
  private readonly primaryLoading = signal(false);
  private readonly secondaryDisabled = signal(false);
  private readonly secondaryLoading = signal(false);

  // Internal signals for dynamic header/footer from content component
  private readonly dynamicHeaderConfig = signal<
    DsModalHeaderConfig | undefined
  >(undefined);
  private readonly dynamicFooterConfig = signal<
    DsModalFooterConfig | undefined
  >(undefined);
  private readonly hasDynamicConfig = signal(false);

  // Internal signals for dynamic header component from content component
  private readonly dynamicHeaderComponent = signal<Type<unknown> | undefined>(
    undefined,
  );
  private readonly dynamicHeaderComponentProps = signal<
    Record<string, unknown> | undefined
  >(undefined);

  protected readonly computedHeaderComponent = computed<
    Type<unknown> | undefined
  >(() => {
    const inputComponent = this.headerComponent();
    if (inputComponent) return inputComponent;
    if (this.hasDynamicConfig()) {
      return this.dynamicHeaderComponent();
    }
    return undefined;
  });

  protected readonly computedHeaderComponentProps = computed<
    Record<string, unknown> | undefined
  >(() => {
    const inputProps = this.headerComponentProps();
    if (this.headerComponent()) return inputProps;
    if (this.hasDynamicConfig()) {
      return this.dynamicHeaderComponentProps();
    }
    return inputProps;
  });

  // Computed header config - input config takes priority, then dynamic config
  protected readonly computedHeaderConfig = computed<
    DsModalHeaderConfig | undefined
  >(() => {
    const inputHeader = this.headerConfig();
    if (inputHeader) return inputHeader;

    if (this.hasDynamicConfig()) {
      return this.dynamicHeaderConfig();
    }
    return inputHeader;
  });

  // Computed footer config - input config takes priority, then dynamic config
  protected readonly computedFooterConfig = computed<
    DsModalFooterConfig | undefined
  >(() => {
    const inputFooter = this.footerConfig();
    const config = inputFooter
      ? inputFooter
      : this.hasDynamicConfig()
        ? this.dynamicFooterConfig()
        : inputFooter;

    if (!config) return undefined;

    return {
      ...config,
      primaryButton: config.primaryButton
        ? {
            ...config.primaryButton,
            disabled: config.primaryButton.disabled || this.primaryDisabled(),
            loading: config.primaryButton.loading || this.primaryLoading(),
          }
        : undefined,
      secondaryButton: config.secondaryButton
        ? {
            ...config.secondaryButton,
            disabled:
              config.secondaryButton.disabled || this.secondaryDisabled(),
            loading: config.secondaryButton.loading || this.secondaryLoading(),
          }
        : undefined,
    };
  });

  ngOnInit(): void {
    this.createContentComponent();
  }

  ngOnDestroy(): void {
    this.contentRef?.destroy();
  }

  private createContentComponent(): void {
    const component = this.contentComponent();
    if (!component) return;

    this.contentContainer.clear();

    this.contentRef = this.contentContainer.createComponent(component, {
      injector: this.injector,
    });

    const instance = this.contentRef.instance as DsModalContentComponent;

    // Pass all props to the content component using setInput for signal inputs
    const props = this.contentProps();
    Object.entries(props).forEach(([key, value]) => {
      this.contentRef!.setInput(key, value);
    });

    // Provide closeModal function
    instance.closeModal = (data?: unknown, role?: string) => {
      this.dismissFn()(data, role ?? 'close');
    };

    this.contentRef.changeDetectorRef.detectChanges();

    // Set up effects to watch content component's signals
    this.setupButtonStateEffects(instance);
    this.setupDynamicConfigEffects(instance);
  }

  /**
   * Sets up effects to reactively watch the content component's button state signals.
   * Uses Angular's effect() for clean, automatic subscription management.
   */
  private setupButtonStateEffects(instance: DsModalContentComponent): void {
    if (instance.primaryButtonDisabled) {
      const contentSignal = instance.primaryButtonDisabled;
      effect(
        () => {
          this.primaryDisabled.set(contentSignal());
        },
        { injector: this.injector },
      );
    }

    if (instance.primaryButtonLoading) {
      const contentSignal = instance.primaryButtonLoading;
      effect(
        () => {
          this.primaryLoading.set(contentSignal());
        },
        { injector: this.injector },
      );
    }

    if (instance.secondaryButtonDisabled) {
      const contentSignal = instance.secondaryButtonDisabled;
      effect(
        () => {
          this.secondaryDisabled.set(contentSignal());
        },
        { injector: this.injector },
      );
    }

    if (instance.secondaryButtonLoading) {
      const contentSignal = instance.secondaryButtonLoading;
      effect(
        () => {
          this.secondaryLoading.set(contentSignal());
        },
        { injector: this.injector },
      );
    }
  }

  /**
   * Sets up effects to watch content component's dynamic header/footer config signals.
   * This enables multi-view modals where header/footer change based on current view.
   */
  private setupDynamicConfigEffects(instance: DsModalContentComponent): void {
    // Check if content component provides dynamic config signals
    if (
      instance.headerConfig ||
      instance.headerComponent ||
      instance.footerConfig
    ) {
      this.hasDynamicConfig.set(true);

      if (instance.headerConfig) {
        const headerSignal = instance.headerConfig;
        effect(
          () => {
            this.dynamicHeaderConfig.set(headerSignal());
          },
          { injector: this.injector },
        );
      }

      if (instance.headerComponent) {
        const componentSignal = instance.headerComponent;
        effect(
          () => {
            this.dynamicHeaderComponent.set(componentSignal());
          },
          { injector: this.injector },
        );
      }

      if (instance.headerComponentProps) {
        const propsSignal = instance.headerComponentProps;
        effect(
          () => {
            this.dynamicHeaderComponentProps.set(propsSignal());
          },
          { injector: this.injector },
        );
      }

      if (instance.footerConfig) {
        const footerSignal = instance.footerConfig;
        effect(
          () => {
            this.dynamicFooterConfig.set(footerSignal());
          },
          { injector: this.injector },
        );
      }
    }
  }

  onBackClick(): void {
    const instance = this.contentRef?.instance as DsModalContentComponent;
    if (instance?.onBackClick) {
      instance.onBackClick();
    } else {
      this.dismissFn()(undefined, 'back');
    }
  }

  onCloseClick(): void {
    const instance = this.contentRef?.instance as DsModalContentComponent;
    if (instance?.onCloseClick) {
      instance.onCloseClick();
    } else {
      this.dismissFn()(undefined, 'close');
    }
  }

  onPrimaryClick(): void {
    const instance = this.contentRef?.instance as DsModalContentComponent;
    if (instance?.onPrimaryClick) {
      instance.onPrimaryClick();
    } else {
      // Default behavior: dismiss with 'confirm' role
      this.dismissFn()(undefined, 'confirm');
    }
  }

  onSecondaryClick(): void {
    const instance = this.contentRef?.instance as DsModalContentComponent;
    if (instance?.onSecondaryClick) {
      instance.onSecondaryClick();
    } else {
      // Default behavior: dismiss with 'cancel' role
      this.dismissFn()(undefined, 'cancel');
    }
  }
}
