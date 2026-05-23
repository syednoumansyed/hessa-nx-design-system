import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsIconComponent } from 'src/app/design-system/icon/icon.component';
import { provideIcons } from '@ng-icons/core';
import { AvatarComponent } from 'src/app/design-system/avatar/avatar.component';
import {
  saxArrowRight1Outline,
  saxArrowLeft1Outline,
} from '@ng-icons/iconsax/outline';

@Component({
  selector: 'app-profile-prompt',
  standalone: true,
  templateUrl: './profile-prompt.component.html',
  imports: [TranslocoDirective, CommonModule, DsIconComponent, AvatarComponent],
  viewProviders: [
    provideIcons({
      saxArrowRight1Outline,
      saxArrowLeft1Outline,
    }),
  ],
})
export class ProfilePromptComponent {
  @Input() isRtl: boolean = false;
  @Input() profilePic: string = '';
}
