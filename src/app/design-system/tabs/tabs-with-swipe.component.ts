import { CommonModule, NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  HostListener,
  input,
  OnDestroy,
  output,
  signal,
  TemplateRef,
  Type,
  ViewChild,
} from '@angular/core';
import { isRtl } from '@shared/utils/platform';
import { DsTabsComponent, Tab } from './tabs.component';

/**
 * Direction of the swipe/transition animation
 */
type SwipeDirection = 'left' | 'right' | 'none';

/**
 * Integrated tabs component with built-in swipe animations and skeleton loading.
 * This is a plug-and-play component that handles all animation logic internally.
 *
 * @example
 * // Option 1: Pass skeleton component directly (simplest)
 * ```html
 * <ds-tabs-with-swipe
 *   [tabs]="tabsData"
 *   [(activeTabId)]="activeTab"
 *   [skeletonComponent]="MySkeletonComponent"
 *   (tabChange)="onTabChanged($event)"
 * >
 *   <ng-template #content let-tabId>
 *     <!-- Your content here -->
 *   </ng-template>
 * </ds-tabs-with-swipe>
 * ```
 *
 * @example
 * // Option 2: Use skeleton template for more control
 * ```html
 * <ds-tabs-with-swipe [tabs]="tabsData" [(activeTabId)]="activeTab">
 *   <ng-template #skeleton>
 *     <app-my-skeleton />
 *   </ng-template>
 *   <ng-template #content let-tabId>
 *     <!-- Your content here -->
 *   </ng-template>
 * </ds-tabs-with-swipe>
 * ```
 */
@Component({
  selector: 'ds-tabs-with-swipe',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet, DsTabsComponent],
  template: `
    <!-- Tabs Header -->
    <app-ds-tabs
      [tabs]="tabs()"
      [activeTabId]="_activeTabId()"
      [variant]="variant()"
      [scrollable]="scrollable()"
      [showNavigationArrows]="showNavigationArrows()"
      (tabChange)="onTabClicked($event)"
    />

    <!-- Swipeable Content Area -->
    <div
      #container
      class="relative w-full touch-pan-y overflow-hidden"
      [class]="contentClass()"
      [style.user-select]="isDragging() ? 'none' : 'auto'"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd()"
      (touchcancel)="onTouchCancel()"
      (mousedown)="onMouseDown($event)"
    >
      <!-- Current content panel -->
      <div
        class="w-full will-change-transform"
        [class.swipe-transition]="
          isAnimatingOut() && !isDragging() && !isProgrammaticStart()
        "
        [style.transform]="contentTransform()"
      >
        @if (!showSkeleton() && !isLoading()) {
          <ng-container
            *ngTemplateOutlet="
              contentTemplate();
              context: { $implicit: _activeTabId() }
            "
          ></ng-container>
        } @else {
          <ng-container *ngTemplateOutlet="resolvedSkeleton()"></ng-container>
        }
      </div>

      <!-- Incoming content panel (skeleton during swipe) -->
      @if (isDragging() || isAnimatingOut()) {
        <div
          class="absolute top-0 w-full will-change-transform"
          [class.swipe-transition]="
            isAnimatingOut() && !isDragging() && !isProgrammaticStart()
          "
          [style.transform]="incomingTransform()"
        >
          <ng-container *ngTemplateOutlet="resolvedSkeleton()"></ng-container>
        </div>
      }
    </div>

    <!-- Component-based skeleton template (when skeletonComponent input is used) -->
    <ng-template #componentSkeleton>
      @if (skeletonComponent()) {
        <ng-container *ngComponentOutlet="skeletonComponent()!" />
      }
    </ng-template>

    <!-- Default skeleton template -->
    <ng-template #defaultSkeleton>
      <div class="animate-pulse space-y-4 p-4">
        <div class="h-6 w-3/4 rounded bg-gray-200"></div>
        <div class="space-y-2">
          <div class="h-4 w-full rounded bg-gray-200"></div>
          <div class="h-4 w-5/6 rounded bg-gray-200"></div>
          <div class="h-4 w-4/6 rounded bg-gray-200"></div>
        </div>
        <div class="h-24 w-full rounded bg-gray-200"></div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .swipe-transition {
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .touch-pan-y {
        touch-action: pan-y;
      }
    `,
  ],
})
export class DsTabsWithSwipeComponent<T = string> implements OnDestroy {
  // Tabs configuration
  tabs = input.required<Tab<T>[]>();
  activeTabId = input<T>();
  variant = input<'primary' | 'secondary'>('primary');
  scrollable = input<'auto' | boolean>('auto');
  showNavigationArrows = input<boolean>(true);

  // Swipe configuration
  swipeThreshold = input<number>(0.2);
  minSwipeDistance = input<number>(30);
  minSkeletonDuration = input<number>(500);
  isLoading = input<boolean>(false);
  contentClass = input<string>('');

  // Optional skeleton component - pass a component type directly instead of using ng-template
  skeletonComponent = input<Type<unknown>>();

  // Outputs
  tabChange = output<T>();
  activeTabIdChange = output<T>(); // For two-way binding

  // Content templates
  contentTemplate =
    contentChild.required<TemplateRef<{ $implicit: T }>>('content');
  skeletonTemplate = contentChild<TemplateRef<unknown>>('skeleton');

  @ViewChild('container') containerEl!: ElementRef<HTMLDivElement>;
  @ViewChild('componentSkeleton', { static: true })
  componentSkeletonTemplate!: TemplateRef<unknown>;
  @ViewChild('defaultSkeleton', { static: true })
  defaultSkeletonTemplate!: TemplateRef<unknown>;

  // Resolved skeleton template - prioritizes: skeletonTemplate > skeletonComponent > default
  resolvedSkeleton = computed(() => {
    const template = this.skeletonTemplate();
    if (template) return template;
    if (this.skeletonComponent()) return this.componentSkeletonTemplate;
    return this.defaultSkeletonTemplate;
  });

  // Internal state
  _activeTabId = signal<T | undefined>(undefined);
  private _activeTabIndex = signal<number>(0);
  isDragging = signal(false);
  isAnimatingOut = signal(false);
  showSkeleton = signal(false);
  dragOffset = signal(0);
  swipeDirection = signal<SwipeDirection>('none');
  isProgrammaticStart = signal(false);

  private isRtl = isRtl();
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private containerWidth = 0;
  private hasMoved = false;
  private isHorizontalSwipe: boolean | null = null;
  private skeletonTimer: ReturnType<typeof setTimeout> | null = null;
  private animationTimer: ReturnType<typeof setTimeout> | null = null;

  // Computed: Can swipe to next tab
  private canSwipeNext = computed(() => {
    const total = this.tabs().length;
    return this._activeTabIndex() < total - 1;
  });

  // Computed: Can swipe to previous tab
  private canSwipePrevious = computed(() => {
    return this._activeTabIndex() > 0;
  });

  constructor() {
    // Sync internal state with activeTabId input reactively
    effect(() => {
      const inputTabId = this.activeTabId();
      const tabs = this.tabs();

      if (inputTabId !== undefined) {
        this._activeTabId.set(inputTabId);
        const index = tabs.findIndex((t) => t.id === inputTabId);
        this._activeTabIndex.set(index >= 0 ? index : 0);
      } else if (tabs.length > 0 && this._activeTabId() === undefined) {
        this._activeTabId.set(tabs[0].id);
        this._activeTabIndex.set(0);
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // Handle tab click from header
  onTabClicked(tabId: T): void {
    const newIndex = this.tabs().findIndex((t) => t.id === tabId);
    const currentIndex = this._activeTabIndex();

    if (newIndex === currentIndex || newIndex === -1) return;

    // Trigger animation
    this.containerWidth =
      this.containerEl?.nativeElement?.offsetWidth || window.innerWidth;

    if (newIndex > currentIndex) {
      const direction: SwipeDirection = this.isRtl ? 'right' : 'left';
      this.animateTransition(direction, tabId, newIndex);
    } else {
      const direction: SwipeDirection = this.isRtl ? 'left' : 'right';
      this.animateTransition(direction, tabId, newIndex);
    }
  }

  // Computed transforms
  contentTransform = () => {
    const offset = this.dragOffset();

    if (this.isProgrammaticStart()) {
      return 'translate3d(0, 0, 0)';
    }

    if (this.isAnimatingOut() && !this.isDragging()) {
      const direction = this.swipeDirection();
      if (direction === 'left') {
        return 'translate3d(-100%, 0, 0)';
      } else if (direction === 'right') {
        return 'translate3d(100%, 0, 0)';
      }
    }

    return `translate3d(${offset}px, 0, 0)`;
  };

  incomingTransform = () => {
    const offset = this.dragOffset();
    const containerWidth = this.containerWidth || 300;
    const direction = this.swipeDirection();

    if (this.isProgrammaticStart()) {
      if (direction === 'left') {
        return 'translate3d(100%, 0, 0)';
      } else if (direction === 'right') {
        return 'translate3d(-100%, 0, 0)';
      }
    }

    if (this.isAnimatingOut() && !this.isDragging()) {
      return 'translate3d(0, 0, 0)';
    }

    if (offset < 0) {
      return `translate3d(${containerWidth + offset}px, 0, 0)`;
    } else if (offset > 0) {
      return `translate3d(${-containerWidth + offset}px, 0, 0)`;
    }

    if (direction === 'left') {
      return 'translate3d(100%, 0, 0)';
    } else if (direction === 'right') {
      return 'translate3d(-100%, 0, 0)';
    }

    return 'translate3d(100%, 0, 0)';
  };

  // Touch events
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.startDrag(event.touches[0].clientX, event.touches[0].clientY);
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging() || event.touches.length !== 1) return;

    const clientX = event.touches[0].clientX;
    const clientY = event.touches[0].clientY;

    if (this.isHorizontalSwipe === null) {
      const deltaX = Math.abs(clientX - this.startX);
      const deltaY = Math.abs(clientY - this.startY);

      if (deltaX > 10 || deltaY > 10) {
        this.isHorizontalSwipe = deltaX > deltaY;
      }
    }

    if (this.isHorizontalSwipe) {
      event.preventDefault();
      this.updateDrag(clientX, clientY);
    }
  }

  onTouchEnd(): void {
    if (this.isDragging()) {
      this.endDrag();
    }
  }

  onTouchCancel(): void {
    if (this.isDragging()) {
      this.cancelDrag();
    }
  }

  // Mouse events
  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (this.isDragging()) {
      event.preventDefault();
      this.updateDrag(event.clientX, event.clientY);
    }
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    if (this.isDragging()) {
      this.endDrag();
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      event.preventDefault();
      this.startDrag(event.clientX, event.clientY);
    }
  }

  private startDrag(clientX: number, clientY: number): void {
    if (this.isAnimatingOut() || this.showSkeleton()) return;

    this.isDragging.set(true);
    this.startX = clientX;
    this.startY = clientY;
    this.currentX = clientX;
    this.hasMoved = false;
    this.isHorizontalSwipe = null;
    this.containerWidth =
      this.containerEl?.nativeElement?.offsetWidth || window.innerWidth;
    this.dragOffset.set(0);
    this.swipeDirection.set('none');
  }

  private updateDrag(clientX: number, clientY: number): void {
    if (!this.isDragging()) return;

    this.currentX = clientX;
    const deltaX = this.currentX - this.startX;
    const deltaY = clientY - this.startY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
      this.hasMoved = true;

      let allowedDelta = deltaX;
      const isSwipingToNext = this.isRtl ? deltaX > 0 : deltaX < 0;
      const isSwipingToPrevious = this.isRtl ? deltaX < 0 : deltaX > 0;

      if (isSwipingToNext && !this.canSwipeNext()) {
        allowedDelta = deltaX * 0.15;
      } else if (isSwipingToPrevious && !this.canSwipePrevious()) {
        allowedDelta = deltaX * 0.15;
      } else {
        allowedDelta = deltaX * 0.6;
      }

      this.dragOffset.set(allowedDelta);
    }
  }

  private endDrag(): void {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    this.isHorizontalSwipe = null;

    if (this.hasMoved) {
      const deltaX = this.currentX - this.startX;
      const swipeDistance = Math.abs(deltaX);
      const swipePercentage =
        this.containerWidth > 0 ? swipeDistance / this.containerWidth : 0;
      const shouldChangeTab =
        swipeDistance > this.minSwipeDistance() &&
        swipePercentage > this.swipeThreshold();

      if (shouldChangeTab) {
        let direction: SwipeDirection = 'none';
        let isNext = false;

        if (this.isRtl) {
          if (deltaX > 0) {
            direction = 'right';
            isNext = true;
          } else {
            direction = 'left';
            isNext = false;
          }
        } else {
          if (deltaX < 0) {
            direction = 'left';
            isNext = true;
          } else {
            direction = 'right';
            isNext = false;
          }
        }

        const canSwipe = isNext ? this.canSwipeNext() : this.canSwipePrevious();

        if (canSwipe) {
          const currentIndex = this._activeTabIndex();
          const newIndex = isNext ? currentIndex + 1 : currentIndex - 1;
          const newTab = this.tabs()[newIndex];
          this.animateTransition(direction, newTab.id, newIndex);
        } else {
          this.dragOffset.set(0);
        }
      } else {
        this.dragOffset.set(0);
      }
    }

    this.hasMoved = false;
  }

  private cancelDrag(): void {
    this.isDragging.set(false);
    this.hasMoved = false;
    this.isHorizontalSwipe = null;
    this.dragOffset.set(0);
  }

  private animateTransition(
    direction: SwipeDirection,
    newTabId: T,
    newIndex: number,
  ): void {
    this.swipeDirection.set(direction);
    this.dragOffset.set(0);
    this.isProgrammaticStart.set(true);
    this.isAnimatingOut.set(true);

    const startTime = Date.now();

    requestAnimationFrame(() => {
      this.isProgrammaticStart.set(false);

      this.animationTimer = setTimeout(() => {
        // Update tab state
        this._activeTabId.set(newTabId);
        this._activeTabIndex.set(newIndex);
        this.tabChange.emit(newTabId);
        this.activeTabIdChange.emit(newTabId);

        this.showSkeleton.set(true);
        this.isAnimatingOut.set(false);
        this.swipeDirection.set('none');

        const checkComplete = () => {
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(
            0,
            this.minSkeletonDuration() - elapsed,
          );

          if (remainingTime > 0 || this.isLoading()) {
            this.skeletonTimer = setTimeout(checkComplete, 50);
          } else {
            this.showSkeleton.set(false);
          }
        };

        checkComplete();
      }, 300);
    });
  }

  private cleanup(): void {
    if (this.skeletonTimer) {
      clearTimeout(this.skeletonTimer);
      this.skeletonTimer = null;
    }
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
  }
}
