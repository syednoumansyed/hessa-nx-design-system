import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-assessment-timer',
  standalone: true,
  imports: [NgClass, TranslocoDirective],
  providers: [DsTranslatePipe],
  template: `
    @if (show()) {
      <ng-container *transloco="let t">
        <div
          [ngClass]="cssClass()"
          class="content-lg-high-emphasis flex items-center gap-1 text-emphasis-mid"
        >
          @if (label()) {
            <span>{{ t(label()!) }}:</span>
          }
          <ng-content></ng-content>
          <span [class]="counterCss()"> {{ formattedTime() }} </span>
        </div>
      </ng-container>
    }
  `,
})
export class AssessmentTimerComponent implements OnInit, OnDestroy {
  // Signal inputs
  show = input<boolean>(true);
  dueDate = input<string | null>(null);
  duration = input<number>(0);
  cssClass = input<string>('text-content-error');
  counterCss = input<string>('text-content-error');
  label = input<string | undefined>();
  // Outputs
  timeUp = output<void>();

  // Internal state
  remainingSeconds = signal<number>(0);
  private timerInterval: any = null;
  private startTime: Date | null = null;
  private lastDueDate: string | null = null;
  private lastDuration: number = 0;

  private readonly translateService = inject(DsTranslatePipe);
  // Computed properties
  formattedTime = computed(() => {
    return formatTime(this.remainingSeconds());
  });

  constructor() {}

  ngOnInit() {
    this.startIfNeeded();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // Only restart timer if inputs change
  private startIfNeeded() {
    if (
      this.dueDate() !== this.lastDueDate ||
      this.duration() !== this.lastDuration
    ) {
      this.lastDueDate = this.dueDate();
      this.lastDuration = this.duration();
      this.startTimer();
    }
  }

  startTimer() {
    this.stopTimer();
    this.startTime = new Date();
    this.updateRemainingTime();
    if (this.dueDate() || this.duration() > 0) {
      this.timerInterval = setInterval(() => {
        this.updateRemainingTime();
        this.startIfNeeded(); // Check for input changes
        if (this.remainingSeconds() <= 0) {
          this.onTimeUp();
        }
      }, 1000);
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.startTime = null;
  }

  private updateRemainingTime() {
    if (!this.dueDate() && !this.duration()) {
      this.remainingSeconds.set(0);
      return;
    }

    const now = new Date();
    let remaining = Infinity;

    // Duration limit
    if (this.duration() > 0 && this.startTime) {
      const elapsedSeconds = Math.floor(
        (now.getTime() - this.startTime.getTime()) / 1000,
      );
      remaining = Math.min(remaining, this.duration() - elapsedSeconds);
    }

    // Due date limit
    if (this.dueDate()) {
      const dueDateTime = new Date(this.dueDate()!).getTime();
      const timeUntilDue = Math.floor((dueDateTime - now.getTime()) / 1000);
      remaining = Math.min(remaining, timeUntilDue);
    }

    if (remaining === Infinity) {
      remaining = 0;
    }
    this.remainingSeconds.set(Math.max(0, remaining));
  }

  private onTimeUp() {
    this.stopTimer();
    this.timeUp.emit();
  }
}

function formatTime(seconds: number): string {
  if (seconds <= 0 || isNaN(seconds)) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
