import { Component, Input } from '@angular/core';
import { HesAuthDirective } from '@auth/hes-auth.directive';
import { IonLabel } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { DsButtonComponent } from '@ds/button/button.component';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { UserProfileColors } from '@shared/enums';
import { UserStatus } from '@shared/enums';

export interface IlinkedGuardian {
  id: string;
  fullName: string;
  relationship: string;
  nationalId: string;
  mobileNumber: string;
  imageUrl?: string;
  profileColor?: UserProfileColors;
  status?: UserStatus;
  onViewProfile: () => void;
  onUnlinkProfile: () => void;
}

@Component({
  selector: 'app-linked-profiles',
  templateUrl: './linked-profiles.component.html',
  standalone: true,
  imports: [
    IonLabel,
    DsButtonComponent,
    TranslocoDirective,
    HesAuthDirective,
    RbacDirective,
    EnumLangPipe,
    AvatarComponent,
  ],
})
export class LinkedProfilesComponent {
  @Input() translocoPath: string;
  @Input() linkedProfiles: Array<IlinkedGuardian>;
  @Input() viewProfileRoles: Array<string>;
  @Input() viewProfilePermissionId: number;
  @Input() unlinkProfileRoles: Array<string>;
  @Input() unLinkProfilePermissionId: number;
  @Input() header: string;
  readonly UserStatus = UserStatus;
  userProfileColors = UserProfileColors;
}
