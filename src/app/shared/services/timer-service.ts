import { Injectable, signal } from '@angular/core';

@Injectable()
export class TimerService {
  private readonly _timer = signal('');
  private readonly _isTimerOn = signal(false);
  private _intervalId: null | ReturnType<typeof setInterval> = null;

  readonly timer = this._timer.asReadonly();
  readonly isTimerOn = this._isTimerOn.asReadonly();

  startTimer(minutes = 1, seconds = 0) {
    let totalSeconds = minutes * 60 + seconds;
    this._isTimerOn.set(true);

    if (this._intervalId) {
      clearInterval(this._intervalId);
    }

    this._intervalId = setInterval(() => {
      if (totalSeconds === 0) {
        clearInterval(this._intervalId!);
        this._timer.set('');
        this._isTimerOn.set(false);
      } else {
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;
        const displayTime = `${displayMinutes < 10 ? '0' + displayMinutes : displayMinutes}:${displaySeconds < 10 ? '0' + displaySeconds : displaySeconds}`;
        this._timer.set(displayTime);
        totalSeconds--;
      }
    }, 1000);
  }

  // Method to stop and reset the timer
  resetTimer() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }
    this._timer.set('');
    this._isTimerOn.set(false);
  }
}
