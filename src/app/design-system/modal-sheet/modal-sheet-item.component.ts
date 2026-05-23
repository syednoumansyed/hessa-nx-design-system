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
  output,
  signal,
  Type,
  ViewChild,
  ViewContainerRef,
  WritableSignal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { DsModalHeaderComponent } from '../modal/modal-header.component';
import { DsModalFooterComponent } from '../modal/modal-footer.component';
import {
  DsModalHeaderConfig,
  DsModalFooterConfig,
} from '../modal/modal.component';
import { DsModalContentComponent } from '../modal/modal-wrapper.component';
import { ModalSheetEntry } from './modal-sheet.types';

/**
 * Renders a single modal sheet with its dynamic content component.
 * Used internally by ModalSheetContainerComponent.
 */
@Component({
  selector: 'ds-modal-sheet-item',
  standalone: true,
  imports: [NgClass, DsModalHeaderComponent, DsModalFooterComponent],
  template: `
    <div class="ds-modal-sheet">
      <!-- Custom Header -->
      @if (computedHeaderComponent()) {
        <div class="ds-modal-sheet-header">
          <ng-container #headerContainer />
        </div>
      } @else if (computedHeaderConfig()) {
        <!-- Standard Header -->
        <div class="ds-modal-sheet-header">
          <ds-modal-header
            [title]="computedHeaderConfig()!.title"
            [subtitle]="computedHeaderConfig()!.subtitle"
            [showBackButton]="computedHeaderConfig()!.showBackButton ?? false"
            [showCloseButton]="computedHeaderConfig()!.showCloseButton ?? true"
            [wrapTitle]="true"
            (backClick)="onBackClick()"
            (closeClick)="onCloseClick()"
          />
        </div>
      }

      <!-- Dynamic content -->
      <div
        class="ds-modal-sheet-content"
        [ngClass]="[
          entry().config.contentClass ?? 'p-ds-xl',
          entry().config.scrollableContent !== false
            ? 'overflow-y-auto'
            : 'overflow-auto',
        ]"
      >
        <ng-container #contentContainer />
      </div>

      <!-- Footer -->
      @if (computedFooterConfig()) {
        <div class="ds-modal-sheet-footer">
          <ds-modal-footer
            [primaryButton]="computedPrimaryButton()"
            [secondaryButton]="computedSecondaryButton()"
            [buttonSize]="computedFooterConfig()!.buttonSize ?? 'lg'"
            [forceFullWidthButtons]="
              computedFooterConfig()!.fullWidthButtons ?? true
            "
            [stackButtons]="computedFooterConfig()!.stackButtons ?? false"
            modalSize="lg"
            (primaryClick)="onPrimaryClick()"
            (secondaryClick)="onSecondaryClick()"
          />
        </div>
      }
    </div>
  `,
})
export class ModalSheetItemComponent implements OnInit, OnDestroy {
  readonly entry = input.required<ModalSheetEntry>();

  @ViewChild('contentContainer', { read: ViewContainerRef, static: true })
  private contentContainer!: ViewContainerRef;

  @ViewChild('headerContainer', { read: ViewContainerRef })
  private headerContainer?: ViewContainerRef;

  private contentRef: ComponentRef<unknown> | null = null;
  private headerRef: ComponentRef<unknown> | null = null;
  private readonly injector = inject(Injector);

  // Internal signals for button states
  private readonly primaryDisabled = signal(false);
  private readonly primaryLoading = signal(false);
  private readonly secondaryDisabled = signal(false);
  private readonly secondaryLoading = signal(false);

  // Internal signals for dynamic header/footer
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
    const inputComponent = this.entry().config.headerComponent;
    if (inputComponent) return inputComponent;
    if (this.hasDynamicConfig()) {
      return this.dynamicHeaderComponent();
    }
    return undefined;
  });

  protected readonly computedHeaderComponentProps = computed<
    Record<string, unknown> | undefined
  >(() => {
    const inputProps = this.entry().config.headerComponentProps;
    if (this.entry().config.headerComponent) return inputProps;
    if (this.hasDynamicConfig()) {
      return this.dynamicHeaderComponentProps();
    }
    return inputProps;
  });

  protected readonly computedHeaderConfig = computed<
    DsModalHeaderConfig | undefined
  >(() => {
    const inputHeader = this.entry().config.headerConfig;
    if (inputHeader) return inputHeader;
    if (this.hasDynamicConfig()) {
      return this.dynamicHeaderConfig();
    }
    return inputHeader;
  });

  protected readonly computedFooterConfig = computed<
    DsModalFooterConfig | undefined
  >(() => {
    const inputFooter = this.entry().config.footerConfig;
    const config = inputFooter
      ? inputFooter
      : this.hasDynamicConfig()
        ? this.dynamicFooterConfig()
        : inputFooter;
    return config;
  });

  protected readonly computedPrimaryButton = computed(() => {
    const config = this.computedFooterConfig();
    if (!config?.primaryButton) return undefined;
    return {
      ...config.primaryButton,
      disabled: config.primaryButton.disabled || this.primaryDisabled(),
      loading: config.primaryButton.loading || this.primaryLoading(),
    };
  });

  protected readonly computedSecondaryButton = computed(() => {
    const config = this.computedFooterConfig();
    if (!config?.secondaryButton) return undefined;
    return {
      ...config.secondaryButton,
      disabled: config.secondaryButton.disabled || this.secondaryDisabled(),
      loading: config.secondaryButton.loading || this.secondaryLoading(),
    };
  });

  constructor() {
    effect(() => {
      const component = this.computedHeaderComponent();
      const props = this.computedHeaderComponentProps();
      if (component && this.headerContainer) {
        this.createHeaderComponent(component, props);
      }
    });
  }

  ngOnInit(): void {
    this.createContentComponent();
  }

  ngOnDestroy(): void {
    this.headerRef?.destroy();
    this.contentRef?.destroy();
  }

  private createContentComponent(): void {
    const entry = this.entry();
    const component = entry.config.component;
    if (!component) return;

    this.contentContainer.clear();

    this.contentRef = this.contentContainer.createComponent(component, {
      injector: this.injector,
    });

    const instance = this.contentRef.instance as DsModalContentComponent;

    // Pass props
    const props = entry.config.componentProps ?? {};
    Object.entries(props).forEach(([key, value]) => {
      this.contentRef!.setInput(key, value);
    });

    // Provide closeModal function
    instance.closeModal = (data?: unknown, role?: string) => {
      entry.dismissFn(data, role ?? 'close');
    };

    this.contentRef.changeDetectorRef.detectChanges();

    this.setupButtonStateEffects(instance);
    this.setupDynamicConfigEffects(instance);
  }

  private setupButtonStateEffects(instance: DsModalContentComponent): void {
    if (instance.primaryButtonDisabled) {
      const s = instance.primaryButtonDisabled;
      effect(() => this.primaryDisabled.set(s()), {
        injector: this.injector,
      });
    }
    if (instance.primaryButtonLoading) {
      const s = instance.primaryButtonLoading;
      effect(() => this.primaryLoading.set(s()), {
        injector: this.injector,
      });
    }
    if (instance.secondaryButtonDisabled) {
      const s = instance.secondaryButtonDisabled;
      effect(() => this.secondaryDisabled.set(s()), {
        injector: this.injector,
      });
    }
    if (instance.secondaryButtonLoading) {
      const s = instance.secondaryButtonLoading;
      effect(() => this.secondaryLoading.set(s()), {
        injector: this.injector,
      });
    }
  }

  private createHeaderComponent(
    component: Type<unknown>,
    props?: Record<string, unknown>,
  ): void {
    if (!this.headerContainer) return;

    this.headerRef?.destroy();
    this.headerContainer.clear();

    this.headerRef = this.headerContainer.createComponent(component, {
      injector: this.injector,
    });

    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        this.headerRef!.setInput(key, value);
      });
    }

    const instance = this.headerRef.instance as Record<string, unknown>;
    instance['closeModal'] = (data?: unknown, role?: string) => {
      this.entry().dismissFn(data, role ?? 'close');
    };

    this.headerRef.changeDetectorRef.detectChanges();
  }

  private setupDynamicConfigEffects(instance: DsModalContentComponent): void {
    if (
      instance.headerConfig ||
      instance.headerComponent ||
      instance.footerConfig
    ) {
      this.hasDynamicConfig.set(true);
      if (instance.headerConfig) {
        const s = instance.headerConfig;
        effect(() => this.dynamicHeaderConfig.set(s()), {
          injector: this.injector,
        });
      }
      if (instance.headerComponent) {
        const s = instance.headerComponent;
        effect(() => this.dynamicHeaderComponent.set(s()), {
          injector: this.injector,
        });
      }
      if (instance.headerComponentProps) {
        const s = instance.headerComponentProps;
        effect(() => this.dynamicHeaderComponentProps.set(s()), {
          injector: this.injector,
        });
      }
      if (instance.footerConfig) {
        const s = instance.footerConfig;
        effect(() => this.dynamicFooterConfig.set(s()), {
          injector: this.injector,
        });
      }
    }
  }

  onBackClick(): void {
    const instance = this.contentRef?.instance as DsModalContentComponent;
    if (instance?.onBackClick) {
      instance.onBackClick();
    } else {
      this.entry().dismissFn(undefined, 'back');
    }
  }

  onCloseClick(): void {
    const instance = this.contentRef?.instance as DsModalContentComponent;
    if (instance?.onCloseClick) {
      instance.onCloseClick();
    } else if (this.entry().config.onCloseIntercept) {
      this.entry().config.onCloseIntercept!();
    } else {
      this.entry().dismissFn(undefined, 'close');
    }
  }

  onPrimaryClick(): void {
    const instance = this.contentRef?.instance as DsModalContentComponent;
    if (instance?.onPrimaryClick) {
      instance.onPrimaryClick();
    } else {
      this.entry().dismissFn(undefined, 'confirm');
    }
  }

  onSecondaryClick(): void {
    const instance = this.contentRef?.instance as DsModalContentComponent;
    if (instance?.onSecondaryClick) {
      instance.onSecondaryClick();
    } else {
      this.entry().dismissFn(undefined, 'cancel');
    }
  }
}
