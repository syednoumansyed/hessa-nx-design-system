import {
  Component,
  ComponentRef,
  effect,
  inject,
  Injector,
  input,
  OnDestroy,
  output,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { DsModalHeaderComponent } from './modal-header.component';
import {
  DsModalFooterComponent,
  DsModalFooterButton,
  DsButtonSize,
} from './modal-footer.component';
import { DsModalSize } from './modal.types';

export interface DsModalHeaderConfig {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showCloseButton?: boolean;
}

export interface DsModalFooterConfig {
  primaryButton?: DsModalFooterButton;
  secondaryButton?: DsModalFooterButton;
  buttonSize?: DsButtonSize;
  fullWidthButtons?: boolean;
  /** Stack buttons vertically (primary on top). Useful when button labels are long. */
  stackButtons?: boolean;
}

/**
 * @ai-hint
 * component: DsModalComponent
 * selector: ds-modal
 * intent: Structured modal shell with optional header, scrollable content area, and footer action buttons; used as the inner content component inside IonModal or DsModalService overlays
 * do: Pass headerConfig for a standard title/close-button header; pass footerConfig for primary/secondary action buttons; use scrollableContent=true when body content may overflow
 * dont: Don't use this component standalone without wrapping it in an IonModal or DsModalService call — it provides layout only, not the overlay backdrop; don't pass both headerConfig and headerComponent simultaneously
 * device: Respects iOS safe-area-inset-top via respectTopSafeArea input; touch events on the scroll region are stopped from propagating to the underlying backdrop
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Title and button layout inherit host direction; close/back icons are rendered by DsModalHeaderComponent which handles RTL
 * alternatives: DsSidebarComponent for side-panel layouts; DsModalSheetContainerComponent for bottom-sheet patterns
 */
@Component({
  selector: 'ds-modal',
  standalone: true,
  imports: [NgClass, DsModalHeaderComponent, DsModalFooterComponent],
  template: `
    <div
      class="flex flex-col"
      [class.h-full]="!scrollableContent()"
      [class.ds-modal-inner]="scrollableContent()"
      [ngClass]="{
        'pt-[max(env(safe-area-inset-top),18px)]': respectTopSafeArea(),
      }"
    >
      @if (headerComponent()) {
        <div
          class="flex-shrink-0 border-b px-ds-xl py-ds-lg"
          [ngClass]="headerClass()"
        >
          <ng-container #headerContainer />
        </div>
      } @else if (headerConfig()) {
        <div
          class="flex-shrink-0 border-b px-ds-xl py-ds-lg"
          [ngClass]="headerClass()"
        >
          <ds-modal-header
            [title]="headerConfig()!.title"
            [subtitle]="headerConfig()!.subtitle"
            [showBackButton]="headerConfig()!.showBackButton ?? false"
            [showCloseButton]="headerConfig()!.showCloseButton ?? true"
            (backClick)="backClick.emit()"
            (closeClick)="closeClick.emit()"
          />
        </div>
      }

      <div
        class="ds-modal-scroll-region"
        [ngClass]="[
          contentClass(),
          scrollableContent()
            ? 'min-h-0 flex-1 overflow-y-auto'
            : 'flex-1 overflow-auto',
        ]"
        (touchstart)="$event.stopPropagation()"
        (touchmove)="$event.stopPropagation()"
      >
        <ng-content />
      </div>

      @if (footerConfig()) {
        <div
          class="flex-shrink-0 border-t px-ds-xl py-ds-lg"
          [ngClass]="footerClass()"
        >
          <ds-modal-footer
            [primaryButton]="footerConfig()!.primaryButton"
            [secondaryButton]="footerConfig()!.secondaryButton"
            [buttonSize]="footerConfig()!.buttonSize ?? 'md'"
            [forceFullWidthButtons]="footerConfig()!.fullWidthButtons ?? false"
            [stackButtons]="footerConfig()!.stackButtons ?? false"
            [modalSize]="modalSize()"
            (primaryClick)="primaryClick.emit()"
            (secondaryClick)="secondaryClick.emit()"
          />
        </div>
      }
    </div>
  `,
})
export class DsModalComponent implements OnDestroy {
  private readonly injector = inject(Injector);

  readonly headerConfig = input<DsModalHeaderConfig>();
  readonly headerComponent = input<Type<unknown>>();
  readonly headerComponentProps = input<Record<string, unknown>>();
  readonly dismissFn = input<(data?: unknown, role?: string) => void>();
  readonly footerConfig = input<DsModalFooterConfig>();
  readonly modalSize = input<DsModalSize>('lg');
  readonly headerClass = input<string>('');
  readonly contentClass = input<string>('p-6');
  readonly footerClass = input<string>('');
  readonly respectTopSafeArea = input<boolean>(false);
  readonly scrollableContent = input<boolean>(false);

  readonly backClick = output<void>();
  readonly closeClick = output<void>();
  readonly primaryClick = output<void>();
  readonly secondaryClick = output<void>();

  @ViewChild('headerContainer', { read: ViewContainerRef })
  private headerContainer?: ViewContainerRef;

  private headerRef: ComponentRef<unknown> | null = null;

  constructor() {
    effect(() => {
      const component = this.headerComponent();
      const props = this.headerComponentProps();
      if (component && this.headerContainer) {
        this.createHeaderComponent(component, props);
      }
    });
  }

  ngOnDestroy(): void {
    this.headerRef?.destroy();
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
    const dismissFn = this.dismissFn();
    if (dismissFn) {
      instance['closeModal'] = (data?: unknown, role?: string) => {
        dismissFn(data, role ?? 'close');
      };
    }

    this.headerRef.changeDetectorRef.detectChanges();
  }
}
