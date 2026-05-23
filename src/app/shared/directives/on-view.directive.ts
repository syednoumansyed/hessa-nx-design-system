import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
} from '@angular/core';

@Directive({
  selector: '[appOnView]',
  standalone: true,
})
export class OnViewDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private observer?: IntersectionObserver;

  /**
   * Function to call when element comes into view
   */
  readonly onView = input.required<() => void>();

  /**
   * Threshold for intersection (0 to 1)
   * Default: 0.1 (10% visible)
   */
  readonly threshold = input<number>(0.1);

  /**
   * Whether to call function only once
   * Default: true (typical for lazy loading)
   */
  readonly once = input<boolean>(true);

  /**
   * Root margin for early/late triggering
   * Example: '100px' to trigger 100px before element enters view
   */
  readonly rootMargin = input<string>('0px');

  ngOnInit(): void {
    if (!this.onView()) {
      console.warn('OnViewDirective: onView function is required');
      return;
    }

    this.createObserver();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private createObserver(): void {
    const options: IntersectionObserverInit = {
      root: null, // Use viewport
      rootMargin: this.rootMargin(),
      threshold: this.threshold(),
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Call the provided function
          this.onView()();

          // If once is true, disconnect after first call
          if (this.once()) {
            this.disconnect();
          }
        }
      });
    }, options);

    // Start observing
    if (this.elementRef.nativeElement) {
      this.observer.observe(this.elementRef.nativeElement);
    }
  }

  private disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
}
