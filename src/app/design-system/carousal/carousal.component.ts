import {
  Component,
  OnInit,
  OnDestroy,
  TemplateRef,
  ElementRef,
  input,
  output,
  viewChild,
  effect,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../icon/icon.component';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidChevronLeft,
  faSolidChevronRight,
} from '@ng-icons/font-awesome/solid';
import { isRtl } from '@shared/utils/platform';

export interface DsCarouselSlide {
  id: string | number;
  boldTitle: string;
  regularTitle: string;
  isHighlighted?: boolean;
}

@Component({
  selector: 'ds-carousal',
  templateUrl: './carousal.component.html',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  viewProviders: [provideIcons({ faSolidChevronLeft, faSolidChevronRight })],
})
export class CarousalComponent implements OnInit, OnDestroy {
  slides = input<DsCarouselSlide[]>([]);
  activeIndex = model<number>(0);
  isContentLoading = input<boolean>(false);
  skeletonTemplate = input<TemplateRef<any> | null>(null);
  slideChange = output<string | number>();

  readonly contentContainer = viewChild('contentContainer', {
    read: ElementRef,
  });

  readonly headerContainer = viewChild('headerContainer', {
    read: ElementRef,
  });

  Math = Math;
  isRTL = isRtl();

  isAnimating: boolean = false;
  isDragging: boolean = false;
  dragOffset: number = 0;
  slideDirection: 'left' | 'right' = 'right';

  // Skeleton animation state
  showSkeletonOverlay: boolean = false;
  skeletonDirection: 'left' | 'right' = 'right';
  isCompletingAnimation: boolean = false;

  // Drag state
  containerWidth: number = 0;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  hasMoved: boolean = false;
  private swipeThreshold: number = 0.3;
  private minSwipeDistance: number = 50;

  constructor() {
    // Effect to watch for activeIndex changes and navigate to that slide
    effect(() => {
      const newActiveIndex = this.activeIndex();
      const slides = this.slides();

      // Only update if the index is valid and different from current
      if (
        newActiveIndex >= 0 &&
        newActiveIndex < slides.length &&
        slides.length > 0
      ) {
        this.goToSlide(newActiveIndex);
      }
    });
  }

  ngOnInit() {
    // Set initial index from activeIndex input
    const initialIndex = this.activeIndex();
    if (initialIndex >= 0 && initialIndex < this.slides().length) {
      this.currentIndex = initialIndex;
    }

    if (this.slides().length > 0) {
      this.slideChange.emit(this.slides()[this.currentIndex].id);
    }
  }

  ngOnDestroy(): void {}

  get currentIndex(): number {
    return this.activeIndex();
  }

  set currentIndex(value: number) {
    this.activeIndex.set(value);
  }

  nextSlide(): void {
    if (
      this.currentIndex < this.slides().length - 1 &&
      !this.isAnimating &&
      !this.isContentLoading()
    ) {
      this.slideDirection = 'right';
      this.skeletonDirection = this.isRTL ? 'left' : 'right';
      this.startSkeletonAnimation(() => {
        this.currentIndex++;
        this.emitSlideChange();
      });
    }
  }

  previousSlide(): void {
    if (
      this.currentIndex > 0 &&
      !this.isAnimating &&
      !this.isContentLoading()
    ) {
      this.slideDirection = 'left';
      this.skeletonDirection = this.isRTL ? 'right' : 'left';
      this.startSkeletonAnimation(() => {
        this.currentIndex--;
        this.emitSlideChange();
      });
    }
  }

  goToSlide(targetIndex: number): void {
    if (
      targetIndex >= 0 &&
      targetIndex < this.slides().length &&
      targetIndex !== this.currentIndex &&
      !this.isAnimating &&
      !this.isContentLoading()
    ) {
      // Determine slide direction
      this.slideDirection = targetIndex > this.currentIndex ? 'right' : 'left';
      this.skeletonDirection = this.isRTL
        ? this.slideDirection === 'right'
          ? 'left'
          : 'right'
        : this.slideDirection === 'right'
          ? 'right'
          : 'left';

      this.startSkeletonAnimation(() => {
        this.currentIndex = targetIndex;
        this.emitSlideChange();
      });
    }
  }

  private startSkeletonAnimation(callback: () => void): void {
    if (!this.skeletonTemplate()) {
      this.animateSlideChange(callback);
      return;
    }

    if (this.contentContainer()?.nativeElement) {
      this.containerWidth = this.contentContainer()?.nativeElement.offsetWidth;
    }

    this.isAnimating = true;
    this.showSkeletonOverlay = true;
    this.dragOffset = 0;
    this.setTransition(false);

    requestAnimationFrame(() => {
      this.setTransition(true);
      this.isCompletingAnimation = true;
      this.runCompletionAnimation(callback);
    });
  }

  private runCompletionAnimation(callback: () => void): void {
    requestAnimationFrame(() => {
      let slideDistance: number;
      if (this.slideDirection === 'right') {
        slideDistance = this.isRTL ? this.containerWidth : -this.containerWidth;
      } else {
        slideDistance = this.isRTL ? -this.containerWidth : this.containerWidth;
      }
      this.dragOffset = slideDistance;

      setTimeout(() => {
        callback();
        this.completeAnimation();
      }, 300);
    });
  }

  private completeAnimation(): void {
    this.dragOffset = 0;
    this.showSkeletonOverlay = false;
    this.isCompletingAnimation = false;

    setTimeout(() => {
      this.isAnimating = false;
      this.setTransition(false);
    }, 50);
  }

  private animateSlideChange(callback: () => void): void {
    this.isAnimating = true;
    this.dragOffset = 0;
    this.setTransition(true);
    callback();
    setTimeout(() => {
      this.isAnimating = false;
      this.setTransition(false);
    }, 300);
  }

  private emitSlideChange(): void {
    if (this.slides()[this.currentIndex]) {
      this.slideChange.emit(this.slides()[this.currentIndex].id);
    }
  }

  private setTransition(enabled: boolean): void {
    const duration = enabled ? '300ms' : '0ms';
    const easing = 'cubic-bezier(0.4, 0.0, 0.2, 1)';

    const contentElement = this.contentContainer()?.nativeElement;
    if (contentElement) {
      contentElement.style.transition = enabled
        ? `transform ${duration} ${easing}`
        : 'none';
    }
    const headerElement = this.headerContainer()?.nativeElement;
    if (headerElement) {
      headerElement.style.transition = enabled
        ? `transform ${duration} ${easing}`
        : 'none';
    }
  }

  getHeaderTransform(): string {
    const gap = 48; // 3rem = 48px
    const baseTransform = this.isRTL
      ? this.currentIndex * 100
      : -this.currentIndex * 100;
    const dragPercentage =
      this.containerWidth > 0
        ? (this.dragOffset / this.containerWidth) * 100
        : 0;
    const totalTransform = baseTransform + dragPercentage;

    let gapOffset: number;
    if (this.isAnimating && this.containerWidth > 0) {
      const progress = Math.abs(this.dragOffset) / this.containerWidth;
      const targetGapOffset = this.isRTL
        ? this.currentIndex * gap
        : -this.currentIndex * gap;
      const nextSlideGapOffset =
        this.slideDirection === 'right'
          ? this.isRTL
            ? (this.currentIndex + 1) * gap
            : -(this.currentIndex + 1) * gap
          : this.isRTL
            ? (this.currentIndex - 1) * gap
            : -(this.currentIndex - 1) * gap;

      gapOffset =
        targetGapOffset + (nextSlideGapOffset - targetGapOffset) * progress;
    } else {
      gapOffset = this.isRTL
        ? this.currentIndex * gap
        : -this.currentIndex * gap;
    }

    return `calc(${totalTransform}% + ${gapOffset}px)`;
  }

  getContentTransform(): string {
    return `translateX(${this.dragOffset}px)`;
  }

  getSkeletonTransform(): string {
    if (this.isCompletingAnimation) {
      return 'translateX(0%)';
    }

    if (this.isDragging && this.hasMoved) {
      const direction = this.dragOffset > 0 ? -1 : 1;
      const progress = Math.min(
        Math.abs(this.dragOffset) / this.containerWidth,
        1,
      );
      const skeletonOffset = direction * (100 - progress * 100);
      return `translateX(${skeletonOffset}%)`;
    }

    return this.skeletonDirection === 'right'
      ? 'translateX(100%)'
      : 'translateX(-100%)';
  }

  shouldShowSkeleton(): boolean {
    return (
      this.showSkeletonOverlay ||
      (this.isDragging && this.hasMoved && this.skeletonTemplate() !== null)
    );
  }

  onTouchStart(event: TouchEvent): void {
    if (
      event.touches.length === 1 &&
      !this.isAnimating &&
      !this.isContentLoading()
    ) {
      this.startDrag(event.touches[0].clientX, event.touches[0].clientY);
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.updateDrag(event.touches[0].clientX, event.touches[0].clientY);
    if (Math.abs(this.dragOffset) > 10) {
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.isDragging) {
      this.endDrag();
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.isAnimating && !this.isContentLoading()) {
      this.startDrag(event.clientX, event.clientY);
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.updateDrag(event.clientX, event.clientY);
    }
  }

  onMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      this.endDrag();
    }
  }

  onMouseLeave(event: MouseEvent): void {
    if (this.isDragging) {
      this.endDrag();
    }
  }

  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;
    this.startX = clientX;
    this.startY = clientY;
    this.currentX = clientX;
    this.currentY = clientY;
    this.hasMoved = false;
    this.dragOffset = 0;

    if (this.contentContainer()?.nativeElement) {
      this.containerWidth = this.contentContainer()?.nativeElement.offsetWidth;
    }

    this.setTransition(false);

    if (this.skeletonTemplate()) {
      this.showSkeletonOverlay = false;
    }
  }

  private endDrag(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.hasMoved) {
      const deltaX = this.currentX - this.startX;
      const swipeDistance = Math.abs(deltaX);
      const swipePercentage =
        this.containerWidth > 0 ? swipeDistance / this.containerWidth : 0;
      const shouldChangeSlide =
        swipeDistance > this.minSwipeDistance &&
        swipePercentage > this.swipeThreshold;

      if (shouldChangeSlide) {
        if (this.isRTL) {
          if (deltaX > 0 && this.currentIndex < this.slides().length - 1) {
            this.slideDirection = 'right';
            this.startCompletionFromDrag(() => {
              this.currentIndex++;
              this.emitSlideChange();
            });
          } else if (deltaX < 0 && this.currentIndex > 0) {
            this.slideDirection = 'left';
            this.startCompletionFromDrag(() => {
              this.currentIndex--;
              this.emitSlideChange();
            });
          } else {
            this.snapBack();
          }
        } else {
          if (deltaX > 0 && this.currentIndex > 0) {
            this.slideDirection = 'left';
            this.startCompletionFromDrag(() => {
              this.currentIndex--;
              this.emitSlideChange();
            });
          } else if (
            deltaX < 0 &&
            this.currentIndex < this.slides().length - 1
          ) {
            this.slideDirection = 'right';
            this.startCompletionFromDrag(() => {
              this.currentIndex++;
              this.emitSlideChange();
            });
          } else {
            this.snapBack();
          }
        }
      } else {
        this.snapBack();
      }
    } else {
      this.snapBack();
    }
    this.hasMoved = false;
  }

  private updateDrag(clientX: number, clientY: number): void {
    if (!this.isDragging) return;
    this.currentX = clientX;
    this.currentY = clientY;
    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
      if (!this.hasMoved) {
        this.hasMoved = true;
        if (this.isRTL) {
          this.skeletonDirection = deltaX > 0 ? 'left' : 'right';
        } else {
          this.skeletonDirection = deltaX > 0 ? 'left' : 'right';
        }
        if (this.skeletonTemplate()) {
          this.showSkeletonOverlay = true;
        }
      }

      let newOffset = deltaX;
      if (this.currentIndex === 0 && (this.isRTL ? deltaX < 0 : deltaX > 0)) {
        newOffset = deltaX * 0.3;
      }
      if (
        this.currentIndex === this.slides().length - 1 &&
        (this.isRTL ? deltaX > 0 : deltaX < 0)
      ) {
        newOffset = deltaX * 0.3;
      }
      this.dragOffset = newOffset;
    }
  }

  private startCompletionFromDrag(callback: () => void): void {
    this.isAnimating = true;
    this.isCompletingAnimation = true;
    this.setTransition(true);

    let finalDragOffset: number;
    if (this.slideDirection === 'right') {
      finalDragOffset = this.isRTL ? this.containerWidth : -this.containerWidth;
    } else {
      finalDragOffset = this.isRTL ? -this.containerWidth : this.containerWidth;
    }

    this.dragOffset = finalDragOffset;

    setTimeout(() => {
      callback();
      this.completeAnimation();
    }, 300);
  }

  private snapBack(): void {
    this.setTransition(true);
    this.dragOffset = 0;
    this.showSkeletonOverlay = false;
    setTimeout(() => {
      this.setTransition(false);
    }, 300);
  }
}
