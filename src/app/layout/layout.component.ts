import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import {
  IonRouterOutlet,
  IonContent,
  IonHeader,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButtons,
  IonFooter,
  IonImg,
  IonProgressBar,
  IonBackdrop,
  IonSpinner,
  IonTabBar,
  IonTabButton,
} from '@ionic/angular/standalone';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { faArrowRightFromBracket } from '@fortawesome/pro-duotone-svg-icons';
import { AuthService } from '@auth/auth.service';
import { HeaderUserInfoComponent } from '@shared/components/header-user-info/header-user-info.component';
import { CommonModule, Location } from '@angular/common';
import { hesIcon } from '@shared/types';
import { filter, map } from 'rxjs';
import { SchoolStructureNavButtonComponent } from './components/school-structure-nav-button/school-structure-nav-button.component';
import { isMobile, isRtl } from '@shared/utils/platform';
import { SchoolStructureNavMenuComponent } from './components/school-structure-nav-menu/school-structure-nav-menu.component';
import { faComments } from '@fortawesome/pro-duotone-svg-icons';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { BreadcrumbModule } from '@ui-kit/hes-breadcrumbs/breadcrumb.module';
import { SchoolScopeSelectionPopoverComponent } from './components/school-scope-selection-popover/school-scope-selection-popover.component';
import { SchoolScopeSelectionButtonComponent } from './components/school-scope-selection-button/school-scope-selection-button.component';
import { AcademicYearSelectionComponent } from './components/academic-year-selection/academic-year-selection.component';
import { AcademicYearSelectionPopoverComponent } from './components/academic-year-selection-popover/academic-year-selection-popover.component';
import { LayoutService } from './layout.service';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { StructureDepth } from '@shared/utils/school-structure';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { AnnouncementService } from '@pages/announcements/data-access/announcement.service';
import { ChatMessageListenerService } from '@pages/chat/chat-message-listener.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { HesSubscription } from '@shared/utils/hes-subscription.util';
import { TemplateProjectionService } from '@shared/services/template-projection.service';
import { Observable } from 'rxjs';
import { StudentSelectionComponent } from './components/student-selection/student-selection.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { LayoutUiControlService } from '@shared/services/layout-ui-control.service';
import { PageTitleService } from './page-title.service';
import { ClassLevelBadgesComponent } from '@pages/course-management/components/class-level-badges/class-level-badges.component';
import {
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faBookOpen,
  faCircleExclamation,
} from '@fortawesome/pro-regular-svg-icons';
import { HesSearchableSelectComponent } from '../ui-kit/hes-searchable-select/hes-searchable-select.component';
import { faAnglesRight } from '@fortawesome/pro-solid-svg-icons';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  saxBook1Outline,
  saxBuildings2Outline,
  saxElement3Outline,
  saxHome2Outline,
  saxInfoCircleOutline,
  saxLogout1Outline,
  saxMessages3Outline,
  saxPeopleOutline,
  saxSetting2Outline,
  saxTicketOutline,
  saxUserOctagonOutline,
  saxUserSearchOutline,
  saxUserOutline,
  saxArrowLeft2Outline,
  saxDocumentCopyOutline,
  saxCarOutline,
  saxRefreshOutline,
} from '@ng-icons/iconsax/outline';

import {
  saxBook1Bold,
  saxElement3Bold,
  saxHome2Bold,
  saxMessages3Bold,
  saxCarBold,
} from '@ng-icons/iconsax/bold';
import { settingPermissions } from '@pages/settings/settings.page';
import { RbacSomeDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { MenuItemComponent } from './components/menu-item/menu-item.component';
import { UnreadNotificationService } from '@shared/services/unread-notification.service';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';
import { mainMenuRoutes } from './menu-routes';
import { IMenuRoutes } from './menu-routes.interface';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { HttpClient } from '@angular/common/http';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { ThemeManagerService } from '@shared/services/theme-manager.service';
import { ChatService } from '@pages/chat/data-access/chat.service';

interface UnreadCount {
  users: { [key: string]: number };
  groups: { [key: string]: number };
}

// Base type for all school structure items
export interface BaseSchoolStructureItem {
  id: number;
  name: string;
  hesIcon: hesIcon;
  icon?: string; // Add the missing icon property
  hasAccess: boolean;
  path: string;
  parentId?: number | null;
  depth: StructureDepth;
}

// Specific type for level items
interface LevelSchoolStructureItem extends BaseSchoolStructureItem {
  type: 'level';
  schoolLevelId: number;
}

// Type for all other school structure entity types
interface OtherSchoolStructureItem extends BaseSchoolStructureItem {
  type: Exclude<SchoolStructureEntityType, 'level'>;
}

// Union type for side menu items
export type sideMenuSchoolStructureItem = (
  | LevelSchoolStructureItem
  | OtherSchoolStructureItem
) & {
  children: sideMenuSchoolStructureItem[];
};

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    IonTabButton,
    IonTabBar,
    IonSpinner,
    IonBackdrop,
    IonProgressBar,
    IonImg,
    IonRouterOutlet,
    IonContent,
    IonHeader,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButtons,
    IonFooter,
    RouterModule,
    FontAwesomeModule,
    TranslocoDirective,
    HeaderUserInfoComponent,
    CommonModule,
    SchoolStructureNavButtonComponent,
    SchoolStructureNavMenuComponent,
    BreadcrumbModule,
    SchoolScopeSelectionPopoverComponent,
    SchoolScopeSelectionButtonComponent,
    AcademicYearSelectionComponent,
    AcademicYearSelectionPopoverComponent,
    StudentSelectionComponent,
    ClassLevelBadgesComponent,
    HesSearchableSelectComponent,
    NgIconComponent,
    RbacSomeDirective,
    MenuItemComponent,
  ],
  providers: [SchoolStructureListingService],
  viewProviders: [
    provideIcons({
      saxHome2Outline,
      saxBuildings2Outline,
      saxUserSearchOutline,
      saxPeopleOutline,
      saxBook1Outline,
      saxMessages3Outline,
      saxUserOctagonOutline,
      saxSetting2Outline,
      saxInfoCircleOutline,
      saxTicketOutline,
      saxLogout1Outline,
      saxHome2Bold,
      saxMessages3Bold,
      saxBook1Bold,
      saxElement3Bold,
      saxElement3Outline,
      saxUserOutline,
      saxArrowLeft2Outline,
      saxDocumentCopyOutline,
      saxCarOutline,
      saxCarBold,
      saxRefreshOutline,
    }),
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  faChat = faComments;
  faAngleLeft = faAngleLeft;
  faAngleRight = faAngleRight;
  faAnglesRight = faAnglesRight;
  faAnglesLeft = faAnglesLeft;
  faCircleWarning = faCircleExclamation;
  isMobile = isMobile();
  isRtl = isRtl();

  faArrowRightFromBracket = faArrowRightFromBracket;
  isHideFeature = false;
  auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly httpClient = inject(HttpClient);

  layoutService = inject(LayoutService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );
  private readonly transloco = inject(TranslocoService);
  private readonly announcementService = inject(AnnouncementService);
  private readonly chatListenerService = inject(ChatMessageListenerService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly layoutUiControlService = inject(LayoutUiControlService);
  private readonly templateProjectionService = inject(
    TemplateProjectionService,
  );
  private readonly pageTitleService = inject(PageTitleService);
  private readonly locationService = inject(Location);
  private readonly chatService = inject(ChatService);
  private readonly unreadNotificationService = inject(
    UnreadNotificationService,
  );
  private readonly themeManagerService = inject(ThemeManagerService);
  private history: string[] = [];

  noMobilePadding = computed(() => {
    return this.layoutService.noMobilePadding() && this.isMobile;
  });

  copyRightYear = new Date().getFullYear();
  isSuperAdmin = this.rbacService.isSuperAdmin();
  currentPageTitle = this.pageTitleService.currentPageTitle;

  isShowProgressBar = this.layoutService.isShowProgressBar;

  projectedTemplateRef$: Observable<TemplateRef<any> | null> =
    this.templateProjectionService.templateRef$;

  currentClassName = this.layoutService.currentClassName;
  currentLevelName = this.layoutService.currentLevelName;
  isShowClassLevelBadges = signal(false);
  appVersion = signal('');

  private readonly subscription = new HesSubscription();
  public postAnnouncementsUnreadCounts = computed(() => {
    return (
      this.unreadNotificationService.unReadNotificationsCount()?.announcements
        ?.unreadCounts ?? 0
    );
  });

  currentPage = signal(this.router.url);
  showSchoolStructureSideMenu = signal(false);
  showMainMobileHeader = signal(false);
  isOffline = signal(false);

  isSideNavCollapsed = this.layoutService.isSideNavCollapsed;

  readonly personnelPickupRequestGuardPermissionId =
    RESOURCE_PERMISSION.DISMISSAL.UPDATE.PROCESS_PICKUP_REQUEST;
  readonly personnelPickupRequestAdminPermissionId =
    RESOURCE_PERMISSION.DISMISSAL.UPDATE.APPROVE_DENY_PICKUP_REQUEST;
  readonly guardianPickupRequestsPermissionId =
    RESOURCE_PERMISSION.DISMISSAL.CREATE.CREATE_DISMISSAL;
  readonly guardianHistoryPermissionId =
    RESOURCE_PERMISSION.DISMISSAL.READ.VIEW_DISMISSAL_LIST_GUARDIAN;

  private academicYearId?: number =
    this.academicYearScopeService.selectedAcademicYear()?.id;

  selectedLanguage = this.transloco.getActiveLang();

  isGuardianUser = computed(() => {
    return this.auth.user()?.type === 'GUARDIAN';
  });

  isStudentUser = computed(() => {
    return this.auth.user()?.type === 'STUDENT';
  });

  isPersonalUser = computed(() => {
    return this.auth.user()?.type === 'PERSONNEL';
  });

  // TODO: remove this once the redesign is completed
  // coursesRoute = computed(() => {
  //   return this.auth.user()?.type === 'GUARDIAN' ||
  //     this.auth.user()?.type === 'STUDENT'
  //     ? 'my-courses'
  //     : 'course-management';
  // });

  coursesRoute = computed(() => {
    return this.auth.user()?.type === 'GUARDIAN' ||
      this.auth.user()?.type === 'STUDENT'
      ? 'lms'
      : 'course-management';
  });

  private mainMenu = mainMenuRoutes();
  readonly menuRoutes = computed(() => {
    const isSchoolStructureEmpty = this.isSchoolStructureEmpty();
    let filterMenu: IMenuRoutes[] = [];
    if (isSchoolStructureEmpty) {
      filterMenu = this.mainMenu()
        .filter((item) => item.isPublic === true)
        .map((item) => ({ ...item, placement: 'upper' }));
    } else {
      filterMenu = this.mainMenu()
        .filter((item) =>
          item.UserTypes
            ? item.UserTypes?.some(
                (userType) => userType === this.auth.user()?.type,
              )
            : true,
        )
        .filter((item) =>
          item.isHideFromSuperAdmin ? !this.rbacService.isSuperAdmin() : true,
        )
        .filter((item) =>
          !!item.permissions
            ? this.rbacService.hasSomePermission(item.permissions)
            : true,
        )
        .filter((item) => (this.isHideFeature ? item.isHide !== true : item));
    }
    return {
      upper: filterMenu.filter((item) => item.placement == 'upper'),
      lower: filterMenu.filter((item) => item.placement === 'lower'),
    };
  });

  // layout control attribute
  isBreadcrumbVisible$ = this.layoutUiControlService.isBreadcrumbVisible$;

  isShowPageSpinner = this.layoutService.isShowPageSpinner;

  isShowBackButton = computed(() => {
    return !!(this.locationService.getState() as any)?.navigationId;
  });

  isWebBackBtn = this.layoutUiControlService.isShowWebBackBtn;

  settingMenuPermission: number[] = settingPermissions();

  readonly breadCrumbRestrictRoutes$ = this.router.events.pipe(
    map(() => {
      return this.router.url === '/home';
    }),
  );
  isSchoolStructureEmpty =
    this.schoolStructureScopeService.isSchoolStructureEmpty;
  constructor() {
    effect(() => {
      this.academicYearId =
        this.academicYearScopeService.selectedAcademicYear()?.id;
      if (!this.isSchoolStructureEmpty()) {
        this.unreadNotificationService.loadUnreadForSelectedAcademicYear();
      }
    });
    toObservable(this.studentSelectionScopeService.selectedStudent).subscribe(
      (student) => {
        if (student) {
          if (student.school?.id) {
            this.schoolStructureScopeService.updateSelectedStructure({
              id: student.school.id,
              type: 'school',
            } as sideMenuSchoolStructureItem);
          }
          if (student.academicYear?.id) {
            this.academicYearScopeService.updateSelectedAcademicYearbyId(
              student.academicYear?.id,
            );
            const activesemester =
              this.academicYearScopeService.findCurrentOrNearestAcademicYearOrSemester(
                this.academicYearScopeService.selectedAcademicYear()
                  ?.semesters ?? [],
              );
            if (activesemester)
              this.academicYearScopeService.updateSelectedSemester(
                activesemester,
              );
          }
        }
      },
    );
  }

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

  private async loadVersion() {
    this.httpClient
      .get<{ version: string }>('/assets/json/version.json')
      .subscribe(async (data: { version: string }) => {
        this.appVersion.set(data.version);
        const version = await CapacitorUpdater.current();
        if (
          version.bundle.version !== '' &&
          version.bundle.version !== 'builtin' &&
          Capacitor.getPlatform() !== 'web'
        )
          this.appVersion.set(version.bundle.version);
      });
  }

  ngOnInit(): void {
    if (this.router.url.split('/').find((url) => url === 'school-structure')) {
      this.showSchoolStructureSideMenu.set(true);
    } else {
      this.showSchoolStructureSideMenu.set(false);
    }
    this.loadVersion();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const nav = this.router.getCurrentNavigation();
        const isReplace = nav?.extras?.replaceUrl;
        if (isReplace && this.history.length > 0) {
          this.history[this.history.length - 1] = event.urlAfterRedirects;
        } else {
          this.history.push(event.urlAfterRedirects);
        }

        const isSchoolStructure = event.url
          ?.split('/')
          .find((url: string) => url === 'school-structure');

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

        const isHomeOrMenuPage = event.url
          ?.split('/')
          .find(
            (url: string) => url === 'home' || url === 'menu' || url === '404',
          );

        this.showMainMobileHeader.set(!!isHomeOrMenuPage);

        if (
          isLMSContentManagement ||
          (isCMSContentManagement && isContentManagementTopic)
        ) {
          this.isShowClassLevelBadges.set(true);
        } else this.isShowClassLevelBadges.set(false);

        if (isSchoolStructure) {
          this.showSchoolStructureSideMenu.set(true);
        } else {
          this.showSchoolStructureSideMenu.set(false);
        }
      });
    if (!this.isSchoolStructureEmpty()) {
      this.unreadNotificationService.loadUnreadForSelectedAcademicYear();
    }
    const personnel = this.auth.isUserPersonnel();
    if (personnel) {
      this.themeManagerService.setPersonnel();
    } else {
      this.themeManagerService.setStudent();
    }
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

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
  toggleSideNav() {
    this.layoutService.toggleSideNav();
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  @HostListener('window:offline')
  setNetworkOffline(): void {
    this.isOffline.set(true);
  }

  @HostListener('window:online')
  setNetworkOnline(): void {
    this.isOffline.set(false);
  }
}
