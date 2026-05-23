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
import { DsModalHeaderComponent } from '../modal/modal-header.component';
import { DsModalFooterComponent } from '../modal/modal-footer.component';
import {
  DsModalHeaderConfig,
  DsModalFooterConfig,
} from '../modal/modal.component';

/**
 * @ai-hint
 * component: DsSidebarComponent
 * selector: ds-sidebar
 * intent: Structured side-panel shell with optional header, scrollable content area, and footer action buttons; mirrors DsModalComponent API but is designed for slide-in panel contexts
 * do: Pass headerConfig for a standard title/close-button header; pass footerConfig for primary/secondary action buttons; the content area scrolls by default (scrollableContent defaults to true unlike DsModalComponent); use contentClass to override the default p-ds-xl padding
 * dont: Don't use this as a standalone page container — it is designed to be placed inside a sidebar/drawer overlay; don't pass both headerConfig and headerComponent simultaneously
 * device: No structural device differences; safe-area handling is left to the wrapping overlay
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Header and footer button layout inherit host direction via DsModalHeaderComponent and DsModalFooterComponent
 * alternatives: DsModalComponent for centered dialog overlays; DsModalSheetContainerComponent for bottom-sheet patterns
 */
@Component({
  selector: 'ds-sidebar',
  standalone: true,
  imports: [NgClass, DsModalHeaderComponent, DsModalFooterComponent],
  host: { class: 'flex-1 min-h-0 flex flex-col' },
  template: `
    <div class="ds-sidebar-inner flex h-full flex-col">
      @if (headerComponent()) {
        <div class="flex-shrink-0 border-b px-ds-xl py-ds-lg">
          <ng-container #headerContainer />
        </div>
      } @else if (headerConfig()) {
        <div class="flex-shrink-0 border-b px-ds-xl py-ds-lg">
          <ds-modal-header
            [title]="headerConfig()!.title"
            [subtitle]="headerConfig()!.subtitle"
            [showBackButton]="headerConfig()!.showBackButton ?? false"
            [showCloseButton]="headerConfig()!.showCloseButton ?? true"
            [wrapTitle]="true"
            (backClick)="backClick.emit()"
            (closeClick)="closeClick.emit()"
          />
        </div>
      }

      <div
        class="min-h-0 flex-1"
        [ngClass]="[
          contentClass(),
          scrollableContent() ? 'overflow-y-auto' : 'overflow-auto',
        ]"
      >
        <ng-content />
      </div>

      @if (footerConfig()) {
        <div class="flex-shrink-0 border-t px-ds-xl py-ds-lg">
          <ds-modal-footer
            [primaryButton]="footerConfig()!.primaryButton"
            [secondaryButton]="footerConfig()!.secondaryButton"
            [buttonSize]="footerConfig()!.buttonSize ?? 'md'"
            [forceFullWidthButtons]="footerConfig()!.fullWidthButtons ?? true"
            modalSize="lg"
            (primaryClick)="primaryClick.emit()"
            (secondaryClick)="secondaryClick.emit()"
          />
        </div>
      }
    </div>
  `,
})
export class DsSidebarComponent implements OnDestroy {
  private readonly injector = inject(Injector);

  readonly headerConfig = input<DsModalHeaderConfig>();
  readonly headerComponent = input<Type<unknown>>();
  readonly headerComponentProps = input<Record<string, unknown>>();
  readonly dismissFn = input<(data?: unknown, role?: string) => void>();
  readonly footerConfig = input<DsModalFooterConfig>();
  readonly contentClass = input<string>('p-ds-xl');
  readonly scrollableContent = input<boolean>(true);

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
