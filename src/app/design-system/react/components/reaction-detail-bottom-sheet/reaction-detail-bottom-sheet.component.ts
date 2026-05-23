import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import {
  ReactionData,
  ReactionType,
  ReactionUser,
  REACTION_CONFIGS,
  ReactionConfig,
} from '../../types/react.types';
import { DsIconComponent } from '@ds/icon/icon.component';
import { NgIcon } from '@ng-icons/core';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { UserProfileColors, UserType } from '@shared/enums';
import { getLocalizedFullName } from '@shared/utils/localization.util';

interface GroupedReactionData {
  type: ReactionType;
  label: string;
  svgIcon: string;
  users: ReactionUser[];
}

@Component({
  selector: 'ds-reaction-detail-bottom-sheet',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    DsIconComponent,
    AvatarComponent,
    NgIcon,
  ],
  templateUrl: './reaction-detail-bottom-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReactionDetailBottomSheetComponent implements DsModalContentComponent {
  private readonly hesTranslateService = inject(HesTranslateService);

  // Injected by DsModalService wrapper
  closeModal?: (data?: unknown, role?: string) => void;

  reactions = input.required<ReactionData[]>();
  faClose = faXmark;

  selectedFilter = signal<ReactionType | null>(null);

  totalReactionsCount = computed(() => {
    return this.reactions().reduce((sum, r) => sum + r.count, 0);
  });

  groupedReactions = computed((): GroupedReactionData[] => {
    const reactions = this.reactions();
    const filter = this.selectedFilter();

    const filtered = filter
      ? reactions.filter((r) => r.type === filter)
      : reactions;

    return filtered
      .filter((r) => r.count > 0 && r.users && r.users.length > 0)
      .map((r) => {
        const config = this.getReactionConfig(r.type);
        return {
          type: r.type,
          label: config?.label
            ? this.hesTranslateService.t(config.label)
            : r.type,
          svgIcon: config?.svgIcon || '',
          users: r.users || [],
        };
      });
  });

  selectFilter(type: ReactionType | null) {
    this.selectedFilter.set(type);
  }

  getReactionConfig(type: ReactionType): ReactionConfig | undefined {
    return REACTION_CONFIGS.find((c) => c.type === type);
  }

  getUserDisplayName(user: ReactionUser): string {
    return getLocalizedFullName(user);
  }

  getUserType(userType: UserType): string {
    switch (userType) {
      case UserType.STUDENT:
        return this.hesTranslateService.t('global.student.txt');
      case UserType.GUARDIAN:
        return this.hesTranslateService.t(
          'global.linked_guardians.placeholder',
        );
      case UserType.PERSONNEL:
        return this.hesTranslateService.t('global.teacher.title');
      default:
        return '';
    }
  }

  getProfileColor(color: string): UserProfileColors {
    return (color as UserProfileColors) || UserProfileColors.NEUTRAL;
  }

  onClose() {
    this.closeModal?.();
  }
}
