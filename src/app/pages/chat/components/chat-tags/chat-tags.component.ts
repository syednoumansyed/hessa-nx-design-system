import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';

import { UserProfileColors } from '@shared/enums';

export interface IChatTag {
  name: string;
  color: UserProfileColors;
}

@Component({
  selector: 'app-chat-tags',
  templateUrl: './chat-tags.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class ChatTagsComponent implements OnInit {
  tags = input<IChatTag[]>([
    { name: 'Geography', color: UserProfileColors.BRAND },
    { name: 'Mathematics', color: UserProfileColors.EMERALD },
  ]);

  colors = {
    [UserProfileColors.BRAND]: 'bg-brand-200 text-brand-600',
    [UserProfileColors.EMERALD]:
      'bg-pastels-emerald-50 text-pastels-emerald-400',
    [UserProfileColors.BLUE]: 'bg-blue-100 text-blue-400',
    [UserProfileColors.GREEN]: 'bg-green-100 text-green-600',
    [UserProfileColors.YELLOW]: 'bg-pastels-yellow-150 text-pastels-yellow-400',
    [UserProfileColors.NEUTRAL]: 'bg-neutral-cool-100 text-neutral-cool-500',
    [UserProfileColors.CORAL]: 'bg-pastels-coral-50 text-pastels-coral-400',
    [UserProfileColors.TEAL]: 'bg-teal-200 text-teal-600',
    [UserProfileColors.PURPLE]: 'bg-purple-100 text-purple-500',
    [UserProfileColors.INDIGO]: 'bg-indigo-50 text-indigo-300',
  };

  tagColorClasses = (color: UserProfileColors) => {
    return this.colors[color] || this.colors[UserProfileColors.NEUTRAL];
  };

  ngOnInit() {}
}
