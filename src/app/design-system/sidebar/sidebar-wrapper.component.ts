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
  Signal,
  signal,
  Type,
  ViewChild,
  ViewContainerRef,
  WritableSignal,
} from '@angular/core';
import { DsSidebarComponent } from './sidebar.component';
import {
  DsModalHeaderConfig,
  DsModalFooterConfig,
} from '../modal/modal.component';
import { DsModalContentComponent } from '../modal/modal-wrapper.component';

@Component({
  selector: 'ds-sidebar-wrapper',
  standalone: true,
  imports: [DsSidebarComponent],
  host: { class: 'flex flex-col h-full' },
  template: `
    <ds-sidebar
      [headerConfig]="computedHeaderConfig()"
      [headerComponent]="computedHeaderComponent()"
      [headerComponentProps]="computedHeaderComponentProps()"
      [dismissFn]="dismissFn()"
      [footerConfig]="computedFooterConfig()"
      [contentClass]="contentClass()"
      [scrollableContent]="scrollableContent()"
      (backClick)="onBackClick()"
      (closeClick)="onCloseClick()"
      (primaryClick)="onPrimaryClick()"
      (secondaryClick)="onSecondaryClick()"
    >
      <ng-container #contentContainer />
    </ds-sidebar>
  `,
})
export class DsSidebarWrapperComponent implements OnInit, OnDestroy {
  readonly headerConfig = input<DsModalHeaderConfig>();
  readonly headerComponent = input<Type<unknown>>();
  readonly headerComponentProps = input<Record<string, unknown>>();
  readonly footerConfig = input<DsModalFooterConfig>();
  readonly contentClass = input<string>('p-ds-xl');
  readonly scrollableContent = input<boolean>(true);
  readonly contentComponent = input.required<Type<unknown>>();
  readonly contentProps = input<Record<string, unknown>>({});
  readonly dismissFn =
    input.required<(data?: unknown, role?: string) => void>();

  @ViewChild('contentContainer', { read: ViewContainerRef, static: true })
  private contentContainer!: ViewContainerRef;

  private contentRef: ComponentRef<unknown> | null = null;
  private readonly injector = inject(Injector);

  private readonly primaryDisabled = signal(false);
  private readonly primaryLoading = signal(false);
  private readonly secondaryDisabled = signal(false);
  private readonly secondaryLoading = signal(false);

  private readonly dynamicHeaderConfig = signal<
    DsModalHeaderConfig | undefined
  >(undefined);
  private readonly dynamicHeaderComponent = signal<Type<unknown> | undefined>(
    undefined,
  );
  private readonly dynamicHeaderComponentProps = signal<
    Record<string, unknown> | undefined
  >(undefined);
  private readonly dynamicFooterConfig = signal<
    DsModalFooterConfig | undefined
  >(undefined);
  private readonly hasDynamicConfig = signal(false);

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

  protected readonly computedHeaderConfig = computed<
    DsModalHeaderConfig | undefined
  >(() => {
    // Sidebar's own header config always takes priority
    const sidebarHeader = this.headerConfig();
    if (sidebarHeader) return sidebarHeader;

    if (this.hasDynamicConfig()) {
      return this.dynamicHeaderConfig();
    }
    return sidebarHeader;
  });

  protected readonly computedFooterConfig = computed<
    DsModalFooterConfig | undefined
  >(() => {
    // Sidebar's own footer config takes priority
    const sidebarFooter = this.footerConfig();
    const config = sidebarFooter
      ? sidebarFooter
      : this.hasDynamicConfig()
        ? this.dynamicFooterConfig()
        : sidebarFooter;

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

    const props = this.contentProps();
    Object.entries(props).forEach(([key, value]) => {
      this.contentRef!.setInput(key, value);
    });

    instance.closeModal = (data?: unknown, role?: string) => {
      this.dismissFn()(data, role ?? 'close');
    };

    this.contentRef.changeDetectorRef.detectChanges();

    this.setupButtonStateEffects(instance);
    this.setupDynamicConfigEffects(instance);
  }

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

  private setupDynamicConfigEffects(instance: DsModalContentComponent): void {
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
      this.dismissFn()(undefined, 'confirm');
    }
  }

  onSecondaryClick(): void {
    const instance = this.contentRef?.instance as DsModalContentComponent;
    if (instance?.onSecondaryClick) {
      instance.onSecondaryClick();
    } else {
      this.dismissFn()(undefined, 'cancel');
    }
  }
}
