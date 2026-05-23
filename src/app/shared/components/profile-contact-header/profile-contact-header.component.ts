import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { UserProfileColors } from '@shared/enums';
import { faPen, faPlus } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-profile-contact-header',
  templateUrl: './profile-contact-header.component.html',
  standalone: true,
  imports: [CommonModule, AvatarComponent, DsIconComponent],
})
export class ProfileContactHeaderComponent {
  @Input() fullName = '';
  @Input() phoneNumber = '-';
  @Input() imageUrl: string | null = null;
  @Input() profileColor: UserProfileColors = UserProfileColors.NEUTRAL;
  showEditIcon = input<boolean>();
  @Output() editIconClick = new EventEmitter<void>();

  protected readonly UserProfileColors = UserProfileColors;
  protected readonly faPlus = faPlus;
  protected readonly faPen = faPen;
}
