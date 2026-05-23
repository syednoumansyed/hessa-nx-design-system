import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface RouteBackgroundConfig {
  route: string;
  backgroundClass: string;
  exact?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BackgroundThemeService {
  private currentBackgroundClass = signal<string>('');

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.initializeRouteListener();
  }

  private initializeRouteListener(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateBackgroundFromRouteData();
      });
  }

  private updateBackgroundFromRouteData(): void {
    // Get the activated route data
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    // Check for background configuration in route data
    const routeData = route.snapshot.data;
    const backgroundClass =
      routeData['backgroundImage'] ||
      routeData['bgImg'] ||
      routeData['background'] ||
      '';

    this.currentBackgroundClass.set(backgroundClass);
  }

  getCurrentBackgroundClass(): string {
    return this.currentBackgroundClass();
  }

  setBackgroundClass(backgroundClass: string): void {
    this.currentBackgroundClass.set(backgroundClass);
  }

  // Reset to default background
  resetToDefault(): void {
    this.updateBackgroundFromRouteData();
  }

  // Force refresh background from current route data
  refreshFromRoute(): void {
    this.updateBackgroundFromRouteData();
  }
}
