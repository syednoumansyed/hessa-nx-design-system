import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { DsActionListComponent } from '@ds/action-list/action-list.component';
import { DsActionListConfig, DsActionListItemConfig } from '@ds/action-list';
import { UserType } from '@shared/enums';
import { isEmpty } from '@utils/is-empty.util';
import { IConnectedProfile } from '@shared/components/connected-profile/connected-profile.component';
import { AuthService } from '@auth/auth.service';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { faCheck } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoService } from '@jsverse/transloco';
import { ObjId } from '@shared/interfaces/common.interface';
import { Guardian, Personnel, Student } from '@shared/dto-transformation';

@Component({
  selector: 'app-switch-account',
  templateUrl: './switch-account.component.html',
  styleUrls: ['./switch-account.component.scss'],
  imports: [DsActionListComponent],
})
export class SwitchAccountComponent implements OnInit {
  @Input() userType: UserType;
  @Input() data: Student | Guardian | Personnel | undefined;
  private readonly translocoService = inject(TranslocoService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly modalCtrl = inject(ModalController);
  readonly list = signal<Array<IConnectedProfile> | null>(null);
  readonly hasOwnProfile = signal<boolean>(false);

  config = computed((): DsActionListConfig => {
    const rawList = this.list?.() ?? []; // sidestep the recursive error

    const list: DsActionListItemConfig[] = rawList.map((profile) => ({
      id: profile.id?.toString() || '',
      title: profile.displayName,
      avatar: {
        fullName: profile.displayName,
        size: 'md' as const, // this one is still needed
      },
      supportingText: {
        text: this.translocoService.translate(
          'enum.' + profile.type.toString().toUpperCase(),
        ),
      },
      showSelectionArrow:
        this.hasOwnProfile?.() &&
        this.authService.user?.()?.type === profile.type,
    }));

    const currentProfile: DsActionListItemConfig = {
      id: this.data?.id?.toString() || '',
      title: this.data?.displayName || '',
      avatar: {
        fullName: this.data?.displayName || '',
        size: 'md' as const,
      },
      supportingText: {
        text: this.translocoService.translate(
          'enum.' + (this.userType || '').toUpperCase(),
        ),
      },
      endIconConfig: {
        showArrow: true,
        icon: faCheck,
        size: 'md',
        disableRtlRotate: true,
      },
    };

    return {
      onItemAction: (item: DsActionListItemConfig) => {
        this.modalCtrl.dismiss();
        if (item?.id) {
          this.changeProfile(item.id);
        }
      },
      title: this.translocoService.translate('global.switch.btn'),
      items: [...list, currentProfile],
    };
  });
  constructor() {}

  ngOnInit() {
    this.hasOwnProfile.set(this.authService.user()?.id === this.data?.userId);
    this.setList();
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

  changeProfile(id: ObjId) {
    const list = this.list();
    if (!list) return;

    const profile = list.find((p) => p.id.toString() === id);
    if (profile) {
      this.onClickSwitch(profile);
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
            window.location.reload();
          });
      }
    }
  }

  private getStudentConnectProfile(student: Student) {
    const profile: IConnectedProfile[] = [];
    const { connectedGuardian, connectedPersonnel } = student || {};
    if (connectedGuardian) {
      profile.push(connectedGuardian);
    }
    if (connectedPersonnel) {
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
