import {
  Component,
  computed,
  inject,
  input,
  NgZone,
  OnInit,
  output,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { AnimationItem } from 'lottie-web';
import { LottieComponent } from 'ngx-lottie';
import { NgClass } from '@angular/common';
type AnimationBasicSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type AnimatedIconSize =
  | AnimationBasicSize
  | number
  | Omit<string, AnimationBasicSize>;

@Component({
  selector: 'ds-animated-icon',
  templateUrl: './animated-icon.component.html',
  styleUrls: ['./animated-icon.component.scss'],
  standalone: true,
  imports: [LottieComponent],
})
export class AnimatedIconComponent implements OnInit {
  private readonly zone = inject(NgZone);

  // ViewChild to access the Lottie component directly
  @ViewChild('lottieComponent', { static: false })
  lottieComponent!: LottieComponent;

  // Inputs
  icon = input<string>();
  /**
   * Size can be preset ('sm', 'md', etc.), a number (pixels), or a string with units ('34px', '2rem')
   */
  size = input<AnimatedIconSize>('sm');

  resolvedWidth = computed(() => this.parseSize(this.size()));

  resolvedHeight = computed(() => this.parseSize(this.size()));

  autoplay = input<boolean>(false);
  loop = input<boolean>(false);

  // Outputs
  animationReady = output<() => void>(); // Emits a function that can be called to play animation
  animationCreated = output<AnimationItem>(); // Emits the animation item for advanced usage

  iconPath = computed(() => {
    return this.icon() ? `assets/json/lottie/${this.icon()}.json` : '';
  });

  // Animation management
  private animationItem: AnimationItem | null = null;

  ngOnInit() {}

  /**
   * Handle animation creation for Lottie
   */
  onAnimationCreated(
    item: AnimationItem,
    lottieComponent: LottieComponent,
  ): void {
    this.zone.runOutsideAngular(() => {
      if (item) {
        this.animationItem = item;

        // Emit the animation item for advanced usage
        this.animationCreated.emit(item);

        // Emit a play function that users can call
        this.animationReady.emit(() => this.playAnimation());
      }
    });
  }

  /**
   * Public method to play animation - can be called via template reference
   */
  playAnimation(): void {
    if (this.animationItem) {
      this.zone.runOutsideAngular(() => {
        try {
          // Reset to first frame then play
          this.animationItem!.goToAndStop(0, true);
          setTimeout(() => {
            this.animationItem!.play();
          }, 50);
        } catch (error) {
          console.warn('Animation playback error:', error);
        }
      });
    }
  }

  /**
   * Public method to stop animation
   */
  stopAnimation(): void {
    if (this.animationItem) {
      this.zone.runOutsideAngular(() => {
        try {
          this.animationItem!.stop();
        } catch (error) {
          console.warn('Animation stop error:', error);
        }
      });
    }
  }

  /**
   * Public method to pause animation
   */
  pauseAnimation(): void {
    if (this.animationItem) {
      this.zone.runOutsideAngular(() => {
        try {
          this.animationItem!.pause();
        } catch (error) {
          console.warn('Animation pause error:', error);
        }
      });
    }
  }

  /**
   * Public method to go to a specific frame
   */
  goToFrame(frame: number, isFrame: boolean = true): void {
    if (this.animationItem) {
      this.zone.runOutsideAngular(() => {
        try {
          this.animationItem!.goToAndStop(frame, isFrame);
        } catch (error) {
          console.warn('Animation goToFrame error:', error);
        }
      });
    }
  }

  // Keep the old method for backward compatibility
  onAnimationPlay(): void {
    this.playAnimation();
  }

  /**
   * Parses a size value (preset, number, or string with units)
   */
  private parseSize(val: AnimatedIconSize): string {
    if (val === undefined || val === null) return SIZE_MAP['sm'];
    if (typeof val === 'number') return `${val}px`;
    if (typeof val === 'string') {
      if (SIZE_MAP[val]) return SIZE_MAP[val];
      // If string ends with a unit, return as-is
      if (/^(\d+)(px|em|rem|%)$/.test(val)) return val;
      // If string is a number, treat as px
      if (/^\d+$/.test(val)) return `${val}px`;
    }
    return SIZE_MAP['sm'];
  }
}

const SIZE_MAP: Record<string, string> = {
  sm: '16px',
  md: '20px',
  lg: '32px',
  xl: '48px',
  xxl: '60px',
};
