import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'ds-image-gallery-item',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block',
  },
  styles: [
    `
      .ds-image-skeleton {
        background: linear-gradient(
          90deg,
          #f0f2f5 25%,
          #e2e6eb 37%,
          #f0f2f5 63%
        );
        background-size: 400% 100%;
        animation: ds-image-skeleton-shimmer 1.4s ease infinite;
      }

      @keyframes ds-image-skeleton-shimmer {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: -100% 0;
        }
      }
    `,
  ],
  template: `
    <div [class]="tileClass()" (click)="handleClick()">
      <img
        [attr.src]="shouldLoad() ? url() : null"
        [class]="imageClass()"
        [class.opacity-0]="!loaded()"
        [attr.alt]="alt()"
        loading="lazy"
        (load)="markLoaded()"
        (error)="markLoaded()"
      />
      @if (!loaded()) {
        <div
          class="ds-image-skeleton absolute inset-0 z-10 rounded-ds-xl"
        ></div>
      }
    </div>
  `,
})
export class DsImageGalleryItemComponent implements AfterViewInit, OnDestroy {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  url = input<string>('');
  alt = input<string>('Image preview');
  tileClass = input<string>('');
  imageClass = input<string>('absolute inset-0 h-full w-full object-cover');
  selected = output<void>();

  protected readonly shouldLoad = signal(false);
  protected readonly loaded = signal(false);
  private observer?: IntersectionObserver;

  constructor() {
    effect(() => {
      void this.url();
      this.loaded.set(false);
    });
  }

  ngAfterViewInit(): void {
    if (!('IntersectionObserver' in window)) {
      this.shouldLoad.set(true);
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          this.shouldLoad.set(true);
          this.observer?.disconnect();
          this.observer = undefined;
        }
      },
      { rootMargin: '200px 0px' },
    );

    this.observer.observe(this.hostRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  protected markLoaded(): void {
    this.loaded.set(true);
  }

  protected handleClick(): void {
    this.selected.emit();
  }
}
