import {
  Component,
  input,
  signal,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

@Component({
  selector: 'ds-expandable',
  standalone: true,
  imports: [CommonModule, DsTranslatePipe],
  templateUrl: './expandable.component.html',
})
export class DsExpandableComponent implements AfterViewInit, OnDestroy {
  @ViewChild('contentElement') contentElement!: ElementRef<HTMLElement>;

  readonly initiallyExpanded = input<boolean>(false);
  readonly showMoreText = input<string>('show_more.btn');
  readonly showLessText = input<string>('show_less.btn');
  readonly maxHeight = input<number>(100); // Default height limit in pixels
  readonly isExpanded = signal<boolean>(false);
  readonly shouldShowToggle = signal<boolean>(false);

  private resizeObserver?: ResizeObserver;

  constructor() {
    // Set initial state
    this.isExpanded.set(this.initiallyExpanded());
  }

  ngAfterViewInit() {
    // Set up ResizeObserver to monitor content changes
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  toggle() {
    this.isExpanded.update((expanded) => !expanded);
  }

  expand() {
    this.isExpanded.set(true);
  }

  collapse() {
    this.isExpanded.set(false);
  }

  checkContentHeight() {
    if (this.contentElement?.nativeElement) {
      const contentHeight = this.contentElement.nativeElement.scrollHeight;
      const maxHeightValue = this.maxHeight();
      const shouldShow = contentHeight > maxHeightValue;
      this.shouldShowToggle.set(shouldShow);
    }
  }

  onContentLoaded(contentElement: HTMLElement) {
    // Check if content height exceeds the maxHeight limit
    const contentHeight = contentElement.scrollHeight;
    const maxHeightValue = this.maxHeight();
    this.shouldShowToggle.set(contentHeight > maxHeightValue);
  }

  getMaxHeightStyle() {
    return this.maxHeight() + 'px';
  }

  private setupResizeObserver() {
    if (
      typeof ResizeObserver !== 'undefined' &&
      this.contentElement?.nativeElement
    ) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkContentHeight();
      });
      this.resizeObserver.observe(this.contentElement.nativeElement);
    }
  }
}
