import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  computed,
  input,
  viewChild,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextMessageComponent } from '../text-message/text-message.component';
import { VideoMessageComponent } from '../video-message/video-message.component';
import { FileMessageComponent } from '../file-message/file-message.component';
import { ImageMessageComponent } from '../image-message/image-message.component';
import { VoiceMessageComponent } from '../voice-message/voice-message.component';
import { FaIconComponentsProps } from '@shared/types';
import {
  faAngleDown,
  faBan,
  faCheck,
  faCheckDouble,
  faFaceSmile,
  faPenToSquare,
  faReply,
  faTrashCan,
} from '@fortawesome/pro-regular-svg-icons';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { firstValueFrom, Subscription } from 'rxjs';
import {
  IonPopover,
  ModalController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';
import { PopoverController } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { BaseMessage, CometChat } from '@cometchat/chat-sdk-javascript';
import { AuthService } from '@auth/auth.service';
import { UserProfileColors, UserType } from '@shared/enums';
import { LongPressDirective } from '@shared/directives/long-press.directive';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import {
  REACTION_CONFIGS,
  ReactionType,
  ReactionConfig,
  reactionMappingForCometChat,
} from '@ds/react/types/react.types';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DEFAULT_EMOJI_LIST } from '@pages/chat/constants/emoji.constant';
import { ChatModalService } from '@pages/chat/chat-modal.service';
import { DsTooltipDirective } from '@ds/tooltip/ds-tooltip.directive';
import { ChatService } from '@pages/chat/data-access/chat.service';
import {
  ChatUserMetadata,
  ChatGroupMetadata,
} from '@pages/chat/data-access/chat.interface';
import { ChatMessageListenerService } from '@pages/chat/chat-message-listener.service';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss'],
  standalone: true,
  imports: [
    IonPopover,
    CommonModule,
    TextMessageComponent,
    VideoMessageComponent,
    FileMessageComponent,
    ImageMessageComponent,
    VoiceMessageComponent,
    HesTimePipe,
    HesIconComponent,
    TranslocoDirective,
    LongPressDirective,
    DsIconComponent,
    DsTooltipDirective,
    IonSpinner,
  ],
})
export class ChatMessageComponent implements OnInit, OnDestroy {
  @ViewChild('mobileReactionsPopover') mobileReactionsPopover: any;
  private readonly chatModalService = inject(ChatModalService);
  private readonly chatService = inject(ChatService);
  private readonly messageListener = inject(ChatMessageListenerService);
  auth = inject(AuthService);
  message = input.required<BaseMessage>();
  loginUserId = input.required<string>();
  isHighlighting = input<boolean>(false);
  senderMetadata = input<any>();
  sendersMetadata = input<Map<string, ChatUserMetadata | ChatGroupMetadata>>();
  videoRef = viewChild(VideoMessageComponent);
  readonly check: FaIconComponentsProps = {
    icon: faCheck,
    size: 'sm',
  };
  readonly doubleCheck: FaIconComponentsProps = {
    icon: faCheckDouble,
    size: 'sm',
  };

  readonly faceSmile: FaIconComponentsProps = {
    icon: faFaceSmile,
    size: 'lg',
  };
  readonly faAngleDown: FaIconComponentsProps = {
    icon: faAngleDown,
    size: 'lg',
  };
  readonly faTrashCan: FaIconComponentsProps = {
    icon: faTrashCan,
    size: 'lg',
  };
  readonly banIcon: FaIconComponentsProps = {
    icon: faBan,
    size: 'lg',
  };

  readonly faEditIcon: FaIconComponentsProps = {
    icon: faPenToSquare,
    size: 'lg',
  };

  readonly faReplyIcon: FaIconComponentsProps = {
    icon: faReply,
    size: 'lg',
  };

  // isMobile = isMobile();
  isMobile = signal(isMobile());

  reactionConfigs = REACTION_CONFIGS;
  defaultEmojiList = DEFAULT_EMOJI_LIST;
  @Output() markAsRead = new EventEmitter<BaseMessage>();
  @Output() markAsDelivered = new EventEmitter<BaseMessage>();
  @Output() addEmoji = new EventEmitter<string>();
  @Output() deleteEmoji = new EventEmitter<string[]>();
  @Output() deleteMessage = new EventEmitter<BaseMessage>();
  @Output() replyMessage = new EventEmitter<BaseMessage>();
  @Output() editMessage = new EventEmitter<BaseMessage>();
  @Output() scrollToMessage = new EventEmitter<number>();
  messageId = computed(() => {
    return this.message().getId();
  });
  sendByMe = computed(() => {
    return this.message().getSender().getUid() === this.loginUserId();
  });

  senderDisplayName = computed(() => {
    const metadata = this.senderMetadata();
    if (metadata && metadata.displayName) {
      return metadata.displayName;
    }
    // Fallback to original sender name
    return this.message().getSender().getName();
  });

  senderColor = computed(() => {
    const metadata = this.senderMetadata();
    if (metadata && metadata.profileColor) {
      return metadata.profileColor;
    }
    return UserProfileColors.NEUTRAL;
  });

  senderTextColorClass = computed(() => {
    const color = this.senderColor();
    return this.getTextColorClass(color);
  });

  private getTextColorClass(color: UserProfileColors): string {
    switch (color) {
      case UserProfileColors.BRAND:
        return 'text-brand-700';
      case UserProfileColors.EMERALD:
        return 'text-emerald-700';
      case UserProfileColors.BLUE:
        return 'text-blue-700';
      case UserProfileColors.GREEN:
        return 'text-green-700';
      case UserProfileColors.YELLOW:
        return 'text-yellow-700';
      case UserProfileColors.CORAL:
        return 'text-coral-700';
      case UserProfileColors.TEAL:
        return 'text-teal-700';
      case UserProfileColors.PURPLE:
        return 'text-purple-700';
      case UserProfileColors.INDIGO:
        return 'text-indigo-700';
      case UserProfileColors.NEUTRAL:
      default:
        return 'text-neutral-700';
    }
  }

  // Helper function to get display name from metadata by sender ID
  private getDisplayNameFromMetadata(senderId: string): string | null {
    const metadata = this.sendersMetadata()?.get(senderId);
    return metadata?.displayName || null;
  }
  messageType = computed(() => {
    return this.message().getType();
  });
  reactions = computed(() => {
    return this.message().getReactions();
  });
  isGroupChat = computed(() => {
    return this.message().getReceiverType() === CometChat.RECEIVER_TYPE.GROUP;
  });
  isPersonnelUser = computed(() => {
    return this.auth.user()?.type === UserType.PERSONNEL;
  });

  // Create reverse mapping from emoji to ReactionType
  private emojiToReactionType = Object.entries(
    reactionMappingForCometChat,
  ).reduce(
    (acc, [reactionType, emoji]) => {
      acc[emoji] = reactionType as ReactionType;
      return acc;
    },
    {} as Record<string, ReactionType>,
  );

  tooltipData = signal<{
    reactionName: string;
    svgIcon: string;
    students: string[];
    guardians: string[];
    teachers: string[];
  } | null>(null);

  isTooltipLoading = signal(false);

  // Computed to determine if tooltip should be enabled
  shouldShowTooltip = computed(() => {
    return !this.isMobile() && this.isPersonnelUser() && this.isGroupChat();
  });

  // Computed property to map reactions to SVG configs
  mappedReactions = computed(() => {
    return this.message()
      .getReactions()
      .map((reaction) => {
        const emoji = reaction.getReaction();
        const reactionType = this.emojiToReactionType[emoji];
        const config = REACTION_CONFIGS.find((c) => c.type === reactionType);

        return {
          original: reaction,
          config: config,
          emoji: emoji,
          count: reaction.getCount(),
          reactedByMe: reaction.getReactedByMe(),
        };
      })
      .filter((item) => item.config); // Only show mapped reactions
  });
  markStatus = computed(() => {
    const message = this.message();
    const localRead = this.localReadAt();
    const localDelivered = this.localDeliveredAt();

    if (message.getReadAt() || (localRead && localRead > 0)) {
      return 'read';
    }
    if (message.getDeliveredAt() || (localDelivered && localDelivered > 0)) {
      return 'delivered';
    }
    return 'sent';
  });
  reactionsCount = computed(() => {
    return this.message()
      .getReactions()
      .reduce(
        (acc: number, item: CometChat.ReactionCount) => acc + item.getCount(),
        0,
      );
  });

  captionText = computed(() => {
    if (this.message().getType() !== CometChat.MESSAGE_TYPE.TEXT) {
      return this.message().getData().text;
    }
    return '';
  });
  isDeleted = computed(() => {
    return (
      this.message().getDeletedAt() ||
      this.message().getData().action === 'deleted'
    );
  });

  isReply = computed(() => {
    const parentId = this.message().getParentMessageId();
    return parentId !== null && parentId !== undefined && parentId !== 0;
  });

  isEdited = computed(() => {
    return (
      this.message().getEditedAt() !== null &&
      this.message().getEditedAt() !== undefined
    );
  });

  replyToSenderName = computed(() => {
    const messageData = this.message().getData() as any;

    // Try multiple ways to get the metadata
    let replyData = null;

    // Check in getData()
    if (messageData && messageData.replyToMessage) {
      replyData = messageData.replyToMessage;
    }

    // Check if there's a metadata property
    if (!replyData && (this.message() as any).metadata) {
      const metadata = (this.message() as any).metadata;
      if (metadata.replyToMessage) {
        replyData = metadata.replyToMessage;
      }
    }

    // Check if metadata is stored in data
    if (!replyData && messageData) {
      // Sometimes metadata might be at root level of data
      Object.keys(messageData).forEach((key) => {
        if (typeof messageData[key] === 'object' && messageData[key]?.sender) {
          replyData = messageData[key];
        }
      });
    }

    if (replyData && replyData.sender) {
      // First try to get display name from metadata using sender ID
      const senderId = replyData.sender.uid || replyData.sender.id;
      if (senderId) {
        const displayName = this.getDisplayNameFromMetadata(senderId);
        if (displayName) {
          return displayName;
        }
      }

      // Fallback to sender name if no metadata found
      return replyData.sender.name || 'User';
    }

    // Fallback: Use fetched parent message
    const parentMsg = this.parentMessage();
    if (parentMsg) {
      const parentSenderId = parentMsg.getSender().getUid();
      const displayName = this.getDisplayNameFromMetadata(parentSenderId);
      return displayName || parentMsg.getSender().getName();
    }

    // Last fallback
    return 'User';
  });

  replyToMessageText = computed(() => {
    const messageData = this.message().getData() as any;

    // Try multiple ways to get the metadata
    let replyData = null;

    // Check in getData()
    if (messageData && messageData.replyToMessage) {
      replyData = messageData.replyToMessage;
    }

    // Check if there's a metadata property
    if (!replyData && (this.message() as any).metadata) {
      const metadata = (this.message() as any).metadata;
      if (metadata.replyToMessage) {
        replyData = metadata.replyToMessage;
      }
    }

    // Check if metadata is stored in data
    if (!replyData && messageData) {
      // Sometimes metadata might be at root level of data
      Object.keys(messageData).forEach((key) => {
        if (typeof messageData[key] === 'object' && messageData[key]?.type) {
          replyData = messageData[key];
        }
      });
    }

    if (replyData) {
      // Handle different message types
      switch (replyData.type) {
        case 'text':
          return replyData.text || 'Text message';
        case 'image':
          return '📷 Image';
        case 'video':
          return '🎥 Video';
        case 'audio':
          return '🎵 Audio';
        case 'file':
          return `📄 ${replyData.fileName || 'File'}`;
        default:
          return 'Message';
      }
    }

    // Fallback: Use fetched parent message
    const parentMsg = this.parentMessage();
    if (parentMsg) {
      const type = parentMsg.getType();
      switch (type) {
        case 'text':
          return parentMsg.getData().text || 'Text message';
        case 'image':
          return '📷 Image';
        case 'video':
          return '🎥 Video';
        case 'audio':
          return '🎵 Audio';
        case 'file':
          const attachments = parentMsg.getData().attachments;
          const fileName =
            attachments && attachments[0] ? attachments[0].name : 'File';
          return `📄 ${fileName}`;
        default:
          return 'Message';
      }
    }

    // Last fallback
    return 'Message';
  });
  private readonly subscripiton = new Subscription();
  private intersectionObserver: IntersectionObserver;
  isMobileReactionsOpen = signal(false);
  private parentMessage = signal<BaseMessage | null>(null);
  private localDeliveredAt = signal<number | null>(null);
  private localReadAt = signal<number | null>(null);

  constructor(
    private elementRef: ElementRef,
    private cd: ChangeDetectorRef,
    public popoverController: PopoverController,
    public modalController: ModalController,
  ) {}

  ngOnInit() {
    this.markStatusAsReciver();

    if (this.isReply()) {
      this.fetchParentMessage();
    }

    this.subscripiton.add(
      this.messageListener.markAsDelivered$.subscribe((receipt) => {
        // Only apply for user (1-1) conversations, not groups
        if (receipt.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP) {
          return;
        }

        if (
          receipt.getMessageId().toString() ===
          this.message().getId().toString()
        ) {
          const timestamp = receipt.getDeliveredAt();
          this.localDeliveredAt.set(timestamp);
        }
      }),
    );

    this.subscripiton.add(
      this.messageListener.markAsRead$.subscribe((receipt) => {
        // Only apply for user (1-1) conversations, not groups
        if (receipt.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP) {
          return;
        }

        if (
          receipt.getMessageId().toString() ===
          this.message().getId().toString()
        ) {
          const timestamp = receipt.getReadAt();
          this.localReadAt.set(timestamp);
        }
      }),
    );
  }

  markStatusAsReciver() {
    if (this.message().getSender().getUid() === this.loginUserId()) {
      return;
    }
    if (!this.message().getDeletedAt()) {
      this.markAsDelivered.emit(this.message());
    }
    if (!this.message().getReadAt()) {
      this.intersection();
    }
  }

  private async fetchParentMessage() {
    const parentId = this.message().getParentMessageId();
    if (parentId) {
      try {
        const parentMessage = await CometChat.getMessageDetails(
          parentId.toString(),
        );
        this.parentMessage.set(parentMessage);
      } catch (error) {
        console.error('Error fetching parent message:', error);
      }
    }
  }

  private intersection() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          this.markAsRead.emit();
          this.intersectionObserver.disconnect();
        }
      },
      {
        threshold: 0.8,
      },
    );
    this.intersectionObserver.observe(this.elementRef.nativeElement);
  }
  onSelectReaction(emoji: string) {
    const myEmojis =
      this.message()
        .getReactions()
        .filter((item: CometChat.ReactionCount) => item.getReactedByMe())
        .map((item: CometChat.ReactionCount) => item.getReaction()) || [];
    const found = myEmojis.find((item: string) => item === emoji);

    if (found) {
      // Remove only this specific reaction
      this.deleteEmoji.emit([emoji]);
    } else {
      // Add this new reaction (keeping existing ones)
      this.addEmoji.emit(emoji);
    }
  }
  onSelectReactionNew(config: ReactionConfig) {
    const emojiReaction =
      reactionMappingForCometChat[config.type as ReactionType];

    if (!emojiReaction) {
      console.warn('Unknown reaction type:', config.type);
      return;
    }

    const myEmojis =
      this.message()
        .getReactions()
        .filter((item: CometChat.ReactionCount) => item.getReactedByMe())
        .map((item: CometChat.ReactionCount) => item.getReaction()) || [];

    const found = myEmojis.find((item: string) => item === emojiReaction);

    if (found) {
      // Remove only this specific reaction
      this.deleteEmoji.emit([emojiReaction]);
    } else {
      // Add this new reaction (keeping existing ones)
      this.addEmoji.emit(emojiReaction);
    }
  }
  async onReactionClicked(react: any) {
    if (react.original.reactedByMe) {
      // Remove this specific reaction
      this.deleteEmoji.emit([react.emoji]);
    } else {
      // Add this reaction (keeping existing ones)
      this.addEmoji.emit(react.emoji);
    }
  }

  async onReactionLongPressed(e: Event) {
    e.stopPropagation();
    if (!this.isGroupChat() || !this.isPersonnelUser() || !this.isMobile()) {
      return;
    }
    this.chatModalService.openReactionDetailModal(
      this.message(),
      this.loginUserId(),
      this.mappedReactions(),
    );
  }

  fetchReactionDetail(messageId: number) {
    let reactionRequest = new CometChat.ReactionsRequestBuilder()
      .setMessageId(messageId)
      .setLimit(20)
      .build();
    return reactionRequest.fetchNext();
  }

  ngOnDestroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.subscripiton.unsubscribe();
  }
  onDeleteMessage() {
    this.deleteMessage.emit(this.message());
  }

  onReplyMessage() {
    this.replyMessage.emit(this.message());
  }

  onScrollToReplyMessage() {
    // First, try to get the actual replied-to message ID from metadata
    const messageData = this.message().getData() as any;
    let targetMessageId: number | null = null;

    // Check in getData() for reply metadata
    if (
      messageData &&
      messageData.replyToMessage &&
      messageData.replyToMessage.id
    ) {
      targetMessageId = messageData.replyToMessage.id;
    }

    // Check if there's a metadata property
    if (!targetMessageId && (this.message() as any).metadata) {
      const metadata = (this.message() as any).metadata;
      if (metadata.replyToMessage && metadata.replyToMessage.id) {
        targetMessageId = metadata.replyToMessage.id;
      }
    }

    // Check if metadata is stored in data at root level
    if (!targetMessageId && messageData) {
      Object.keys(messageData).forEach((key) => {
        if (
          typeof messageData[key] === 'object' &&
          messageData[key]?.id &&
          messageData[key]?.sender
        ) {
          targetMessageId = messageData[key].id;
        }
      });
    }

    // Fallback to parent message ID if no metadata found
    if (!targetMessageId) {
      targetMessageId = this.message().getParentMessageId();
    }

    if (targetMessageId) {
      this.scrollToMessage.emit(targetMessageId);
    }
  }

  protected readonly faPenToSquare = faPenToSquare;

  onEditMessage() {
    this.editMessage.emit(this.message());
  }

  openMobileReactionsMenu(e: Event) {
    if (this.isMobile() && !this.isDeleted()) {
      this.isMobileReactionsOpen.set(true);
      this.mobileReactionsPopover.event = e;
    }
  }

  closeMobileReactionsMenu() {
    this.isMobileReactionsOpen.set(false);
  }

  async onReactionHover(reaction: any) {
    if (!this.shouldShowTooltip()) return;

    this.isTooltipLoading.set(true);
    this.tooltipData.set(null);

    try {
      const reactionDetail = await this.fetchReactionDetail(this.messageId());
      const usersForThisReaction = reactionDetail.filter(
        (r: CometChat.Reaction) => r.getReaction() === reaction.emoji,
      );

      if (usersForThisReaction.length === 0) return;

      const chatIds = usersForThisReaction
        .map((r: CometChat.Reaction) => r.getReactedBy().getUid())
        .join(',');

      const chatsMetadata = await firstValueFrom(
        this.chatService.getChatMetaData(chatIds),
      );

      if (chatsMetadata && chatsMetadata.length > 0) {
        const students: string[] = [];
        const guardians: string[] = [];
        const teachers: string[] = [];

        chatsMetadata.forEach((chatData: any) => {
          const displayName = chatData?.displayName || '';
          const role = chatData.role || '';

          switch (role) {
            case 'student':
              students.push(displayName);
              break;
            case 'guardian':
              guardians.push(displayName);
              break;
            case 'personnel':
              teachers.push(displayName);
              break;
          }
        });

        this.tooltipData.set({
          reactionName: reaction.config?.label || '',
          svgIcon: reaction.config?.svgIcon || '',
          students,
          guardians,
          teachers,
        });
      }
    } catch (error) {
      console.error('Error fetching reaction tooltip data:', error);
    } finally {
      this.isTooltipLoading.set(false);
    }
  }

  onReactionLeave() {
    this.tooltipData.set(null);
    this.isTooltipLoading.set(false);
  }
}
