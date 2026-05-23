import { computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PageTitleService {
  private readonly transloco = inject(TranslocoService);

  private readonly _currentPageTitle = signal<string | null>(null);
  private readonly _currentPageAlias = signal<string | null>(null);
  private readonly _currentPageAliasValue = signal<string | null>(null);

  currentPageTitle = computed(() => {
    const currentPageTitle = this._currentPageTitle();
    const currentPageAlias = this._currentPageAlias();
    const currentPageAliasValue = this._currentPageAliasValue();

    if (currentPageAlias) {
      return currentPageAliasValue;
    }
    return currentPageTitle;
  });

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    this.detectRouteChanges();
  }

  /**
   * Whenever route changes update page title
   */
  private detectRouteChanges() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.getChildRouteData();
      });
  }

  private getChildRouteData() {
    let currentRoute = this.activatedRoute;

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    currentRoute.data.subscribe((data) => {
      if (data?.['pageTitle']?.['alias']) {
        this._currentPageAlias.set(data?.['pageTitle']?.['alias']);
        this._currentPageTitle.set(null);
      } else if (data['pageTitle']) {
        this._currentPageAlias.set(null);
        this._currentPageTitle.set(this.transloco.translate(data['pageTitle']));
      } else {
        this._currentPageTitle.set(null);
        this._currentPageAlias.set(null);
        this._currentPageAliasValue.set(null);
      }
    });
  }

  public updatePageTitle(value: string) {
    this._currentPageTitle.set(value);
  }

  public setAliasValue(value: string | null) {
    this._currentPageAliasValue.set(value);
  }
}
