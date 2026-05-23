import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, ModalController } from '@ionic/angular/standalone';
import { DsIconComponent } from '@ds/icon/icon.component';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '@auth/auth.service';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { Router } from '@angular/router';
import { UserType } from '@shared/enums';
import { PersonnelService } from '@pages/user-management/personnels/personnel.service';
import { StudentsService } from '@pages/user-management/students/students.service';
import { GuardianService } from '@pages/user-management/guardians/guardians.service';
import { ChangeLanguageComponent } from '../components/change-language/change-language.component';
import { SwitchAccountComponent } from '../components/switch-account/switch-account.component';
import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { IConnectedProfile } from '@shared/components/connected-profile/connected-profile.component';
import { LayoutService } from '@layout/layout.service';
import { isEmpty } from '@utils/is-empty.util';
import { animate, style, transition, trigger } from '@angular/animations';
import { Guardian, Personnel, Student } from '@shared/dto-transformation';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.page.html',
  styleUrls: ['./profile-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DsIconComponent,
    TranslocoPipe,
    AvatarComponent,
    IonContent,
  ],
  animations: [
    trigger('pageSlide', [
      transition(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate(
          '200ms ease-in',
          style({ transform: 'translateX(100%)', opacity: 0.8 }),
        ),
      ]),
    ]),
  ],
})
export class ProfileSettingsPage implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly auth = inject(AuthService);
  private readonly layoutService = inject(LayoutService);
  private readonly personnelService = inject(PersonnelService);
  private readonly studentService = inject(StudentsService);
  private readonly guardianService = inject(GuardianService);
  private readonly router = inject(Router);
  protected readonly faChevronRight = faChevronRight;
  user = this.auth.user;
  typeDisplay = this.auth.typeDisplay;
  userImage = signal<string | null>(null);
  student = signal<Student | undefined>(undefined);
  guardian = signal<Guardian | undefined>(undefined);
  personnel = signal<Personnel | undefined>(undefined);
  profile = signal<Student | Guardian | Personnel | undefined>(undefined);
  appVersion = this.layoutService.appVersion;
  copyRightYear = new Date().getFullYear();

  isShowSwitchAccount = computed(() => {
    const user = this.auth.user();
    const profile = this.profile();

    if (!user || !profile) return false;

    let list: IConnectedProfile[] = [];

    switch (user.type) {
      case UserType.STUDENT: {
        const s = profile as Student;
        if (s.connectedGuardian && !isEmpty(s.connectedGuardian)) {
          list.push(s.connectedGuardian);
        }
        if (s.connectedPersonnel && !isEmpty(s.connectedPersonnel)) {
          list.push(s.connectedPersonnel);
        }
        break;
      }
      case UserType.GUARDIAN: {
        const g = profile as Guardian;
        if (g.connectedStudents && !isEmpty(g.connectedStudents)) {
          list.push(g.connectedStudents);
        }
        if (g.connectedPersonnel && !isEmpty(g.connectedPersonnel)) {
          list.push(g.connectedPersonnel);
        }
        break;
      }
      case UserType.PERSONNEL: {
        const p = profile as Personnel;
        if (p.connectedStudent && !isEmpty(p.connectedStudent)) {
          list.push(p.connectedStudent);
        }
        if (p.connectedGuardian && !isEmpty(p.connectedGuardian)) {
          list.push(p.connectedGuardian);
        }
        break;
      }
    }

    return list.length > 0;
  });

  menuItems = computed(() => [
    {
      title: 'global.profile.title',
      icon: 'profile',
      route: this.getUserProfileRoute(),
    },
    {
      title: 'global.settings.title',
      icon: 'settings',
      route: '/settings',
      isHide: this.user()?.type !== UserType.PERSONNEL,
    },
    {
      title: 'global.change_language.txt',
      icon: 'language',
      route: 'language',
      clickable: true,
      showArrow: true,
    },
    {
      title: this.auth.isUserPersonnel()
        ? 'global.help_center.title'
        : 'enum.HELP_AND_SUPPORT',
      icon: 'help',
      route: '/support-hub',
    },
    {
      title: 'global.switch.btn',
      icon: 'profile-2user',
      route: 'switch-account',
      isHide: !this.isShowSwitchAccount(),
      showArrow: true,
      clickable: true,
    },
    {
      title: 'global.logout.btn',
      icon: 'logout',
      route: 'logout',
      clickable: true,
      textColor: 'text-content-error',
    },
  ]);
  constructor() {}

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      switch (user.type) {
        case UserType.STUDENT:
          this.getStudent(user.userTypeId.toString());
          break;
        case UserType.GUARDIAN:
          this.getGuardian(user.userTypeId.toString());
          break;
        case UserType.PERSONNEL:
          this.getPersonnel(user.userTypeId);
          break;
      }
    }
  }

  getUserProfileRoute() {
    return '/profile';
  }

  /**
   * Retrieves a personnel by their ID.
   * @param personnelId The ID of the personnel to retrieve.
   */
  getPersonnel(personnelId: string | number) {
    this.personnelService.getPersonnel(personnelId).subscribe((personnel) => {
      this.personnel.set(personnel);
      this.profile.set(personnel);
    });
  }

  /**
   * Retrieves a student by their ID.
   * @param studentId The ID of the student to retrieve.
   */
  getStudent(studentId: string) {
    this.studentService
      .getStudent(studentId)
      .pipe()
      .subscribe((student) => {
        this.userImage.set(student.imageUrl || '');
        this.student.set(student);
        this.profile.set(student);
      });
  }

  /**
   * Retrieves a guardian by their ID.
   * @param guardianId The ID of the guardian to retrieve.
   */
  getGuardian(guardianId: string) {
    this.guardianService
      .getGuardian(guardianId)
      .pipe()
      .subscribe((guardian) => {
        this.guardian.set(guardian);
        this.profile.set(guardian);
      });
  }

  async itemClicked(path: string, clickable?: boolean) {
    if (clickable) {
      if (path === 'logout') {
        this.auth.logout();
      } else if (path === 'language') {
        // open change language modal in a bottom sheet
        this.openChangeLanguageModal();
      } else if (path === 'switch-account') {
        // navigate to switch account page
        this.openSwitchAccountModal();
      }
    } else {
      this.router.navigate([path]);
    }
  }

  async openChangeLanguageModal() {
    const modal = await this.modalCtrl.create({
      component: ChangeLanguageComponent,
      breakpoints: [0, 0.5, 1],
      initialBreakpoint: 1,
      handle: true,
      cssClass: 'respect-safe-area',
    });
    await modal.present();
  }

  async openSwitchAccountModal() {
    let data: Student | Guardian | Personnel | undefined = undefined;
    if (this.user()?.type === UserType.STUDENT) {
      data = this.student();
    } else if (this.user()?.type === UserType.GUARDIAN) {
      data = this.guardian();
    } else if (this.user()?.type === UserType.PERSONNEL) {
      data = this.personnel();
    } else {
      return;
    }
    const modal = await this.modalCtrl.create({
      component: SwitchAccountComponent,
      componentProps: {
        data,
        userType: this.user()?.type,
      },
      breakpoints: [0, 0.8, 1],
      initialBreakpoint: 1,
      handle: true,
    });
    await modal.present();
  }
}
