import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  AfterViewInit,
  input,
  signal,
  computed,
  output,
  ViewChild,
  ViewChildren,
  ElementRef,
  QueryList,
} from '@angular/core';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import { isMobile, isRtl } from '@shared/utils/platform';

export interface Tab<T = any> {
  id: T;
  label: string;
  badge?: number | string;
  disabled?: boolean;
}

/**
 * @ai-hint
 * component: DsTabsComponent
 * selector: app-ds-tabs
 * intent: Horizontal tab bar for switching between content sections; supports scrollable overflow with left/right navigation arrows
 * do: Pass a typed tabs array with unique id values; bind activeTabId to control the active tab externally; listen to tabChange output to update content; use variant="secondary" for nested tab contexts
 * dont: Don't use for page-level routing (use Angular router); don't put more than 7 tabs without enabling scrollable mode
 * device: isMobile and isRtl are both read at init; on mobile, swipe gestures are handled by DsTabsWithSwipeComponent (sibling); arrow buttons are rendered only when needsScrolling is true
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Full RTL support — scrollLeft arithmetic is sign-inverted for RTL; arrow click directions are RTL-aware; ResizeObserver recalculates on layout change
 * alternatives: DsTabsWithSwipeComponent for mobile swipe-enabled tabs; DsSegmentedControlComponent for 2-3 option toggle
 */
@Component({
  selector: 'app-ds-tabs',
  standalone: true,
  templateUrl: './tabs.component.html',
  imports: [CommonModule, DsTranslatePipe, DsIconComponent],
})
export class DsTabsComponent<T = any>
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  // Inputs
  tabs = input<Tab<T>[]>([]);
  activeTabId = input<T>();
  scrollable = input<'auto' | boolean>('auto');
  showNavigationArrows = input<boolean>(true);
  variant = input<'primary' | 'secondary'>('primary');

  // Outputs
  tabChange = output<T>();

  // View references
  @ViewChild('tabsContainer') tabsContainer!: ElementRef<HTMLDivElement>;
  @ViewChildren('tabElement') tabElements!: QueryList<
    ElementRef<HTMLDivElement>
  >;

  // Platform detection
  isMobile = isMobile();
  isRtl = isRtl();

  // FontAwesome icons
  protected readonly faAngleLeft = faChevronLeft;
  protected readonly faAngleRight = faChevronRight;

  _activeTabId = signal<T | undefined>(undefined);
  activeTabIndex = signal<number>(0);

  // Scrollable state
  needsScrolling = signal<boolean>(false);
  private scrollPosition = signal<number>(0);
  private maxScrollPosition = signal<number>(0);
  private resizeObserver?: ResizeObserver;

  // Computed: Can scroll left (RTL-aware)
  // In LTR: left arrow shows when scrolled away from start (pos > 0)
  // In RTL: left arrow shows when there's more content to the left (not at max)
  canScrollLeft = computed(() => {
    if (!this.needsScrolling() || !this.showNavigationArrows()) return false;
    const pos = this.scrollPosition();
    // For LTR: show left arrow when scrolled right (pos > 0)
    // For RTL: show left arrow when pos > 0 (scrolled away from start, more content to left)
    return pos > 1;
  });

  // Computed: Can scroll right (RTL-aware)
  // In LTR: right arrow shows when there's more content to the right (pos < max)
  // In RTL: right arrow shows when not at max scroll (can scroll back to start)
  canScrollRight = computed(() => {
    if (!this.needsScrolling() || !this.showNavigationArrows()) return false;
    const pos = this.scrollPosition();
    const max = this.maxScrollPosition();
    // For both LTR and RTL: show right arrow when not at max scroll
    return pos < max - 1;
  });

  ngOnInit() {
    if (this.tabs().length > 0 && !this.activeTabId()) {
      this._activeTabId.set(this.tabs()[0].id);
    } else {
      this._activeTabId.set(this.activeTabId());
    }
    this.updateActiveTabIndex();
  }

  ngAfterViewInit() {
    // Use setTimeout to ensure DOM is fully rendered before measuring
    setTimeout(() => {
      this.checkOverflow();
      this.setupResizeObserver();
    }, 0);
  }

  ngOnChanges() {
    this._activeTabId.set(this.activeTabId());
    this.updateActiveTabIndex();
    // Scroll active tab into view when it changes
    setTimeout(() => {
      this.scrollActiveTabIntoView();
    }, 0);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  onTabClick(tab: Tab<T>, index: number) {
    if (tab.disabled) return;

    this._activeTabId.set(tab.id);
    this.activeTabIndex.set(index);
    this.tabChange.emit(tab.id);
    // Scroll active tab into view
    setTimeout(() => {
      this.scrollActiveTabIntoView();
    }, 0);
  }

  // Scroll the tabs container left (visually to the left)
  // In LTR: scrolls towards start (decrease scrollLeft)
  // In RTL: scrolls towards end (increase scrollLeft towards 0)
  scrollLeft(): void {
    const container = this.tabsContainer?.nativeElement;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.5;

    if (this.isRtl) {
      // RTL: scrollLeft is negative, moving towards 0 means scrolling left visually
      const newPosition = container.scrollLeft + scrollAmount;
      container.scrollTo({
        left: Math.min(0, newPosition),
        behavior: 'smooth',
      });
    } else {
      // LTR: decrease scrollLeft to scroll left
      const newPosition = container.scrollLeft - scrollAmount;
      container.scrollTo({
        left: Math.max(0, newPosition),
        behavior: 'smooth',
      });
    }
  }

  // Scroll the tabs container right (visually to the right)
  // In LTR: scrolls towards end (increase scrollLeft)
  // In RTL: scrolls towards start (decrease scrollLeft, more negative)
  scrollRight(): void {
    const container = this.tabsContainer?.nativeElement;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.5;
    const max = this.maxScrollPosition();

    if (this.isRtl) {
      // RTL: scrollLeft is negative, going more negative means scrolling right visually
      const newPosition = container.scrollLeft - scrollAmount;
      container.scrollTo({
        left: Math.max(-max, newPosition),
        behavior: 'smooth',
      });
    } else {
      // LTR: increase scrollLeft to scroll right
      const newPosition = container.scrollLeft + scrollAmount;
      container.scrollTo({
        left: Math.min(max, newPosition),
        behavior: 'smooth',
      });
    }
  }

  // Navigate to next tab (for swipe directive)
  nextTab(): void {
    const currentIndex = this.activeTabIndex();
    const tabs = this.tabs();
    if (currentIndex < tabs.length - 1) {
      const nextTab = tabs[currentIndex + 1];
      if (!nextTab.disabled) {
        this.onTabClick(nextTab, currentIndex + 1);
      }
    }
  }

  // Navigate to previous tab (for swipe directive)
  previousTab(): void {
    const currentIndex = this.activeTabIndex();
    const tabs = this.tabs();
    if (currentIndex > 0) {
      const prevTab = tabs[currentIndex - 1];
      if (!prevTab.disabled) {
        this.onTabClick(prevTab, currentIndex - 1);
      }
    }
  }

  // Handle scroll events on the tabs container
  onScroll(event: Event): void {
    const container = event.target as HTMLElement;
    this.scrollPosition.set(Math.abs(container.scrollLeft));
  }

  private updateActiveTabIndex() {
    const index = this.tabs().findIndex(
      (tab) => tab.id === this._activeTabId(),
    );
    this.activeTabIndex.set(index === -1 ? 0 : index);
  }

  isTabActive(tabId: T): boolean {
    return this._activeTabId() === tabId;
  }

  // Setup ResizeObserver to detect overflow
  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;

    const container = this.tabsContainer?.nativeElement;
    if (!container) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.checkOverflow();
    });
    this.resizeObserver.observe(container);
  }

  // Check if tabs overflow and need scrolling
  private checkOverflow(): void {
    const container = this.tabsContainer?.nativeElement;
    if (!container) return;

    // Calculate max scroll position
    const maxScroll = Math.max(
      0,
      container.scrollWidth - container.clientWidth,
    );
    this.maxScrollPosition.set(maxScroll);
    this.scrollPosition.set(Math.abs(container.scrollLeft));

    const scrollableInput = this.scrollable();
    if (scrollableInput === 'auto') {
      // Need scrolling if there's any overflow
      const needsScroll = maxScroll > 0;
      this.needsScrolling.set(needsScroll);
    } else {
      this.needsScrolling.set(scrollableInput);
    }
  }

  // Auto-scroll to make active tab visible
  private scrollActiveTabIntoView(): void {
    if (!this.needsScrolling()) return;

    const tabElements = this.tabElements?.toArray();
    const activeIndex = this.activeTabIndex();
    const activeTabEl = tabElements?.[activeIndex]?.nativeElement;
    const container = this.tabsContainer?.nativeElement;

    if (activeTabEl && container) {
      const arrowWidth = 40; // Width of arrow buttons + gap

      // Use scrollIntoView for reliable cross-browser RTL support
      // This handles the complexity of RTL scrolling automatically
      const tabRect = activeTabEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if tab is outside the visible area (accounting for arrow buttons)
      const visibleLeft = containerRect.left + arrowWidth;
      const visibleRight = containerRect.right - arrowWidth;

      if (tabRect.left < visibleLeft || tabRect.right > visibleRight) {
        // Scroll the tab into view
        activeTabEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }
}
