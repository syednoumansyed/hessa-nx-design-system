import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  ElementRef,
  OnDestroy,
  ViewContainerRef,
  input,
  output,
  viewChild,
  TemplateRef,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Overlay,
  OverlayRef,
  OverlayPositionBuilder,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ReactionData,
  ReactionType,
  REACTION_CONFIGS,
  ReactionConfig,
} from './types/react.types';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsModalService } from '@ds/modal/modal.service';
import { isMobile } from '@utils/platform';
import { ReactionDetailBottomSheetComponent } from './components/reaction-detail-bottom-sheet/reaction-detail-bottom-sheet.component';
import { DsTooltipDirective } from '@ds/tooltip/ds-tooltip.directive';
import { ReactionDetailTooltipComponent } from './components/reaction-detail-tooltip/reaction-detail-tooltip.component';
import { AuthService } from '@auth/auth.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'ds-react',
  standalone: true,
  imports: [
    CommonModule,
    DsChipComponent,
    DsIconComponent,
    DsTranslatePipe,
    DsTooltipDirective,
    ReactionDetailTooltipComponent,
  ],
  templateUrl: './react.component.html',
  styles: `
    :host ::ng-deep app-ds-chip ng-icon {
      --ng-icon__size: 100% !important;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactionsComponent implements OnDestroy {
  reactions = input<ReactionData[]>([]);
  reactionToggled = output<{
    type: ReactionType;
    isAdding: boolean;
  }>();

  reactButton = viewChild.required<ElementRef>('reactButton');
  overlayTemplate = viewChild.required<TemplateRef<any>>('overlayTemplate');

  private overlayRef: OverlayRef | null = null;
  private cdr = inject(ChangeDetectorRef);
  private overlay = inject(Overlay);
  private overlayPositionBuilder = inject(OverlayPositionBuilder);
  private viewContainerRef = inject(ViewContainerRef);
  private modalService = inject(DsModalService);
  private authService = inject(AuthService);
  private hesTranslateService = inject(HesTranslateService);

  isOverlayOpen = false;
  reactionConfigs = REACTION_CONFIGS;
  isMobileDevice = isMobile();

  // Signal to track which reaction is currently being hovered (for tooltip)
  hoveredReaction = signal<ReactionData | null>(null);

  // Long press handling
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTriggered = false;
  private readonly LONG_PRESS_DURATION = 500; // ms

  hasUsersData = computed(() => {
    return this.reactions().some((r) => r.users && r.users.length > 0);
  });

  // Only personnel users can view reaction details (who reacted)
  canViewReactionDetails = computed(() => {
    const hasUsers = this.hasUsersData();
    const isPersonnel = this.authService.isUserPersonnel();
    // console.log('canViewReactionDetails:', {
    //   hasUsersData: hasUsers,
    //   isUserPersonnel: isPersonnel,
    //   isMobile: this.isMobileDevice,
    //   result: hasUsers && isPersonnel,
    // });
    return hasUsers && isPersonnel;
  });

  get displayedReactions(): ReactionData[] {
    return this.reactions().filter((r) => r.count > 0);
  }

  ngOnDestroy() {
    this.closeOverlay();
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }

  getChipTitle(reaction: ReactionData): string {
    const config = this.getReactionConfig(reaction.type);
    const action = reaction.isReacted
      ? this.hesTranslateService.t('global.remove.btn')
      : this.hesTranslateService.t('global.add');
    const label = config?.label
      ? this.hesTranslateService.t(config.label)
      : reaction.type;
    return `${action} ${label}`;
  }

  getTranslatedLabel(label: string): string {
    return this.hesTranslateService.t(label);
  }

  handleReactionClick(reactionType: ReactionType): void {
    const isCurrentlyReacted = this.isReactionSelected(reactionType);
    this.reactionToggled.emit({
      type: reactionType,
      isAdding: !isCurrentlyReacted,
    });
    if (this.isOverlayOpen) {
      this.closeOverlay();
    }
  }

  toggleOverlay() {
    if (this.isOverlayOpen) {
      this.closeOverlay();
    } else {
      this.openOverlay();
    }
  }

  private openOverlay() {
    if (this.overlayRef || !this.reactButton()) return;

    const positions: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -8,
      },
    ];

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlayPositionBuilder
        .flexibleConnectedTo(this.reactButton())
        .withPositions(positions),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    const portal = new TemplatePortal(
      this.overlayTemplate(),
      this.viewContainerRef,
    );
    this.overlayRef.attach(portal);
    this.overlayRef.backdropClick().subscribe(() => this.closeOverlay());

    this.isOverlayOpen = true;
    this.cdr.markForCheck();
  }

  private closeOverlay() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isOverlayOpen = false;
    this.cdr.markForCheck();
  }

  isReactionSelected(type: ReactionType): boolean {
    return this.reactions().some((r) => r.type === type && r.isReacted);
  }

  getReactionConfig(type: ReactionType): ReactionConfig | undefined {
    return REACTION_CONFIGS.find((c) => c.type === type);
  }

  async openReactionDetails() {
    if (!this.canViewReactionDetails()) return;

    await this.modalService.open({
      component: ReactionDetailBottomSheetComponent,
      componentProps: {
        reactions: this.reactions(),
      },
      mobileBreakpoints: [0, 0.5, 0.75, 1],
      mobileBreakpoint: 0.75,
      contentClass: '',
    });
  }

  onReactionChipClick(event: Event, reactionType: ReactionType) {
    event.stopPropagation();
    this.handleReactionClick(reactionType);
  }

  onMobileChipClick(event: Event, reactionType: ReactionType) {
    // Don't handle click if long press was triggered
    if (this.longPressTriggered) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.handleReactionClick(reactionType);
  }

  onTouchStart(event: TouchEvent) {
    this.longPressTriggered = false;
    this.longPressTimer = setTimeout(() => {
      this.longPressTriggered = true;
      this.openReactionDetails();
    }, this.LONG_PRESS_DURATION);
  }

  onTouchEnd(reactionType: ReactionType) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    // If long press was triggered, don't handle click
    if (this.longPressTriggered) {
      this.longPressTriggered = false;
      return;
    }
  }

  onTouchCancel() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.longPressTriggered = false;
  }
}
