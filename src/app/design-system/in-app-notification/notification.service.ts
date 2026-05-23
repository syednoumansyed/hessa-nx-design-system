import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InAppNotification } from './in-app-notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications$ = new BehaviorSubject<InAppNotification[]>(
    [],
  );
  readonly notifications$ = this._notifications$.asObservable();

  private maxStack = 5;

  show(partial: Omit<InAppNotification, 'id' | 'createdAt'>) {
    const id =
      typeof crypto !== 'undefined' && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).slice(2);

    const notification: InAppNotification = {
      id,
      createdAt: Date.now(),
      duration: partial.duration ?? 5000,
      ...partial,
    };

    const current = this._notifications$.value;

    // newest comes on top; keep at most maxStack
    const updated = [notification, ...current].slice(0, this.maxStack);
    this._notifications$.next(updated);

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => this.dismiss(notification.id), notification.duration);
    }
  }

  dismiss(id: string) {
    this._notifications$.next(
      this._notifications$.value.filter((n) => n.id !== id),
    );
  }

  clear() {
    this._notifications$.next([]);
  }
}
