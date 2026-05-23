import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { UserProfileColors } from '@shared/enums';

/**
 * @ai-hint
 * component: AvatarComponent
 * selector: app-ds-avatar
 * intent: Displays a user's profile photo or a colored initial-letter fallback; used in lists, headers, and profile cards
 * do: Always pass fullName (required); pass imageUrl when a photo is available — component falls back to initials automatically; choose color from UserProfileColors enum to visually distinguish users
 * dont: Don't pass an empty string for fullName — the initial will be blank; don't use sizes smaller than "sm" for interactive tap targets
 * device: No structural device differences; size prop covers xs–4xl for all breakpoints
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: The initial letter display is neutral; border and layout classes are RTL-safe
 * alternatives: DsIconContainerComponent when a generic icon (not a user photo) is needed in the same circular container style
 */
@Component({
  selector: 'app-ds-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  imports: [NgClass],
  standalone: true,
})
export class AvatarComponent {
  fullName = input.required<string>();
  imageUrl = input<string | undefined | null>();
  size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'>('md');
  color = input<UserProfileColors | undefined>(UserProfileColors.NEUTRAL);
  includeBorder = input<boolean>(true);
  image = computed(() => {
    if (this.imageUrl()) {
      return this.imageUrl();
    } else {
      return null;
    }
  });

  colors = {
    [UserProfileColors.BRAND]: 'bg-brand-200',
    [UserProfileColors.EMERALD]: 'bg-emerald-100',
    [UserProfileColors.BLUE]: 'bg-blue-100',
    [UserProfileColors.GREEN]: 'bg-green-100',
    [UserProfileColors.YELLOW]: 'bg-yellow-300',
    [UserProfileColors.NEUTRAL]: 'bg-neutral-cool-100',
    [UserProfileColors.CORAL]: 'bg-coral-100',
    [UserProfileColors.TEAL]: 'bg-teal-200',
    [UserProfileColors.PURPLE]: 'bg-purple-200',
    [UserProfileColors.INDIGO]: 'bg-indigo-50',
  };

  backgroundColorClass = computed(() => {
    const color = this.color();
    return (
      (color && this.colors[color]) || this.colors[UserProfileColors.NEUTRAL]
    );
  });

  sizeClasses = computed(() => {
    const sizeMap = {
      xs: 'h-[20px] w-[20px] !text-sm',
      sm: 'h-[28px] w-[28px] !text-sm',
      md: 'h-[32px] w-[32px] !text-base',
      lg: 'h-[36px] w-[36px] !text-lg',
      xl: 'h-[40px] w-[40px] !text-xl',
      '2xl': 'h-[64px] w-[64px] !text-xl',
      '3xl': 'h-[84px] w-[84px] !text-3xl',
      '4xl': 'h-[100px] w-[100px] !text-3xl',
    };
    return sizeMap[this.size()] || sizeMap['md'];
  });

  colorClass = computed(() => this.color() ?? '');

  getInitial(): string {
    const fullName = this.fullName();
    if (!fullName) {
      return '';
    }

    return fullName.trim().charAt(0).toUpperCase();
  }
}
