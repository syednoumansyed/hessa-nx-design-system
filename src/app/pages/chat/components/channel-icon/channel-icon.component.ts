import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { UserProfileColors } from '@shared/enums';
import { faBullhorn } from '@fortawesome/pro-solid-svg-icons';
import { DsIconComponent } from '@ds/icon/icon.component';

@Component({
  selector: 'app-channel-icon',
  templateUrl: './channel-icon.component.html',
  imports: [NgClass, DsIconComponent],
  standalone: true,
})
export class ChannelIconComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
  color = input<UserProfileColors>(UserProfileColors.NEUTRAL);
  faSpeaker = faBullhorn;

  colors = {
    [UserProfileColors.BRAND]: 'bg-brand-200 text-brand-700',
    [UserProfileColors.EMERALD]: 'bg-emerald-100 text-emerald-700',
    [UserProfileColors.BLUE]: 'bg-blue-100 text-blue-700',
    [UserProfileColors.GREEN]: 'bg-green-100 text-green-700',
    [UserProfileColors.YELLOW]: 'bg-yellow-300 text-yellow-700',
    [UserProfileColors.NEUTRAL]: 'bg-neutral-cool-100 text-neutral-cool-700',
    [UserProfileColors.CORAL]: 'bg-coral-100 text-coral-700',
    [UserProfileColors.TEAL]: 'bg-teal-100 text-teal-700',
    [UserProfileColors.PURPLE]: 'bg-purple-200 text-purple-700',
    [UserProfileColors.INDIGO]: 'bg-indigo-50 text-indigo-700',
  };

  sizeClasses = computed(() => {
    const sizeMap = {
      sm: 'h-[40px] w-[40px]',
      md: 'h-[64px] w-[64px]',
      lg: 'h-[84px] w-[84px]',
    };
    return sizeMap[this.size()] || sizeMap['md'];
  });

  colorClass = computed(() => {
    return this.colors[this.color()] || this.colors[UserProfileColors.NEUTRAL];
  });
}
