import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { Gender, UserType } from '@shared/enums';
import {
  IonPopover,
  IonList,
  IonItem,
  IonImg,
} from '@ionic/angular/standalone';
import { randomId } from '@shared/utils/randomId';
import { NgIconComponent } from '@ng-icons/core';
import { HesInitialsPipe } from '@shared/pipes/hes-name-initials.pipe';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-regular-svg-icons';
import { FaIconComponentsProps } from '@shared/types';
import { isMobile, isRtl } from '@utils/platform';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { settingPermissions } from '@pages/settings/settings.page';
import { StudentsService } from '@pages/user-management/students/students.service';

@Component({
  selector: 'app-header-user-info',
  templateUrl: './header-user-info.component.html',
  standalone: true,
  imports: [
    IonItem,
    IonList,
    IonPopover,
    CommonModule,
    TranslocoDirective,
    NgIconComponent,
    HesInitialsPipe,
    RouterLink,
    IonImg,
  ],
})
export class HeaderUserInfoComponent implements OnInit {
  private readonly rbac = inject(RoleBaseAccessControlService);
  private studentService = inject(StudentsService);
  protected auth = inject(AuthService);
  protected schoolStructureScopeService = inject(SchoolStructureScopeService);
  readonly isSchoolStructureEmpty =
    this.schoolStructureScopeService.isSchoolStructureEmpty();
  isMobile = isMobile();
  randomId: string = randomId();
  gender = Gender;
  readonly arrowRightIcon: FaIconComponentsProps = {
    icon: isRtl() ? faChevronLeft : faChevronRight,
    size: 'lg',
  };
  user = computed(() => {
    return this.auth.user();
  });

  userProfileUrl = signal(this.getUserProfileRoute());
  prodilePictureUrl = signal<string | null>(null);

  actions = computed(() => {
    const isSchoolStructureEmpty =
      this.schoolStructureScopeService.isSchoolStructureEmpty();
    const actionsArray = [
      {
        texti18nKey: 'global.profile.title',
        icon: 'saxUserOutline',
        routerLink: this.userProfileUrl(),
      },
      {
        texti18nKey: 'global.help_center.title',
        icon: 'saxInfoCircleOutline',
        routerLink: '/support-hub',
      },
      ...(!isSchoolStructureEmpty &&
      this.rbac.hasEveryPermission(settingPermissions())
        ? [
            {
              texti18nKey: 'global.settings.title',
              icon: 'saxSetting2Outline',
              routerLink: 'settings',
            },
          ]
        : []),
      {
        texti18nKey: 'global.logout.btn',
        icon: 'saxLogout1Outline',
        onClick: () => {
          this.auth.logout();
        },
      },
    ];
    if (this.auth.isLoggedInAsOtherUser() && this.isMobile) {
      actionsArray.unshift({
        texti18nKey: 'global.back_to_admin_account.btn',
        icon: 'saxArrowLeft2Outline',
        onClick: () => {
          this.backToAdmin();
        },
      });
    }
    return actionsArray;
  });

  ngOnInit() {
    if (this.user()?.type === UserType.STUDENT) {
      this.studentService
        .getStudent(this.user()?.userTypeId!)
        .subscribe((student) => {
          this.prodilePictureUrl.set(student.imageUrl);
        });
    }
  }

  getUserProfileRoute() {
    switch (this.user()!.type) {
      case UserType.STUDENT:
        return `user-management/students/${this.user()?.userTypeId}`;
      case UserType.GUARDIAN:
        return `user-management/guardians/${this.user()?.userTypeId}`;
      case UserType.PERSONNEL:
        return `user-management/personnels/${this.user()?.userTypeId}`;
    }
  }

  backToAdmin() {
    this.auth.restoreOriginalProfileData();
  }
}
