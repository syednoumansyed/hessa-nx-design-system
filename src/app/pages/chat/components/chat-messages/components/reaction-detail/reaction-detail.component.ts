import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { BaseMessage, CometChat } from '@cometchat/chat-sdk-javascript';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '@ds/icon/icon.component';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { firstValueFrom } from 'rxjs';
import { UserProfileColors } from '@shared/enums';
import {
  ReactionType,
  reactionMappingForCometChat,
  REACTION_CONFIGS,
} from '@ds/react/types/react.types';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { DsModalHeaderConfig } from '@ds/modal/modal.component';

interface IUserMetaData {
  id: string;
  fullName: string;
  imageUrl: string;
  profileColor: UserProfileColors;
  role: string;
  emoji: string;
  reactionType: string;
  svgIcon: string;
}

interface IGroupedReactionData {
  reactionType: string;
  label: string;
  svgIcon: string;
  emoji: string;
  users: IUserMetaData[];
}

@Component({
  selector: 'app-reaction-detail',
  templateUrl: './reaction-detail.component.html',
  standalone: true,
  imports: [CommonModule, DsIconComponent, AvatarComponent],
})
export class ReactionDetailComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly transloco = inject(TranslocoService);

  @Input() message: BaseMessage;
  @Input() loginUserId: string;
  closeModal?: (data?: unknown, role?: string) => void;
  mappedReactions = input<any>();
  reactions = signal<CometChat.Reaction[]>([]);
  groupedReactionData = signal<IGroupedReactionData[]>([]);
  reactionsCount = computed(() => this.reactions().length);

  // Dynamic header config - updates title with reaction count
  headerConfig = computed<DsModalHeaderConfig | undefined>(() => {
    const count = this.reactionsCount();
    return {
      title:
        count > 0
          ? `${count} ${this.transloco.translate('chats.reaction.txt')}`
          : this.transloco.translate('chats.reaction.txt'),
      showCloseButton: true,
    };
  });

  constructor() {}

  ngOnInit() {
    this.fetchReactionDetail();
  }

  private async fetchReactionDetail() {
    const allReactions: CometChat.Reaction[] = [];
    let reactionRequest = new CometChat.ReactionsRequestBuilder()
      .setMessageId(this.message.getId())
      .setLimit(20)
      .build();
    try {
      while (true) {
        const res = await reactionRequest.fetchNext();
        if (!res || res.length === 0) {
          break;
        }
        allReactions.push(...res);

        await this.handleUsersMetadata(res);

        if (res.length < 20) {
          break;
        }
      }
      this.reactions.set(allReactions);
    } catch (error) {
      this.reactions.set([]);
    }
  }

  private async handleUsersMetadata(reactions: CometChat.Reaction[]) {
    const chatIds = reactions
      .map((r) => r.getReactedBy().getUid())
      .filter((uid, index, self) => self.indexOf(uid) === index)
      .join(',');

    if (!chatIds) {
      return;
    }

    try {
      const chatsMetadata = await firstValueFrom(
        this.chatService.getChatMetaData(chatIds),
      );

      if (chatsMetadata && chatsMetadata.length > 0) {
        // Create user data with reactions - handle multiple reactions per user
        const userData: IUserMetaData[] = [];

        chatsMetadata.forEach((chatData: any) => {
          // Find ALL reactions for this user, not just the first one
          const userReactions = reactions.filter(
            (r) => r.getReactedBy().getUid() === chatData.id,
          );

          // Create a separate entry for each reaction type this user has
          userReactions.forEach((userReaction) => {
            const reactionEmoji = userReaction?.getReaction() || '';
            const reactionType =
              Object.keys(reactionMappingForCometChat).find(
                (key) =>
                  reactionMappingForCometChat[key as ReactionType] ===
                  reactionEmoji,
              ) || '';
            const reactionConfig = REACTION_CONFIGS.find(
              (config) => config.type === reactionType,
            );

            if (reactionType) {
              userData.push({
                id: chatData.id,
                fullName: chatData?.displayName || '',
                imageUrl: chatData?.imageUrl || '',
                profileColor:
                  chatData?.profileColor || UserProfileColors.NEUTRAL,
                role: chatData.role || '',
                emoji: reactionEmoji,
                reactionType: reactionType,
                svgIcon: reactionConfig?.svgIcon || '',
              });
            }
          });
        });

        // Group users by reaction type and create grouped data directly
        const grouped = new Map<string, IUserMetaData[]>();
        userData.forEach((user) => {
          if (user.reactionType) {
            if (!grouped.has(user.reactionType)) {
              grouped.set(user.reactionType, []);
            }
            // Check if user already exists in this reaction type group to avoid duplicates
            const existingUserIndex = grouped
              .get(user.reactionType)!
              .findIndex((u) => u.id === user.id);
            if (existingUserIndex === -1) {
              grouped.get(user.reactionType)!.push(user);
            }
          }
        });

        // Convert to grouped reaction data
        const groupedData: IGroupedReactionData[] = [];
        grouped.forEach((users, reactionType) => {
          const config = REACTION_CONFIGS.find((c) => c.type === reactionType);
          const emoji =
            reactionMappingForCometChat[reactionType as ReactionType];

          if (config && users.length > 0) {
            groupedData.push({
              reactionType,
              label: this.hesTranslateService.t(config.label),
              svgIcon: config.svgIcon,
              emoji: emoji || '',
              users,
            });
          }
        });

        // Sort by reaction type for consistent order
        groupedData.sort((a, b) => {
          const order = Object.values(ReactionType);
          return (
            order.indexOf(a.reactionType as ReactionType) -
            order.indexOf(b.reactionType as ReactionType)
          );
        });

        // Merge with existing data
        const currentGroupedData = this.groupedReactionData();
        const mergedData = new Map<string, IGroupedReactionData>();

        // Add existing groups
        currentGroupedData.forEach((group) => {
          mergedData.set(group.reactionType, group);
        });

        // Add/update new groups
        groupedData.forEach((group) => {
          if (mergedData.has(group.reactionType)) {
            // Merge users, avoiding duplicates by user ID
            const existingGroup = mergedData.get(group.reactionType)!;
            const existingUserIds = new Set(
              existingGroup.users.map((u) => u.id),
            );
            const newUsers = group.users.filter(
              (u) => !existingUserIds.has(u.id),
            );
            existingGroup.users.push(...newUsers);
          } else {
            mergedData.set(group.reactionType, group);
          }
        });

        const finalGroupedData = Array.from(mergedData.values()).sort(
          (a, b) => {
            const order = Object.values(ReactionType);
            return (
              order.indexOf(a.reactionType as ReactionType) -
              order.indexOf(b.reactionType as ReactionType)
            );
          },
        );

        this.groupedReactionData.set(finalGroupedData);
      }
    } catch (error) {
      console.log(error);
    }
  }

  onCloseModal(): void {
    this.closeModal?.();
  }

  getUserType(role: string): string {
    switch (role) {
      case 'student':
        return this.hesTranslateService.t('global.student.txt');
      case 'guardian':
        return this.hesTranslateService.t(
          'global.linked_guardians.placeholder',
        );
      case 'personnel':
        return this.hesTranslateService.t('global.teacher.title');
      default:
        return '';
    }
  }
}
