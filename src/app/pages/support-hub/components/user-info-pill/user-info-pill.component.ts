import { Component, input, output } from '@angular/core';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { UserProfileColors } from '@shared/enums';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

export interface UserInfoPillData {
  readonly fullName: string;
  readonly subtitle?: string;
  readonly imageUrl?: string | null;
  readonly color?: UserProfileColors;
}

@Component({
  selector: 'app-user-info-pill',
  standalone: true,
  imports: [AvatarComponent, DsIconComponent],
  templateUrl: './user-info-pill.component.html',
})
export class UserInfoPillComponent {
  readonly user = input.required<UserInfoPillData>();
  readonly showCloseButton = input<boolean>(true);

  readonly closeClick = output<void>();

  readonly closeIcon = faXmark;
  readonly defaultColor = UserProfileColors.CORAL;

  onCloseClick() {
    this.closeClick.emit();
  }
}
