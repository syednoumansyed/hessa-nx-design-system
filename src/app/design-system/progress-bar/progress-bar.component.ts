import { Component, input, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isRtl } from '@shared/utils/platform';

export type ProgressBarVariant =
  | 'green'
  | 'red'
  | 'blue'
  | 'yellow'
  | 'indigo'
  | 'orange'
  | 'neon-green';

/**
 * @ai-hint
 * component: DsProgressBarComponent
 * selector: app-ds-progress-bar
 * intent: Animated horizontal progress indicator for completion percentages — used in assignments, course progress, and attendance summaries
 * do: Pass progress as 0–100; choose variant to match the semantic color (green=complete, red=danger, blue=info, yellow=warning, indigo/orange/neon-green for domain-specific metrics); use size="sm" for compact list rows
 * dont: Don't animate progress externally — the component eases to the target value internally with a 800ms cubic-out animation; don't set progress above 100 (clamped internally)
 * device: No structural device differences
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: isRtl() is read at init; the fill direction is logically reversed for RTL so the bar grows from the correct edge
 * alternatives: IonProgressBar for Ionic-native contexts; a simple tailwind w-[x%] bar for static non-animated display
 */
@Component({
  selector: 'app-ds-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
})
export class DsProgressBarComponent {
  progress = input<number>(0);
  variant = input<ProgressBarVariant>('green');
  size = input<'sm' | 'lg'>('lg');
  showPercentage = input<boolean>(true);
  isRtl = isRtl();

  private _animatedProgress = signal(0);
  private _animationFrame: number | null = null;
  private _isAnimating = signal(false);

  animatedProgress = computed(() => this._animatedProgress());

  constructor() {
    effect(() => {
      const targetProgress = Math.min(Math.max(this.progress(), 0), 100);

      // Only animate if we're not already animating to this value
      if (!this._isAnimating() && this._animatedProgress() !== targetProgress) {
        setTimeout(() => {
          this.animateToProgress(targetProgress);
        }, 50);
      }
    });
  }

  private animateToProgress(targetProgress: number): void {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }

    this._isAnimating.set(true);
    const startProgress = this._animatedProgress();
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue =
        startProgress + (targetProgress - startProgress) * easedProgress;

      const clampedValue = Math.max(0, Math.min(100, currentValue));
      this._animatedProgress.set(Math.floor(clampedValue));

      if (progress < 1) {
        this._animationFrame = requestAnimationFrame(animate);
      } else {
        this._animatedProgress.set(Math.floor(targetProgress));
        this._animationFrame = null;
        this._isAnimating.set(false);
      }
    };

    this._animationFrame = requestAnimationFrame(animate);
  }

  ngOnDestroy() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
    }
  }
}
