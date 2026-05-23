import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { UserType } from '@shared/enums';
import { isEmpty } from '@shared/utils/is-empty.util';
import { Router } from '@angular/router';
import { AuthService } from '@auth/auth.service';
import { DsButtonComponent } from '@ds/button/button.component';
import { Guardian, Personnel, Student } from '@shared/dto-transformation';
import { ConnectedProfile } from '@shared/dto-transformation/common';
export type IConnectedProfile = ConnectedProfile;
@Component({
  selector: 'app-connected-profile',
  templateUrl: './connected-profile.component.html',
  standalone: true,
  imports: [DsButtonComponent, AvatarComponent, TranslocoDirective],
})
export class ConnectedProfileComponent implements OnChanges {
  @Input() userType: UserType;
  @Input() data: Student | Guardian | Personnel | undefined;
  readonly list = signal<Array<IConnectedProfile> | null>(null);
  readonly hasOwnProfile = signal<boolean>(false);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly currentSelectProfile = signal<UserType | undefined>(undefined);
  ngOnChanges(change: SimpleChanges): void {
    if (change['data'].currentValue || change['type'].currentValue) {
      this.setList();
      this.hasOwnProfile.set(this.authService.user()?.id === this.data?.userId);
      this.currentSelectProfile.set(this.authService.user()?.type);
    }
  }

  setList() {
    if (!this.data) {
      return;
    }
    if (this.userType === UserType.STUDENT) {
      this.list.set(this.getStudentConnectProfile(this.data as Student));
    } else if (this.userType === UserType.PERSONNEL) {
      this.list.set(this.getPersonnelConnectProfile(this.data as Personnel));
    } else if (this.userType === UserType.GUARDIAN) {
      this.list.set(this.getGuardianConnectProfile(this.data as Guardian));
    }
  }
  onClickSwitch(profile: IConnectedProfile) {
    if (
      this.hasOwnProfile() &&
      this.authService.user()?.type !== profile.type
    ) {
      const user = this.authService.user();
      if (this.data && user) {
        this.authService
          .switchProfile({
            id: profile.id,
            userType: profile.type,
          })
          .subscribe(() => {
            this.onNavigate(profile, true);
          });
      }
    } else {
      this.onNavigate(profile);
    }
  }

  onNavigate(profile: IConnectedProfile, reload = false) {
    let url: string;
    switch (profile.type) {
      case UserType.PERSONNEL:
        url = `user-management/personnels/${profile.id}`;
        break;
      case UserType.GUARDIAN:
        url = `user-management/guardians/${profile.id}`;
        break;
      case UserType.STUDENT:
        url = `user-management/students/${profile.id}`;
        break;
    }
    if (reload) {
      window.location.href = url;
    } else {
      this.router.navigateByUrl(url);
    }
  }

  private getStudentConnectProfile(student: Student) {
    const profile: IConnectedProfile[] = [];
    const { connectedGuardian, connectedPersonnel } = student || {};
    if (connectedGuardian && !isEmpty(connectedGuardian)) {
      profile.push(connectedGuardian);
    }
    if (connectedPersonnel && !isEmpty(connectedPersonnel)) {
      profile.push(connectedPersonnel);
    }
    return profile;
  }

  private getPersonnelConnectProfile(personnel: Personnel) {
    const profile: IConnectedProfile[] = [];
    const { connectedGuardian, connectedStudent } = personnel || {};
    if (connectedGuardian && !isEmpty(connectedGuardian)) {
      profile.push(connectedGuardian);
    }
    if (connectedStudent && !isEmpty(connectedStudent)) {
      profile.push(connectedStudent);
    }
    return profile;
  }

  private getGuardianConnectProfile(guardian: Guardian) {
    const profile: IConnectedProfile[] = [];
    const { connectedPersonnel, connectedStudents } = guardian || {};
    if (connectedPersonnel && !isEmpty(connectedPersonnel)) {
      profile.push(connectedPersonnel);
    }
    if (connectedStudents && !isEmpty(connectedStudents)) {
      profile.push(connectedStudents);
    }
    return profile;
  }
}
