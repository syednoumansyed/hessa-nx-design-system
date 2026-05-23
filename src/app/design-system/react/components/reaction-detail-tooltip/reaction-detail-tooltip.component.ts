import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ReactionData,
  ReactionUser,
  REACTION_CONFIGS,
  ReactionConfig,
} from '../../types/react.types';
import { DsIconComponent } from '@ds/icon/icon.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { UserType } from '@shared/enums';
import { getLocalizedFullName } from '@shared/utils/localization.util';

interface GroupedUsers {
  label: string;
  names: string;
}

@Component({
  selector: 'ds-reaction-detail-tooltip',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, DsIconComponent],
  template: `
    <div *transloco="let t" class="min-w-[200px] max-w-[280px]">
      <!-- Header with reaction icon and label -->
      <div class="mb-ds-md flex items-center">
        <app-ds-icon
          class="!h-[28px] !w-[28px] shrink-0"
          [icon]="reactionConfig()?.svgIcon || ''"
          [size]="28"
        ></app-ds-icon>
        <span class="content-md-high-emphasis text-white">{{
          t(reactionConfig()?.label || '')
        }}</span>
      </div>

      <!-- Grouped users by type -->
      @for (group of groupedUsersByType(); track group.label) {
        <div class="mb-ds-sm">
          <div class="content-sm-high-emphasis mb-ds-xs text-neutral-cool-200">
            {{ group.label }}
          </div>
          <div class="content-sm-mid-emphasis text-neutral-cool-300">
            {{ group.names }}
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactionDetailTooltipComponent {
  private readonly hesTranslateService = inject(HesTranslateService);

  reaction = input.required<ReactionData>();

  reactionConfig = computed((): ReactionConfig | undefined => {
    return REACTION_CONFIGS.find((c) => c.type === this.reaction().type);
  });

  groupedUsersByType = computed((): GroupedUsers[] => {
    const users = this.reaction().users || [];
    const groups: Record<UserType, ReactionUser[]> = {
      [UserType.STUDENT]: [],
      [UserType.GUARDIAN]: [],
      [UserType.PERSONNEL]: [],
    };

    users.forEach((user) => {
      const type = user.userType || UserType.PERSONNEL;
      if (groups[type]) {
        groups[type].push(user);
      }
    });

    const result: GroupedUsers[] = [];

    if (groups[UserType.STUDENT].length > 0) {
      result.push({
        label: this.hesTranslateService.t('global.students.title'),
        names: this.formatUserNames(groups[UserType.STUDENT]),
      });
    }

    if (groups[UserType.GUARDIAN].length > 0) {
      result.push({
        label: this.hesTranslateService.t('global.guardians.title'),
        names: this.formatUserNames(groups[UserType.GUARDIAN]),
      });
    }

    if (groups[UserType.PERSONNEL].length > 0) {
      result.push({
        label: this.hesTranslateService.t('global.personnels.title'),
        names: this.formatUserNames(groups[UserType.PERSONNEL]),
      });
    }

    return result;
  });

  private formatUserNames(users: ReactionUser[]): string {
    return users
      .map((user) => getLocalizedFullName(user))
      .filter((name) => name)
      .join(', ');
  }
}
