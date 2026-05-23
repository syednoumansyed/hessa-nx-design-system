import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { interval, Subject } from 'rxjs';
import {
  takeUntil,
  filter,
  map,
  switchMap,
  startWith,
  takeWhile,
} from 'rxjs/operators';

@Directive({
  selector: '[longPress]',
  standalone: true,
})
export class LongPressDirective implements OnInit, OnDestroy {
  @Input() longPress: number = 500;
  @Output() onRelease = new EventEmitter<MouseEvent | TouchEvent>();

  private startEvents$ = new Subject<MouseEvent | TouchEvent>();
  private endEvents$ = new Subject<MouseEvent | TouchEvent>();
  private destroy$ = new Subject<void>();
  private currentStartEvent: MouseEvent | TouchEvent | null = null;

  ngOnInit(): void {
    this.startEvents$
      .pipe(
        switchMap((startEvent) => {
          this.currentStartEvent = startEvent;
          return interval(10).pipe(
            map((i) => i * 10),
            startWith(0),
            takeWhile((elapsed) => elapsed <= this.longPress, true),
            takeUntil(this.endEvents$),
            filter((elapsed) => elapsed >= this.longPress),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        if (this.currentStartEvent) {
          this.onRelease.emit(this.currentStartEvent);
          this.currentStartEvent = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.startEvents$.next(event);
  }

  @HostListener('mouseup', ['$event'])
  @HostListener('mouseleave', ['$event'])
  onMouseEnd(event: MouseEvent): void {
    this.endEvents$.next(event);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.startEvents$.next(event);
  }

  @HostListener('touchend', ['$event'])
  @HostListener('touchcancel', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    this.endEvents$.next(event);
  }
}
