import {
  Component,
  computed,
  HostListener,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  effect,
} from '@angular/core';
import {
  AsyncPipe,
  Location,
  NgClass,
  NgTemplateOutlet,
} from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, interval, map, Observable, Subscription } from 'rxjs';

// Ionic Imports
import {
  IonContent,
  IonMenu,
  IonRouterOutlet,
  IonSplitPane,
  ModalController,
  NavController,
  PopoverController,
} from '@ionic/angular/standalone';

// Third-party Imports
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

// UI Kit Imports
import { BreadcrumbModule } from '@ui-kit/hes-breadcrumbs/breadcrumb.module';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';

// Core Services
import { AuthService } from '@auth/auth.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';

// Layout Services
import { LayoutService } from '@layout/layout.service';
import { PageTitleService } from '@layout/page-title.service';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';
import { TemplateProjectionService } from '@shared/services/template-projection.service';

// Menu & Route Configuration
import { mainMenuRoutes, mobileRoutes } from '../../ds-menu-routes';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';

// Component Imports
import { ClassLevelBadgesComponent } from '@pages/course-management/components/class-level-badges/class-level-badges.component';
import { SchoolSelectorComponent } from '../school-selector/school-selector.component';
import { SchoolScopeSelectorComponent } from '../school-scope-selector/school-scope-selector.component';
import { SchoolStructureTreeComponent } from '../school-structure-tree/school-structure-tree.component';
import { SelectedSchoolInfoComponent } from '../selected-school-info/selected-school-info.component';
import {
  DsStudentSelectorComponent,
  Student,
} from '@ds/student-selector/student-selector.component';

// Utilities
import { isRtl } from '@shared/utils/platform';
import { StructureDepth } from '@shared/utils/school-structure';
import { settingPermissions } from '@pages/settings/settings.page';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';
import { HttpClient } from '@angular/common/http';
import { UnreadNotificationService } from '@shared/services/unread-notification.service';
import { NotificationService } from '../../../pages/notification/data-access/notification.service';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { HesSubscription } from '@utils/hes-subscription.util';
import { BottomNavBarComponent } from '../bottom-nav-bar/bottom-nav-bar.component';
import {
  ISideMenuItem,
  SideNavComponent,
} from '../side-nav/side-nav.component';
import { HeaderComponent } from '../header/header.component';
import { AcademicYearSelectorComponent } from '../academic-year-selector/academic-year-selector.component';
import { AcademicYearSelectionComponent } from '../academic-year-selection/academic-year-selection.component';
import { ThemeManagerService } from '@shared/services/theme-manager.service';
import { BackgroundThemeService } from '@core/services/background-theme.service';
import { JournalFeedWrapperComponent } from './journal-feed-container/journal-feed-container';
import { StudentsJournalsService } from '@ds-layout/services/student-journals.service';
import { HomeEmptyStateComponent } from '../home-empty-state/home-empty-state.component';
import { FirebasePushNotificationService } from '@shared/services/firebase-push-notification.service';
import { StudentStatusService } from '@core/student-status.service';
import { UserStatus } from '@shared/enums';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';

interface UnreadCount {
  users: { [key: string]: number };
  groups: { [key: string]: number };
}

/**
 * Main Layout Component
 * Handles responsive layout with desktop sidebar and mobile bottom navigation
 * Supports three breakpoints: Mobile (<600px), Tablet (600-840px), Desktop (841px+)
 */
@Component({
  selector: 'ds-app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [
    // Angular Common
    AsyncPipe,
    NgTemplateOutlet,
    // Ionic Components
    IonRouterOutlet,
    IonSplitPane,
    IonContent,
    IonMenu,
    // Third-party Components
    FaIconComponent,
    TranslocoDirective,
    // UI Kit Components
    BreadcrumbModule,

    // Custom Components
    ClassLevelBadgesComponent,
    SchoolSelectorComponent,
    SchoolScopeSelectorComponent,
    DsStudentSelectorComponent,
    BottomNavBarComponent,
    SideNavComponent,
    HeaderComponent,
    AcademicYearSelectorComponent,
    AcademicYearSelectionComponent,
    JournalFeedWrapperComponent,
    HomeEmptyStateComponent,
    NgClass,
    SelectedSchoolInfoComponent,
    NoDataCardComponent,
  ],
  providers: [SchoolStructureListingService],
  standalone: true,
})
export class DsLayoutComponent implements OnInit, OnDestroy {
  /* ============================================================================
     DEPENDENCY INJECTION
     ============================================================================ */

  // Core Services
  auth = inject(AuthService);
  readonly studentStatusService = inject(StudentStatusService);
  readonly UserStatus = UserStatus;
  router = inject(Router);
  private readonly httpClient = inject(HttpClient);
  private readonly locationService = inject(Location);
  // Add root route for global query param listening
  private readonly rootRoute = inject(ActivatedRoute);
  private readonly themeControllerService = inject(ThemeManagerService);
  private readonly backgroundThemeService = inject(BackgroundThemeService);
  private navCtrl = inject(NavController);

  private readonly currentRoute = signal('');
  readonly isMenuPage = computed(() => this.currentRoute() === '/menu');
  private readonly headerActionsTemplateRef = signal<TemplateRef<any> | null>(
    null,
  );
  /* Variables to control the layout sizing */
  public readonly splitPaneClass = computed(() => {
    const route = this.currentRoute();
    const smallerRoutes = ['/attendance/monthly-detail', '/home'];
    const isShowChildSelector = this.layoutService.isShowChildSelector();
    const isJournalRoute = route.startsWith('/journal');
    const isReportCardRoute = route.startsWith('/report-card');
    const isLmsCoursesRoute = route === '/lms/courses';
    const isLargeDesktopWindow = this.layoutService.windowClass() === 'large';
    const balancedLargeDesktopWithChildSelector =
      (isJournalRoute || isReportCardRoute || isLmsCoursesRoute) &&
      isShowChildSelector &&
      isLargeDesktopWindow;
    const smallRouteWithChildSelector =
      isShowChildSelector && smallerRoutes.includes(route);
    const smallRouteWithNoChildSelector =
      smallerRoutes.includes(route) && !isShowChildSelector;
    const regularRoute = !smallerRoutes.includes(route) && !isShowChildSelector;
    const regularRouteWithChildSelector =
      isShowChildSelector && !smallerRoutes.includes(route);
    const tableRoute = this.isFullWidthRoute();
    switch (true) {
      case balancedLargeDesktopWithChildSelector:
        return 'child-split child-split-balanced';
      case smallRouteWithChildSelector:
        return 'child-split-narrow';
      case smallRouteWithNoChildSelector:
        return 'child-split';
      case regularRoute:
        return 'child-split';
      case tableRoute:
        return 'child-split-table';
      case regularRouteWithChildSelector:
        return 'child-split';
      default:
        return 'child-split';
    }
  });

  // Layout Services
  layoutService = inject(LayoutService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly unreadNotificationService = inject(
    UnreadNotificationService,
  );
  private readonly notificationService = inject(NotificationService);
  private readonly chatService = inject(ChatService);
  private readonly layoutUiControlService = inject(LayoutUiControlService);
  private readonly templateProjectionService = inject(
    TemplateProjectionService,
  );
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translocoService = inject(TranslocoService);

  private readonly firebaseMessage = inject(FirebasePushNotificationService);

  // Domain Services
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly studentSelectionScope = inject(StudentSelectionScopeService);
  private readonly studentsJournalsService = inject(StudentsJournalsService);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  // UI Controllers
  private readonly popoverController = inject(PopoverController);
  private readonly modalController = inject(ModalController);

  /* ============================================================================
     COMPONENT STATE & SIGNALS
     ============================================================================ */

  // Layout state
  isSideNavCollapsed = this.layoutService.isSideNavCollapsed;
  isShowPageSpinner = this.layoutService.isShowPageSpinner;
  isShowClassLevelBadges = signal(false);
  isOffline = signal(false);
  isHideFeature = signal(false);
  isSuperAdmin = this.rbacService.isSuperAdmin();
  private history: string[] = [];
  private readonly subscription = new HesSubscription();
  private pollingSubscription: Subscription | null = null;
  // Platform detection
  isRtl = isRtl();
  isMobileOrTablet = this.layoutService.isMobileOrTablet;
  // Menu configuration
  menu = mainMenuRoutes();
  settingMenuPermission: number[] = settingPermissions();
  selectedStudentId = signal<number | undefined>(undefined);
  isHomePage = signal(false);
  isFullWidthRoute = this.layoutService.isFullWidthRoute;
  // Add a signal to track current breadcrumbs
  private currentBreadcrumbs = signal<any[]>([]);

  /**
   * Check if current route uses the messaging workspace layout (chat / support hub)
   */
  readonly isChatRoute = computed(() => {
    const route = this.currentRoute();
    return ['/chat', '/support-hub'].some((basePath) =>
      route.startsWith(basePath),
    );
  });

  /* ============================================================================
  COMPUTED PROPERTIES
  ============================================================================ */

  /**
   * Mobile page title - prioritizes breadcrumb label over page title
   */
  currentBackground = computed(() => {
    return this.backgroundThemeService.getCurrentBackgroundClass();
  });

  pageTitle = computed(() => {
    // Get the current page title as fallback
    const pageTitle = this.currentPageTitle() ?? '';

    if (this.isMobileOrTablet()) {
      // Get breadcrumb title from signal
      const breadcrumbs = this.currentBreadcrumbs();

      if (breadcrumbs && breadcrumbs.length > 0) {
        const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
        if (lastBreadcrumb && lastBreadcrumb.label) {
          return (
            this.translocoService.translate(lastBreadcrumb.label ?? '') ??
            pageTitle
          );
        }
      }
    }

    return pageTitle;
  });

  public postAnnouncementsUnreadCounts = computed(() => {
    return (
      this.unreadNotificationService.unReadNotificationsCount()?.announcements
        ?.unreadCounts ?? 0
    );
  });

  readonly unreadNotificationCount = this.notificationService.unreadCount;

  /**
   * Get mobile menu items for bottom navigation
   * Filters based on user permissions and role
   * When school structure is empty, only show public items (Home, See All)
   */
  readonly mobileMenuItems = computed(() => {
    const isSchoolStructureEmpty = this.isSchoolStructureEmpty();

    // When school structure is empty, only show public items
    if (isSchoolStructureEmpty) {
      return mobileRoutes.filter((item) => item.isPublic === true);
    }

    return mobileRoutes
      .filter((item) =>
        item.UserTypes
          ? item.UserTypes?.some(
              (userType) => userType === this.auth.user()?.type,
            )
          : true,
      )
      .filter((item) => (item.isHideFromSuperAdmin ? !this.isSuperAdmin : true))
      .filter((item) =>
        !!item.permissions
          ? this.rbacService.hasSomePermission(item.permissions)
          : true,
      );
  });

  mobileRoutes = computed(() =>
    this.mobileMenuItems().map((item) => item.path),
  );

  readonly isNotificationsRoute = computed(
    () => this.currentRoute() === '/notifications',
  );

  readonly isHomeRoute = computed(() => {
    const route = this.currentRoute();
    return route === '/home' || route === '/' || route === '/menu';
  });

  readonly isMobileBottomNavRoute = computed(() => {
    const route = this.currentRoute();
    const mobileRoutePaths = this.mobileRoutes();
    // Check if current route starts with any of the mobile bottom nav routes
    return mobileRoutePaths.some((path) => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return route === normalizedPath || route.startsWith(`${normalizedPath}/`);
    });
  });

  readonly showHeaderNotificationIcon = computed(() => {
    // Manual override from LayoutUiControlService takes priority
    const manualOverride = this.layoutUiControlService.isHeaderIconsVisible();
    if (manualOverride !== null) return manualOverride;

    if (this.layoutService.isMobileOrTablet()) {
      // Sync with bottom navigation bar visibility on mobile/tablet
      return this.layoutService.isBottomBarVisible();
    }
    return true; // Always show on desktop
  });

  readonly mobileHeaderActionsTemplate = computed(() =>
    this.layoutService.isMobileOrTablet() && this.isNotificationsRoute()
      ? this.headerActionsTemplateRef()
      : null,
  );

  /**
   * Get desktop menu routes (sidebar)
   * Filters and organizes menu items based on user permissions
   */
  readonly menuRoutes = computed(() => {
    const isSchoolStructureEmpty = this.isSchoolStructureEmpty();
    let filterMenu: ISideMenuItem[] = [];

    if (isSchoolStructureEmpty) {
      filterMenu = this.menu()
        .filter((item: ISideMenuItem) => item.isPublic === true)
        .map((item: ISideMenuItem) => ({
          ...item,
          placement: 'upper' as const,
        }));
    } else {
      filterMenu = this.menu()
        .filter((item: ISideMenuItem) =>
          item.UserTypes
            ? item.UserTypes?.some(
                (userType) => userType === this.auth.user()?.type,
              )
            : true,
        )
        .filter((item: ISideMenuItem) =>
          item.isHideFromSuperAdmin ? !this.rbacService.isSuperAdmin() : true,
        )
        .filter((item: ISideMenuItem) =>
          !!item.permissions
            ? this.rbacService.hasSomePermission(item.permissions)
            : true,
        );
    }

    return {
      upper: filterMenu.filter((item) => item.placement === 'upper'),
      lower: filterMenu.filter((item) => item.placement === 'lower'),
    };
  });

  /**
   * Get all menu items as a flat array for template iteration
   */
  readonly allMenuItems = computed(() => {
    const routes = this.menuRoutes();
    return [...routes.upper, ...routes.lower];
  });

  /**
   * Student options for student selector
   */
  studentsOptions = computed(() => {
    return this.studentSelectionScope.studentSelectionScope().map((s) => ({
      id: s.id.toString(),
      fullName: s.fullName,
      class: s?.school?.class?.displayName || '',
      level: s?.school?.level?.displayName || '',
      imageUrl: s?.image || '',
      profileColor: s?.profileColor,
      status: s?.status,
    }));
  });

  /**
   * User type computed properties
   */
  isGuardianUser = computed(() => this.auth.user()?.type === 'GUARDIAN');
  isStudentUser = computed(() => this.auth.user()?.type === 'STUDENT');
  isPersonalUser = computed(() => this.auth.user()?.type === 'PERSONNEL');

  /**
   * Check if child selection is required (for Guardian users)
   */
  readonly isChildSelectionRequired = computed(() => {
    return this.layoutService.isChildSelectionRequired();
  });

  readonly isJournalFeedVisible = computed(() => {
    const hasStudents =
      this.studentSelectionScope.studentSelectionScope()?.length > 0;
    const hasJournals = this.studentsJournalsService.hasJournals();
    return (
      this.isHomePage() &&
      this.isGuardianUser() &&
      hasStudents &&
      hasJournals !== false
    );
  });

  /**
   * Layout state computed properties
   */
  selectedStudent = this.studentSelectionScope.selectedStudent;
  currentClassName = this.layoutService.currentClassName;
  currentLevelName = this.layoutService.currentLevelName;
  currentPageTitle = this.pageTitleService.currentPageTitle;
  isSchoolStructureEmpty =
    this.schoolStructureScopeService.isSchoolStructureEmpty;

  /**
   * Navigation state
   */
  isShowBackButton = computed(() => {
    return !!(this.locationService.getState() as any)?.navigationId;
  });

  /* ============================================================================
     OBSERVABLES
     ============================================================================ */

  projectedTemplateRef$: Observable<TemplateRef<any> | null> =
    this.templateProjectionService.templateRef$;

  isBreadcrumbVisible$ = this.layoutUiControlService.isBreadcrumbVisible$;
  isWebBackBtn = this.layoutUiControlService.isShowWebBackBtn;

  readonly breadCrumbRestrictRoutes$ = this.router.events.pipe(
    map(() => this.router.url === '/home'),
  );

  /* ============================================================================
     CONSTANTS
     ============================================================================ */

  protected readonly faCircleWarning = faCircleExclamation;
  protected readonly StructureDepth = StructureDepth;

  canGoBack(): boolean {
    return this.history.length > 1;
  }

  goBack(): void {
    if (this.canGoBack()) {
      // Remove the current URL
      this.history.pop();
      const previousUrl = this.history.pop();
      if (previousUrl) {
        this.router.navigateByUrl(previousUrl);
      }
    }
  }

  chatTrigger() {
    this.router.navigate(['/chat']);
  }

  openNotifications(): void {
    if (this.isMobileOrTablet()) {
      this.navCtrl.navigateRoot('/notifications', { animated: false });
      return;
    }

    this.router.navigate(['/notifications']);
  }

  private async loadVersion() {
    this.httpClient
      .get<{ version: string }>('/assets/json/version.json')
      .subscribe(async (data: { version: string }) => {
        this.layoutService.appVersion.set(data.version);
        const version = await CapacitorUpdater.current();
        if (
          version.bundle.version !== '' &&
          version.bundle.version !== 'builtin' &&
          Capacitor.getPlatform() !== 'web'
        )
          this.layoutService.appVersion.set(version.bundle.version);
      });
  }

  ngOnInit(): void {
    // Avoid calling Firebase related stuff using impersonation
    if (!this.auth.isLoggedInAsOtherUser()) {
      this.firebaseMessage.initPush();
    }
    // Subscribe to breadcrumbs and update signal
    this.subscription.add = this.breadcrumbService.breadcrumbs$.subscribe(
      (breadcrumbs) => {
        this.currentBreadcrumbs.set(breadcrumbs || []);
      },
    );

    this.subscription.add =
      this.templateProjectionService.headerActionsTemplateRef$.subscribe(
        (template) => {
          this.headerActionsTemplateRef.set(template);
        },
      );

    // Initial check for home page state
    const initialIsHomeOrMenuPage =
      this.router.url === '/home' || this.router.url === '/menu';
    this.isHomePage.set(initialIsHomeOrMenuPage);
    this.currentRoute.set(this.router.url);

    this.loadVersion();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute.set(this.router.url);
        const nav = this.router.getCurrentNavigation();
        const isReplace = nav?.extras?.replaceUrl;
        if (isReplace && this.history.length > 0) {
          this.history[this.history.length - 1] = event.urlAfterRedirects;
        } else {
          this.history.push(event.urlAfterRedirects);
        }

        const isProfileSettings = event.url
          ?.split('/')
          .find(
            (url: string) => url === 'profile-settings' || url === 'pickup',
          );

        // TODO: remove my-courses when redesign is complete
        const isLMSContentManagement = event.url
          ?.split('/')
          .find((url: string) => url === 'my-courses' || url === 'lms');

        const isCMSContentManagement = event.url
          ?.split('/')
          .find((url: string) => url === 'course-management');

        const isContentManagementTopic = event.url
          ?.split('/')
          .find((url: string) => url === 'topics');

        // Always check current router URL to ensure accurate state
        const currentUrl = this.router.url;
        const isHomeOrMenuPage =
          currentUrl === '/home' || currentUrl === '/menu';
        this.isHomePage.set(isHomeOrMenuPage);

        this.layoutService.updateChildSelectorVisibility(!isProfileSettings);

        if (
          isLMSContentManagement ||
          (isCMSContentManagement && isContentManagementTopic)
        ) {
          this.isShowClassLevelBadges.set(true);
        } else this.isShowClassLevelBadges.set(false);
      });
    if (!this.isSchoolStructureEmpty()) {
      this.unreadNotificationService.loadUnreadForSelectedAcademicYear();
    }
    this.notificationService.refreshUnreadCount();
    if (this.rbacService.hasPermission(RESOURCE_PERMISSION.chat.chatListView)) {
      this.chatService.fetchTotalUnreadCount();
    }
    this.startPolling();
    this.setupVisibilityHandling();
    if (this.auth.isUserPersonnel()) {
      this.themeControllerService.setPersonnel();
    } else {
      this.themeControllerService.setStudent();
    }

    // Global deep link sync: update selected student when selectedStudentId query param changes
    this.subscription.add =
      this.router.routerState.root.queryParamMap.subscribe((qp) => {
        const idParam = qp.get('selectedStudentId');
        if (idParam) {
          const parsed = Number(idParam);
          const current = this.studentSelectionScope.selectedStudent()?.id;
          if (!Number.isNaN(parsed) && parsed !== current) {
            const user = this.auth.user();
            const isStudentUser = this.auth.isUserStudent();
            if (
              isStudentUser &&
              user?.userTypeId &&
              user.userTypeId !== parsed
            ) {
              return;
            }
            this.studentSelectionScope.updateSelectedStudent(parsed);
          }
        }
      });

    // Also handle NavigationEnd to catch cases where params change via navigation
    this.subscription.add = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const qp = this.router.routerState.root.snapshot.queryParamMap;
        const idParam = qp.get('selectedStudentId');
        if (idParam) {
          const parsed = Number(idParam);
          const current = this.studentSelectionScope.selectedStudent()?.id;
          if (!Number.isNaN(parsed) && parsed !== current) {
            const user = this.auth.user();
            const isStudentUser = this.auth.isUserStudent();
            if (
              isStudentUser &&
              user?.userTypeId &&
              user.userTypeId !== parsed
            ) {
              return;
            }
            this.studentSelectionScope.updateSelectedStudent(parsed);
          }
        }
      });
  }

  logout() {
    this.auth.logout();
  }

  onLanguageChange(event: any) {
    localStorage.setItem(
      LANGUAGE_LOCAL_STORAGE_KEY,
      event?.detail?.value ?? event,
    );
    this.schoolStructureScopeService.saveUserSetting$().subscribe({
      next: () => window.location.reload(),
      error: () => window.location.reload(),
    });
  }

  @HostListener('window:offline')
  setNetworkOffline(): void {
    this.isOffline.set(true);
  }

  @HostListener('window:online')
  setNetworkOnline(): void {
    this.isOffline.set(false);
  }

  /* ============================================================================
     NAVIGATION METHODS
     ============================================================================ */

  /**
   * Check if a route is currently active
   * Handles both desktop sidebar and mobile bottom navigation
   */
  isActive(item: string): boolean {
    if (!item) return false;

    // Normalize path
    if (!item.startsWith('/')) {
      item = `/${item}`;
    }

    // For mobile/tablet, use exact match for home route
    if (this.isMobileOrTablet()) {
      if (item === '/home' || item === '/') {
        return this.router.url === '/' || this.router.url === '/home';
      }
    }

    return this.router.url.startsWith(item);
  }

  /**
   * Toggle desktop sidebar collapse/expand
   */
  toggleSideNav(): void {
    this.layoutService.toggleSideNav();
  }

  /**
   * Open profile menu (mobile/tablet replacement for sidebar toggle)
   */
  async openProfileMenu(): Promise<void> {
    if (this.isMobileOrTablet()) {
      // Navigate to profile page on mobile/tablet
      this.navCtrl.navigateRoot('/profile-settings', { animated: false });

      // await this.router.navigate(['/profile-settings'], {
      //   state: { animation: 'none' }
      // });
    } else {
      // Desktop fallback - could open a popover here
    }
  }

  /**
   * Open school structure selection (modal on mobile, popover on desktop)
   */
  async openSchoolStructure(eventItem: {
    item: ISideMenuItem;
    id: string;
    event: MouseEvent;
  }): Promise<void> {
    if (this.isMobileOrTablet()) {
      // Mobile: Bottom sheet modal
      const modal = await this.modalController.create({
        component: SchoolStructureTreeComponent,
        breakpoints: [0, 0.5, 0.9],
        initialBreakpoint: 0.5,
        showBackdrop: true,
        backdropDismiss: true,
        cssClass: 'school-structure-bottom-sheet',
      });
      await modal.present();
    } else {
      // Desktop: Popover
      const popover = await this.popoverController.create({
        component: SchoolStructureTreeComponent,
        showBackdrop: true,
        trigger: eventItem.id,
        side: 'end',
        alignment: 'center',
        cssClass: this.isSideNavCollapsed()
          ? 'school-structure-popover collpase'
          : 'school-structure-popover',
        event: event,
        componentProps: {
          onClose: () => popover.dismiss(),
        },
      });
      await popover.present();
    }
  }

  /* ============================================================================
     STUDENT SELECTION
     ============================================================================ */

  /**
   * Handle student selection change
   */
  onStudentChange(student?: Student): void {
    if (!student) return;

    const studentId = parseInt(student.id, 10);
    if (isNaN(studentId)) {
      console.error('Invalid student ID:', student.id);
      return;
    }

    this.selectedStudentId.set(studentId);

    this.studentSelectionScope.updateSelectedStudent(studentId);

    if (studentId) {
      this.schoolStructureScopeService.updateSelectedStructure({
        id: this.selectedStudent()?.school?.id,
        type: 'school',
      } as sideMenuSchoolStructureItem);
    }
  }

  constructor() {
    // Keep selectedStudentId in sync with StudentSelectionScopeService
    effect(() => {
      const id = this.studentSelectionScope.selectedStudent()?.id;
      this.selectedStudentId.set(id ?? undefined);
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener(
      'visibilitychange',
      this.onWebVisibilityChange,
    );
    this.subscription.unsubscribe();
  }

  private pollUnreadCounts(): void {
    this.notificationService.refreshUnreadCount();
    if (this.rbacService.hasPermission(RESOURCE_PERMISSION.chat.chatListView)) {
      this.chatService.fetchTotalUnreadCount();
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingSubscription = interval(60000).subscribe(() => {
      this.pollUnreadCounts();
    });
  }

  private stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  private onNativeAppStateChange(isActive: boolean): void {
    if (isActive) {
      this.pollUnreadCounts();
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  private readonly onWebVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.pollUnreadCounts();
      this.startPolling();
    } else {
      this.stopPolling();
    }
  };

  private setupVisibilityHandling(): void {
    // Web: pause/resume on tab visibility change
    document.addEventListener('visibilitychange', this.onWebVisibilityChange);

    // Native (Capacitor): pause/resume on app state change
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', (state) => {
        this.onNativeAppStateChange(state.isActive);
      });
    }
  }
}
