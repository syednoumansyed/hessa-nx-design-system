import { computed, inject, Injectable, signal } from '@angular/core';
import { sideMenuSchoolStructureItem } from './layout.component';
import {
  ActivatedRoute,
  NavigationCancel,
  NavigationEnd,
  NavigationStart,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';
import { filter, first, take, timer } from 'rxjs';
import { fromEvent } from 'rxjs';
import { map, distinctUntilChanged, startWith } from 'rxjs/operators';
import { mobileRoutes } from '../ds-layout/ds-menu-routes';
import { AuthService } from '@auth/auth.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';

type WindowClass =
  | 'compact' // < 600
  | 'medium' // 600-839
  | 'expanded' // 840-991 (tablet - aligns with Ionic lg breakpoint)
  | 'large' // 992-1599 (desktop - matches Ionic lg+ breakpoint)
  | 'extra-large'; // ≥ 1600

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly _windowClass = signal<WindowClass>('large');
  public readonly windowClass = this._windowClass.asReadonly();

  /* convenience flags other parts of app can consume */
  public readonly isMobile = computed(() =>
    ['compact', 'medium'].includes(this._windowClass()),
  );
  public readonly isTablet = computed(() => this._windowClass() === 'expanded');
  public readonly isDesktop = computed(() =>
    ['large', 'extra-large'].includes(this._windowClass()),
  );
  public readonly isTabletOrDesktop = computed(() => !this.isMobile());
  public readonly isMobileOrTablet = computed(
    () => this.isMobile() || this.isTablet(),
  );

  private classify(width: number): WindowClass {
    if (width < 600) return 'compact';
    if (width < 840) return 'medium';
    if (width < 992) return 'expanded'; // Changed from 1200 to 992 to align with Ionic's lg breakpoint
    if (width < 1600) return 'large';
    return 'extra-large';
  }
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly studentSelectionScope = inject(StudentSelectionScopeService);

  private _showSchoolScopeSelectionPopover = signal(false);
  public readonly showSchoolScopeSelectionPopover =
    this._showSchoolScopeSelectionPopover.asReadonly();

  private _showAcademicYearPopover = signal(false);
  public readonly showAcademicYearPopover =
    this._showAcademicYearPopover.asReadonly();

  private _isSideNavCollapsed = signal(false);
  public isSideNavCollapsed = this._isSideNavCollapsed.asReadonly();

  private _selectedSchoolStructureNavItem =
    signal<sideMenuSchoolStructureItem | null>(null);
  public selectedSchoolStructureNavItem =
    this._selectedSchoolStructureNavItem.asReadonly();

  private _isShowProgressBar = signal<boolean>(false);
  public isShowProgressBar = this._isShowProgressBar.asReadonly();

  private _isShowPageSpinner = signal<boolean>(false);
  public isShowPageSpinner = this._isShowPageSpinner.asReadonly();

  private _currentClassName = signal<string | null>(null);
  public currentClassName = this._currentClassName.asReadonly();

  private _currentLevelName = signal<string | null>(null);
  public currentLevelName = this._currentLevelName.asReadonly();

  private _showSplashScreen = signal(true);
  public showSplashScreen = this._showSplashScreen.asReadonly();

  private _noMobilePadding = signal<boolean>(false);
  public noMobilePadding = this._noMobilePadding.asReadonly();

  private _isShowChildSelector = signal<boolean>(false);
  public isShowChildSelector = this._isShowChildSelector.asReadonly();

  private _isBottomBarVisible = signal<boolean>(false);
  public isBottomBarVisible = this._isBottomBarVisible.asReadonly();

  private _isHeaderVisible = signal<boolean>(true);
  public isHeaderVisible = this._isHeaderVisible.asReadonly();

  private _isFullWidthRoute = signal<boolean>(false);
  public isFullWidthRoute = this._isFullWidthRoute.asReadonly();

  private _isSelectedSchoolInfoVisible = signal<boolean>(false);
  public isSelectedSchoolInfoVisible =
    this._isSelectedSchoolInfoVisible.asReadonly();

  private _currentRouteShowChildSelector = signal<boolean>(false);
  public currentRouteShowChildSelector =
    this._currentRouteShowChildSelector.asReadonly();

  readonly isChildSelectionRequired = computed(() => {
    const isGuardianUser = this.authService.isUserGuardian();
    const scopeStudentLength =
      this.studentSelectionScope.studentSelectionScope()?.length;
    const routeAllowsChildSelector = this._currentRouteShowChildSelector();
    return (
      isGuardianUser &&
      scopeStudentLength > 1 &&
      this.isShowChildSelector() &&
      routeAllowsChildSelector
    );
  });

  appVersion = signal<string>('');

  constructor() {
    this.router.events
      .pipe(
        // we only care about the first route the user is navigating to on app start
        filter((e) => e instanceof NavigationEnd),
        first(),
      )
      .subscribe((e) => {
        // hide splash screen as soon as the first navigation ends
        // this is to make sure if user is visting a route or child route all routes checks (guards, resolvers, etc..) will be finished first
        this.hideSplashScreen();
      });
    // show loading spinner over content area when loading a lazy loaded feature/route
    this.router.events
      .pipe(
        filter(
          (e) =>
            e instanceof RouteConfigLoadStart ||
            e instanceof RouteConfigLoadEnd ||
            e instanceof NavigationStart ||
            e instanceof NavigationEnd ||
            e instanceof NavigationCancel,
        ),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.showPageSpinner();
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel
        ) {
          timer(500)
            .pipe(take(1))
            .subscribe(() => {
              this.hidePageSpinner();
            });
        }

        if (event instanceof NavigationEnd) {
          const currentRoute = getDeepestActivatedRoute(this.activatedRoute);
          const url = this.router.url;
          // check if the current route is a mobile route and update the bottom bar visibility accordingly
          // Extract the first segment of the path for comparison
          const path = url.split('/').slice(1).join('/'); // gets the full path after the first slash
          const isMobileRoute = mobileRoutes.some(
            (route) => route.path === path,
          );
          this._isBottomBarVisible.set(isMobileRoute);

          if (currentRoute) {
            const {
              noMobilePadding,
              showChildSelector,
              fullWidth,
              hideHeader,
              hideHeaderMobile,
              hideHeaderDesktop,
            } = currentRoute.snapshot.data;
            this._noMobilePadding.set(!!noMobilePadding);
            this._currentRouteShowChildSelector.set(!!showChildSelector);
            this._isFullWidthRoute.set(fullWidth);

            // Header visibility logic
            let headerVisible = true;
            if (hideHeader) {
              headerVisible = false;
            } else if (hideHeaderMobile && this.isMobileOrTablet()) {
              headerVisible = false;
            } else if (hideHeaderDesktop && this.isDesktop()) {
              headerVisible = false;
            }
            this._isHeaderVisible.set(headerVisible);
          } else {
            // If no current route, reset to default
            this._currentRouteShowChildSelector.set(false);
            this._isHeaderVisible.set(true);
          }
        }
      });

    /* ───── window-size reactive listener ───── */
    fromEvent(window, 'resize')
      .pipe(
        startWith(window.innerWidth), // initial value
        map(() => window.innerWidth),
        distinctUntilChanged(),
      ) //No need to unsubscribe; LayoutService is providedIn:'root' and lives for the whole session
      .subscribe((w) => this._windowClass.set(this.classify(w)));
  }

  toggleSchoolSelectionPopover() {
    this._showSchoolScopeSelectionPopover.update((v) => !v);
  }
  updateSchoolSelectionPopover(v: boolean) {
    this._showSchoolScopeSelectionPopover.set(v);
  }

  toggleAcademicYearPopover() {
    this._showAcademicYearPopover.update((v) => !v);
  }
  updateAcademicYearPopover(v: boolean) {
    this._showAcademicYearPopover.set(v);
  }

  setSideNavCollapsed(isCollapsed: boolean) {
    this._isSideNavCollapsed.set(isCollapsed);
  }

  toggleSideNav() {
    this._isSideNavCollapsed.update((v) => !v);
  }

  setSelectedSchoolStructureNavItem(item: sideMenuSchoolStructureItem) {
    this._selectedSchoolStructureNavItem.set(item);
  }

  showProgressBar() {
    this._isShowProgressBar.set(true);
  }
  hideProgressBar() {
    this._isShowProgressBar.set(false);
  }
  toggleProgressBar() {
    this._isShowProgressBar.update((v) => !v);
  }

  updateClassName(val: string | null) {
    this._currentClassName.set(val);
  }

  updateLevelName(val: string | null) {
    this._currentLevelName.set(val);
  }

  hideSplashScreen() {
    this._showSplashScreen.set(false);
  }

  showPageSpinner() {
    this._isShowPageSpinner.set(true);
  }
  hidePageSpinner() {
    this._isShowPageSpinner.set(false);
  }
  togglePageSpinner() {
    this._isShowPageSpinner.update((v) => !v);
  }

  public updateChildSelectorVisibility(isVisible: boolean) {
    this._isShowChildSelector.set(isVisible);
  }

  public updateBottomBarVisibility(isVisible: boolean) {
    this._isBottomBarVisible.set(isVisible);
  }

  /**
   * Update header visibility
   * @param isVisible
   */
  public updateHeaderVisibility(isVisible: boolean) {
    this._isHeaderVisible.set(isVisible);
  }

  /**
   * Update selected school info visibility
   * @param isVisible
   */
  public updateSelectedSchoolInfoVisibility(isVisible: boolean) {
    this._isSelectedSchoolInfoVisible.set(isVisible);
  }
}

function getDeepestActivatedRoute(
  route: ActivatedRoute,
): ActivatedRoute | null {
  let currentRoute: ActivatedRoute | null = route;
  while (currentRoute?.firstChild) {
    currentRoute = currentRoute.firstChild;
  }
  return currentRoute;
}
