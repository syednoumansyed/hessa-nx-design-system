import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutUiControlService {
  private readonly isBreadcrumbVisible = new BehaviorSubject<boolean>(true);
  readonly isBreadcrumbVisible$ = this.isBreadcrumbVisible.asObservable();

  private _showWebBackBtn = signal(false);
  public isShowWebBackBtn = this._showWebBackBtn.asReadonly();

  /** Manual override for header icons (help + notification). null = auto (default). */
  private _headerIconsVisible = signal<boolean | null>(null);
  public isHeaderIconsVisible = this._headerIconsVisible.asReadonly();

  constructor() {}

  showBreadcrumb() {
    this.isBreadcrumbVisible.next(true);
  }

  hideBreadcrumb() {
    this.isBreadcrumbVisible.next(false);
  }

  showWebBackBtn() {
    this._showWebBackBtn.set(true);
  }
  hideWebBackBtn() {
    this._showWebBackBtn.set(false);
  }

  showHeaderIcons() {
    this._headerIconsVisible.set(true);
  }

  hideHeaderIcons() {
    this._headerIconsVisible.set(false);
  }

  /** Reset to automatic behavior (synced with bottom nav on mobile, always visible on desktop). */
  resetHeaderIconsVisibility() {
    this._headerIconsVisible.set(null);
  }
}
