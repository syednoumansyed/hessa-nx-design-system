import { fromEvent, Observable, Subscription } from 'rxjs';
import { delay, takeUntil } from 'rxjs/operators';
import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  ComponentRef,
  Injector,
  input,
  Type,
  createComponent,
} from '@angular/core';
import {
  Overlay,
  OverlayRef,
  OverlayPositionBuilder,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { TemplatePortal, ComponentPortal, Portal } from '@angular/cdk/portal';
import { DsTooltipDefaultComponent } from './ds-tooltip-default.component';
import { DsTooltipPanelComponent } from './ds-tooltip-panel.component';
import { DsIcon } from '@ds/icon/icon.component';

// Tooltip direction type for clarity and DRYness
export type TooltipDirection =
  | 'above'
  | 'below'
  | 'left'
  | 'right'
  | 'above-left'
  | 'above-right';

// Centralized offset for tooltip distance from trigger
const TOOLTIP_OFFSET = 10;
// Centralized position map for both overlay and arrow direction
function getTooltipPositionMap(): Record<TooltipDirection, ConnectedPosition> {
  const isRtl =
    document.dir === 'rtl' || document.documentElement.dir === 'rtl';
  return {
    above: {
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
      offsetY: -TOOLTIP_OFFSET,
    },
    'above-left': {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -TOOLTIP_OFFSET,
    },
    'above-right': {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -TOOLTIP_OFFSET,
    },
    below: {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetY: TOOLTIP_OFFSET,
    },
    right: {
      originX: 'end',
      originY: 'center',
      overlayX: 'start',
      overlayY: 'center',
      offsetX: isRtl ? -TOOLTIP_OFFSET : TOOLTIP_OFFSET,
    },
    left: {
      originX: 'start',
      originY: 'center',
      overlayX: 'end',
      overlayY: 'center',
      offsetX: isRtl ? TOOLTIP_OFFSET : -TOOLTIP_OFFSET,
    },
  };
}

@Directive({
  selector: '[dsTooltip]',
  standalone: true,
})
export class DsTooltipDirective implements OnInit, OnDestroy {
  tooltipTemplate = input<TemplateRef<any> | string | undefined>();
  dsTooltipPosition = input<'auto' | TooltipDirection>('auto');
  dsTooltipTitle = input<string>();
  dsTooltipContent = input<string>();
  dsTooltipFooter = input<string>();
  dsTooltipIcon = input<DsIcon>();
  dsTooltipIconClass = input<string>();
  dsTooltipIconSize = input<string | number>();
  dsTooltipEnabled = input<boolean>(true);

  private overlayRef!: OverlayRef;
  private panelRef?: ComponentRef<DsTooltipPanelComponent>;

  constructor(
    private overlay: Overlay,
    private overlayPositionBuilder: OverlayPositionBuilder,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
  ) {}

  private mouseEnterSub: Subscription;
  private mouseLeaveSub: Subscription;
  private mouseEnter$: Observable<Event>;
  private mouseLeave$: Observable<Event>;

  ngOnInit() {
    const positions: ConnectedPosition[] = this.getPositions();
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlayPositionBuilder
        .flexibleConnectedTo(this.elementRef)
        .withPositions(positions)
        .withViewportMargin(12),
      scrollStrategy: this.overlay.scrollStrategies.close(),
      panelClass: 'ds-tooltip-panel',
    });

    // Observable-based hover with delay
    this.mouseEnter$ = fromEvent(this.elementRef.nativeElement, 'mouseenter');
    this.mouseLeave$ = fromEvent(this.elementRef.nativeElement, 'mouseleave');

    this.subscribeTooltipEvents();
  }

  private subscribeTooltipEvents() {
    if (this.mouseEnterSub) {
      this.mouseEnterSub.unsubscribe();
    }
    if (this.mouseLeaveSub) {
      this.mouseLeaveSub.unsubscribe();
    }
    this.mouseEnterSub = this.mouseEnter$
      .pipe(delay(300), takeUntil(this.mouseLeave$))
      .subscribe(() => this.showTooltip());

    this.mouseLeaveSub = this.mouseLeave$.subscribe(() => {
      this.hideTooltip();
      // Re-subscribe to mouseEnter for next hover
      this.subscribeTooltipEvents();
    });
  }

  ngOnDestroy() {
    this.hideTooltip();
    if (this.mouseEnterSub) {
      this.mouseEnterSub.unsubscribe();
    }
    if (this.mouseLeaveSub) {
      this.mouseLeaveSub.unsubscribe();
    }
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
  }

  showTooltip = () => {
    // Check if tooltip is enabled
    if (!this.dsTooltipEnabled()) return;

    // Always allow showing again after hide
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
      this.panelRef = undefined;
    }

    // Only check for title, content, footer, and template
    const template = this.tooltipTemplate();
    const title = this.dsTooltipTitle();
    const content = this.dsTooltipContent();
    const footer = this.dsTooltipFooter();
    const hasContent =
      template instanceof TemplateRef ||
      (!!title && title.trim() !== '') ||
      (!!content && content.trim() !== '') ||
      (!!footer && footer.trim() !== '');

    if (!hasContent) return; // Do not create tooltip if nothing to show

    // Attach the panel component
    this.panelRef = this.overlayRef.attach(
      new ComponentPortal(
        DsTooltipPanelComponent,
        this.viewContainerRef,
        this.injector,
      ),
    );
    if (!this.panelRef) return;

    // Set initial arrow position
    const position = this.getCurrentPosition();
    this.panelRef.setInput('position', position);
    this.setArrowOffset(position);
    this.subscribeToPositionChanges();

    // Render content
    if (template instanceof TemplateRef) {
      this.panelRef.setInput('contentTemplate', template);
    } else {
      this.panelRef.setInput('componentType', DsTooltipDefaultComponent);
      this.panelRef.setInput('componentInputs', {
        title: title || '',
        content: content || '',
        footer: footer || '',
        icon: this.dsTooltipIcon(),
        iconClass: this.dsTooltipIconClass(),
        iconSize: this.dsTooltipIconSize(),
      });
    }
  };

  private subscribeToPositionChanges() {
    const positionStrategy = this.overlayRef.getConfig().positionStrategy;
    if (positionStrategy && 'positionChanges' in positionStrategy) {
      (positionStrategy.positionChanges as any).subscribe((change: any) => {
        const pos = change.connectionPair;
        const actual = this.mapConnectionPairToDirection(pos);
        if (this.panelRef) {
          this.panelRef.setInput('position', actual);
          this.setArrowOffset(actual);
        }
      });
    }
  }

  private setArrowOffset(position: TooltipDirection) {
    if (!this.panelRef) return;
    const panelEl = this.panelRef.location.nativeElement as HTMLElement;
    const triggerRect = this.elementRef.nativeElement.getBoundingClientRect();
    const panelRect = panelEl.getBoundingClientRect();
    const arrowSize = 12; // match --ds-tooltip-arrow-size
    if (position === 'above-left') {
      // Offset from left edge
      let offset = Math.round(
        triggerRect.left +
          triggerRect.width / 2 -
          panelRect.left -
          arrowSize / 2,
      );
      offset = Math.max(offset, 6);
      panelEl.style.setProperty('--ds-tooltip-arrow-offset', offset + 'px');
    } else if (position === 'above-right') {
      // Offset from right edge
      let offset = Math.round(
        panelRect.right -
          (triggerRect.left + triggerRect.width / 2) -
          arrowSize / 2,
      );
      offset = Math.max(offset, 6);
      panelEl.style.setProperty('--ds-tooltip-arrow-offset', offset + 'px');
    } else {
      panelEl.style.removeProperty('--ds-tooltip-arrow-offset');
    }
  }

  private mapConnectionPairToDirection(pos: any): TooltipDirection {
    const map = getTooltipPositionMap();
    for (const dir of Object.keys(map) as TooltipDirection[]) {
      const m = map[dir];
      if (
        pos.originX === m.originX &&
        pos.originY === m.originY &&
        pos.overlayX === m.overlayX &&
        pos.overlayY === m.overlayY
      ) {
        return dir;
      }
    }
    return 'above';
  }

  hideTooltip = () => {
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
      this.panelRef = undefined;
    }
  };

  // Helper to get the actual position used for the arrow
  private getCurrentPosition(): TooltipDirection {
    const pos = this.dsTooltipPosition();
    if (pos === 'auto') {
      // Overlay will pick the first available, so default to 'above' for arrow
      return 'above';
    }
    return pos;
  }
  private getPositions(): ConnectedPosition[] {
    const position = this.dsTooltipPosition();
    const map = getTooltipPositionMap();
    // Priority order for fallback
    const fallbackOrder: TooltipDirection[] = [
      'above',
      'above-left',
      'above-right',
      'below',
      'right',
      'left',
    ];
    if (position === 'auto') {
      return fallbackOrder.map((dir) => map[dir]);
    }
    // Always try the requested position first, then the rest in fallback order (excluding the requested one)
    const requested = position as TooltipDirection;
    const rest = fallbackOrder.filter((dir) => dir !== requested);
    return [map[requested], ...rest.map((dir) => map[dir])];
  }
}
