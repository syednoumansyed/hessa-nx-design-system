import {
  Component,
  computed,
  inject,
  input,
  NgZone,
  OnInit,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenu,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIcon } from '@ng-icons/core';
import { LayoutService } from '@layout/layout.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';
import { AnimationItem } from 'lottie-web';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { AnimatedIconComponent } from '../animated-icon/animated-icon.component';
import { AcademicYearSelectionComponent } from '@layout/components/academic-year-selection/academic-year-selection.component';
import { AcademicYearSelectionPopoverComponent } from '@layout/components/academic-year-selection-popover/academic-year-selection-popover.component';
import { SchoolSelectorComponent } from '../school-selector/school-selector.component';
import { SchoolScopeSelectorComponent } from '../school-scope-selector/school-scope-selector.component';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { DsMenuComponent } from '@ds/popup/ds-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { faCircleChevronUp } from '@fortawesome/pro-regular-svg-icons';

import {
  DS_TRANSLATION_TOKEN,
  DsTranslationService,
} from '@ds/i18n/ds-translation.token';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsTooltipDirective } from '@ds/tooltip/ds-tooltip.directive';
import { getAccessibleRoutePath } from '@layout/utils/get-accessible-route-path.util';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { StudentsService } from '@pages/user-management/students/students.service';
import { GuardianService } from '@pages/user-management/guardians/guardians.service';
import { PersonnelService } from '@pages/user-management/personnels/personnel.service';
import { ConnectedProfile } from '@shared/dto-transformation/common';
import { Guardian, Personnel, Student } from '@shared/dto-transformation';
import { isEmpty } from '@utils/is-empty.util';

export interface ISideMenuItem extends IMenuRoutes {
  clickable?: boolean;
  isShowNavIcon?: boolean;
}

@Component({
  selector: 'ds-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  imports: [
    // Angular Common
    NgClass,
    // Ionic Components
    IonMenu,
    IonContent,
    IonToolbar,
    IonTitle,
    IonHeader,
    IonButtons,
    // Third-party Components
    TranslocoDirective,
    NgIcon,
    // Custom Components
    AvatarComponent,
    AnimatedIconComponent,
    DsMenuComponent,
    DsIconComponent,
    DsTooltipDirective,
  ],
  providers: [
    {
      provide: DS_TRANSLATION_TOKEN,
      useExisting: TranslocoService,
    },
  ],
  standalone: true,
})
export class SideNavComponent implements OnInit {
  // Services
  layoutService = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly auth = inject(AuthService);
  private readonly translocoService = inject(TranslocoService);
  private readonly chatService = inject(ChatService);
  private readonly studentService = inject(StudentsService);
  private readonly guardianService = inject(GuardianService);
  private readonly personnelService = inject(PersonnelService);

  // Inputs
  allMenuItems = input<ISideMenuItem[]>([]);
  username = input<string>();
  userType = input<string>();
  isShowBottomUserCard = input<boolean>(true);
  appVersion = input<string>('');
  readonly routePathResolver = getAccessibleRoutePath();

  unreadChatCount = computed(() => {
    return this.chatService.totalUnreadCount();
  });

  // Outputs
  menuItemClick = output<{
    item: ISideMenuItem;
    id: string;
    event: MouseEvent;
  }>();

  // Computed properties
  isSideNavCollapsed = this.layoutService.isSideNavCollapsed;
  isSchoolStructureEmpty =
    this.schoolStructureScopeService.isSchoolStructureEmpty;
  copyRightYear = new Date().getFullYear();

  // Animation management
  private animationPlayFunctions = new Map<string, () => void>();
  public userMenuItems: PopupItem[] = [];
  private selectedLanguage: string;
  public arrowIconForMenu = faCircleChevronUp;
  public isUserMenuOpen = false;
  public userMenuPosition: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'bottom',
    },
  ];
  private userId: number | undefined = this.auth.user()?.userTypeId;
  typeDisplay = this.auth.typeDisplay;
  constructor() {}

  ngOnInit() {
    this.selectedLanguage = this.translocoService.getActiveLang();
    this.initUserMenuItems();
    this.fetchProfileAndBuildSwitchMenu();
  }

  private initUserMenuItems() {
    this.userMenuItems = [
      {
        id: 'profile',
        title: 'global.profile.title',
        icon: 'profile',
        state: 'default',
        action: () => this.handleUserProfileNavigation(),
      },
      {
        id: 'settings',
        title: 'global.settings.title',
        icon: 'settings',
        state: 'default',
        action: () => this.router.navigate(['settings']),
        visible: this.auth.isUserPersonnel(),
      },
      {
        id: 'support',
        title: 'global.help_center.title',
        icon: 'help&support',
        state: 'default',
        action: () => this.router.navigate(['/help-center']),
      },
      {
        id: 'change-language',
        title: 'global.change_language.txt',
        icon: 'change-language',
        state: 'default',
        children: [
          {
            id: 'arabic',
            title: 'العربية',
            selected: this.selectedLanguage === 'ar',
            action: () => this.changeLanguageAndReload('ar'),
            selectable: true,
          },
          {
            id: 'english',
            title: 'English',
            selected: this.selectedLanguage === 'en',
            action: () => this.changeLanguageAndReload('en'),
            selectable: true,
          },
        ],
      },
      {
        id: 'logout',
        title: 'global.logout.btn',
        icon: 'logout',
        state: 'danger',
        action: () => this.logout(),
      },
    ];
  }

  public onUserMenuOpened(): void {
    this.isUserMenuOpen = true;
  }

  public onUserMenuClosed(): void {
    this.isUserMenuOpen = false;
  }

  private handleUserProfileNavigation() {
    this.router.navigate(['/profile']);
  }

  private changeLanguageAndReload(language: string) {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, language);
    this.schoolStructureScopeService.saveUserSetting$().subscribe({
      next: () => window.location.reload(),
      error: () => window.location.reload(),
    });
  }

  private logout() {
    this.auth.logout(true);
  }

  private fetchProfileAndBuildSwitchMenu() {
    const user = this.auth.user();
    if (!user) return;

    switch (user.type) {
      case UserType.STUDENT:
        this.studentService
          .getStudent(user.userTypeId.toString())
          .subscribe((student) => this.addSwitchProfileMenuItem(student));
        break;
      case UserType.GUARDIAN:
        this.guardianService
          .getGuardian(user.userTypeId.toString())
          .subscribe((guardian) => this.addSwitchProfileMenuItem(guardian));
        break;
      case UserType.PERSONNEL:
        this.personnelService
          .getPersonnel(user.userTypeId)
          .subscribe((personnel) => this.addSwitchProfileMenuItem(personnel));
        break;
    }
  }

  private addSwitchProfileMenuItem(profile: Student | Guardian | Personnel) {
    const connectedProfiles = this.getConnectedProfiles(profile);
    if (connectedProfiles.length === 0) return;

    const currentUserType = this.auth.user()?.type;
    const hasOwnProfile = this.auth.user()?.id === profile.userId;

    const children: PopupItem[] = [
      // Current profile (with checkmark)
      {
        id: profile.id?.toString(),
        title: profile.displayName,
        subtitle: this.translocoService.translate(
          'enum.' + (currentUserType || '').toUpperCase(),
        ),
        selected: true,
        selectable: true,
      },
      // Connected profiles
      ...connectedProfiles.map((cp) => ({
        id: cp.id.toString(),
        title: cp.displayName,
        subtitle: this.translocoService.translate(
          'enum.' + cp.type.toUpperCase(),
        ),
        selectable: true,
        selected: false,
        action: () => {
          if (hasOwnProfile && currentUserType !== cp.type) {
            this.auth
              .switchProfile({ id: cp.id, userType: cp.type })
              .subscribe(() => window.location.reload());
          }
        },
      })),
    ];

    const switchItem: PopupItem = {
      id: 'switch-profile',
      title: 'global.switch.btn',
      icon: 'profile-2user',
      state: 'default',
      children,
    };

    // Rebuild the array (new reference) so OnPush ds-menu detects the change
    const logoutIndex = this.userMenuItems.findIndex(
      (item) => item.id === 'logout',
    );
    const newItems = [...this.userMenuItems];
    if (logoutIndex !== -1) {
      newItems.splice(logoutIndex, 0, switchItem);
    } else {
      newItems.push(switchItem);
    }
    this.userMenuItems = newItems;
  }

  private getConnectedProfiles(
    profile: Student | Guardian | Personnel,
  ): ConnectedProfile[] {
    const profiles: ConnectedProfile[] = [];
    const userType = this.auth.user()?.type;

    if (userType === UserType.STUDENT) {
      const s = profile as Student;
      if (s.connectedGuardian && !isEmpty(s.connectedGuardian)) {
        profiles.push(s.connectedGuardian);
      }
      if (s.connectedPersonnel && !isEmpty(s.connectedPersonnel)) {
        profiles.push(s.connectedPersonnel);
      }
    } else if (userType === UserType.GUARDIAN) {
      const g = profile as Guardian;
      if (g.connectedStudents && !isEmpty(g.connectedStudents)) {
        profiles.push(g.connectedStudents);
      }
      if (g.connectedPersonnel && !isEmpty(g.connectedPersonnel)) {
        profiles.push(g.connectedPersonnel);
      }
    } else if (userType === UserType.PERSONNEL) {
      const p = profile as Personnel;
      if (p.connectedStudent && !isEmpty(p.connectedStudent)) {
        profiles.push(p.connectedStudent);
      }
      if (p.connectedGuardian && !isEmpty(p.connectedGuardian)) {
        profiles.push(p.connectedGuardian);
      }
    }

    return profiles;
  }

  /**
   * Send click event when menu item is clicked
   */
  sendClickEvent(item: ISideMenuItem, id: string, event: MouseEvent): void {
    if (item.clickable) {
      // Emit the click event to parent component
      this.menuItemClick.emit({ item, id, event });
    } else {
      // Navigate to the route
      this.router.navigate([this.routePathResolver(item)]);
    }
  }

  /**
   * Save the play function for a specific menu item
   */
  savePlayFunctionForItem(playFunction: () => void, item: IMenuRoutes): void {
    this.animationPlayFunctions.set(item.path, playFunction);
  }

  /**
   * Play Lottie animation on hover
   */
  playLottieAnimation(event: MouseEvent, itemPath: string): void {
    const playFunction = this.animationPlayFunctions.get(itemPath);
    if (playFunction) {
      this.zone.runOutsideAngular(() => {
        playFunction();
      });
    }
  }

  /**
   * Stop Lottie animation on hover leave
   */
  stopLottieAnimation(event: MouseEvent, itemPath: string): void {
    // For now, we'll just log this - you might want to implement stop functionality
    // in your AnimatedIconComponent if needed
  }

  /**
   * Check if device is mobile or tablet
   */
  isMobileOrTablet(): boolean {
    return this.layoutService.isMobileOrTablet();
  }

  /**
   * Check if a route is currently active
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
}
