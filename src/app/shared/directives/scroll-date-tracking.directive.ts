import {
  DestroyRef,
  Directive,
  NgZone,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';
import { parseIsoToEpochMs } from '@shared/utils/date';

const MAX_SETUP_RETRIES = 20;
const SCROLL_IDLE_TIMEOUT_MS = 1200;

@Directive({
  selector: '[appScrollDateTracking]',
  standalone: true,
  exportAs: 'scrollDateTracking',
})
export class ScrollDateTrackingDirective {
  /** The scroll container element to observe */
  readonly scrollContainer = input.required<HTMLElement | null>({
    alias: 'appScrollDateTracking',
  });

  /** The list of stages used to resolve timestamps from sentinel indices */
  readonly stages = input.required<readonly { timestamp?: string | null }[]>();

  /** Epoch ms of the currently active floating date */
  readonly floatingDateEpoch = signal<number>(0);

  /** Whether the user is actively scrolling */
  readonly isScrolling = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private scrollCleanup: (() => void) | null = null;
  private scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId: number | null = null;
  private rafPending = false;

  constructor() {
    afterNextRender(() => {
      this.setupScrollListener();
    });

    this.destroyRef.onDestroy(() => {
      this.scrollCleanup?.();
      if (this.scrollIdleTimer) {
        clearTimeout(this.scrollIdleTimer);
      }
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
      }
    });
  }

  private setupScrollListener(): void {
    let retries = 0;

    const trySetup = (): void => {
      const container = this.scrollContainer();
      if (!container) {
        if (++retries >= MAX_SETUP_RETRIES) return;
        setTimeout(() => trySetup(), 100);
        return;
      }

      const onScroll = (): void => {
        if (this.rafPending) return;
        this.rafPending = true;
        this.rafId = requestAnimationFrame(() => {
          this.rafPending = false;
          this.updateFloatingDate(container);
        });
      };

      container.addEventListener('scroll', onScroll, { passive: true });
      this.scrollCleanup = () =>
        container.removeEventListener('scroll', onScroll);
    };

    trySetup();
  }

  private updateFloatingDate(container: HTMLElement): void {
    const wasScrolling = this.isScrolling();
    if (!wasScrolling) {
      this.ngZone.run(() => this.isScrolling.set(true));
    }

    if (this.scrollIdleTimer) {
      clearTimeout(this.scrollIdleTimer);
    }
    this.scrollIdleTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.isScrolling.set(false);
        const sentinels = Array.from(
          container.querySelectorAll<HTMLElement>('[data-stage-index]'),
        );
        for (const el of sentinels) {
          el.style.opacity = '1';
        }
      });
    }, SCROLL_IDLE_TIMEOUT_MS);

    const sentinels = Array.from(
      container.querySelectorAll<HTMLElement>('[data-stage-index]'),
    );
    if (!sentinels.length) return;

    const containerRect = container.getBoundingClientRect();
    const stages = this.stages();
    let activeEpoch = this.floatingDateEpoch();
    let epochChanged = false;

    for (const sentinel of sentinels) {
      const sentinelRect = sentinel.getBoundingClientRect();
      const scrolledPast =
        sentinelRect.top <= containerRect.top + sentinel.offsetHeight;

      if (scrolledPast) {
        const idx = Number(sentinel.dataset['stageIndex']);
        const epoch = parseIsoToEpochMs(stages[idx]?.timestamp);
        if (epoch) {
          activeEpoch = epoch;
          epochChanged = true;
        }
      }

      sentinel.style.opacity = scrolledPast ? '0' : '1';
    }

    if (epochChanged) {
      this.ngZone.run(() => this.floatingDateEpoch.set(activeEpoch));
    }
  }
}
