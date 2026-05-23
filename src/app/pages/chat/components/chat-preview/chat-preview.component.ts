import { Component, computed, inject, input, OnInit } from '@angular/core';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faCheck, faCheckDouble } from '@fortawesome/pro-light-svg-icons';
import { provideIcons } from '@ng-icons/core';
import { saxCheckOutline } from '@ng-icons/iconsax/outline';
import {
  ConversationType,
  Gender,
  MessageType,
  UserProfileColors,
} from '@shared/enums';
import { ChannelIconComponent } from '@pages/chat/components/channel-icon/channel-icon.component';
import { ChatTimePipe } from '@shared/pipes/chat-time.pipe';
import { CommonModule } from '@angular/common';
import {
  faCamera,
  faVideo,
  faMicrophone,
  faFile,
  faBan,
} from '@fortawesome/pro-solid-svg-icons';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { ChatService } from '@pages/chat/data-access/chat.service';

interface UserMetadata {
  gender: Gender;
  profileColor?: UserProfileColors;
  imageUrl?: string;
}

@Component({
  selector: 'app-chat-preview',
  templateUrl: './chat-preview.component.html',
  standalone: true,
  imports: [
    DsIconComponent,
    AvatarComponent,
    ChannelIconComponent,
    ChatTimePipe,
    CommonModule,
    TranslocoDirective,
  ],
  viewProviders: [
    provideIcons({
      saxCheckOutline,
    }),
  ],
})
export class ChatPreviewComponent implements OnInit {
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly chatService = inject(ChatService);

  activeConversationId = this.chatService.activeConversationId;

  conversation = input<CometChat.Conversation>();
  currentUserId = input<string>();
  conversationType = ConversationType;
  userProfileColors = UserProfileColors;
  messageType = MessageType;
  faCheck = faCheck;
  faCheckDouble = faCheckDouble;
  faCamera = faCamera;
  faVideo = faVideo;
  faAudio = faMicrophone;
  faFile = faFile;
  faBan = faBan;

  metadata = computed(() => {
    const c = this.conversation();
    if (!c) return null;
    const withObj: any = c.getConversationWith?.() ?? c['conversationWith'];
    return withObj?.getMetadata?.() ?? withObj?.metadata ?? null;
  });

  isUser = computed(() => {
    const c = this.conversation();
    if (!c) return false;
    return c.getConversationType() === ConversationType.USER;
  });

  title = computed(() => {
    const md: any = this.metadata();
    return md?.displayName ?? '';
  });

  profileColor = computed(() => {
    return (
      (this.metadata()?.profileColor as UserProfileColors) ||
      UserProfileColors.NEUTRAL
    );
  });

  imageUrl = computed(() => {
    return this.metadata()?.imageUrl as string;
  });

  ngOnInit() {}

  getLastMessageType(): MessageType | null {
    const msg = this.getLastMessage();
    if (!msg) return null;
    return msg?.getType?.() ?? msg?.type ?? null;
  }

  getLastMessageText(): string {
    const type = this.getLastMessageType();
    if (!type) return '';

    if (type === this.messageType.GROUP_MEMBER) return '';

    if (type === this.messageType.TEXT) {
      const msg = this.getLastMessage();
      return msg?.getText?.() ?? msg?.text ?? '';
    }

    switch (type) {
      case this.messageType.AUDIO:
        return this.hesTranslateService.t('chats.audio.txt');
      case this.messageType.IMAGE:
        return this.hesTranslateService.t('chats.photo.txt');
      case this.messageType.VIDEO:
        return this.hesTranslateService.t('chats.video.txt');
      case this.messageType.FILE:
        return this.hesTranslateService.t('chats.file.txt');
      default:
        return '';
    }
  }

  getLastMessageMediaIcon() {
    const type = this.getLastMessageType();
    switch (type) {
      case this.messageType.AUDIO:
        return this.faAudio;
      case this.messageType.IMAGE:
        return this.faCamera;
      case this.messageType.VIDEO:
        return this.faVideo;
      case this.messageType.FILE:
        return this.faFile;
      default:
        return undefined;
    }
  }

  getUnreadCount(): number {
    const c = this.conversation();
    return c?.getUnreadMessageCount?.() ?? c?.['unreadMessageCount'] ?? 0;
  }

  getProfileImage(): string | undefined {
    const c = this.conversation();
    return (c?.getConversationWith?.().getMetadata() as UserMetadata)
      ?.imageUrl as string;
  }

  getLastMessage(): any {
    const conversation = this.conversation();
    if (!conversation) return null;
    return (
      conversation.getLastMessage?.() ?? conversation['lastMessage'] ?? null
    );
  }

  getLastMessageTime(): number | string {
    const msg = this.getLastMessage();
    if (!msg) return 0;
    return msg?.getSentAt?.() ?? msg?.sentAt ?? 0;
  }

  isLastMessageMine(): boolean {
    const msg = this.getLastMessage();
    if (!msg) return false;
    const sender: any = msg?.getSender?.() ?? msg?.sender;
    const senderId = sender?.getUid?.() ?? sender?.uid ?? sender?.id;
    const myId = this.currentUserId();
    return !!myId && senderId === myId;
  }

  isLastMessageDelivered(): boolean {
    const msg = this.getLastMessage();
    if (!msg) return false;
    const deliveredAt = msg?.getDeliveredAt?.() ?? msg?.deliveredAt;
    return !!deliveredAt;
  }

  isLastMessageRead(): boolean {
    const msg = this.getLastMessage();
    if (!msg) return false;
    const readAt = msg?.getReadAt?.() ?? msg?.readAt;
    return !!readAt;
  }

  getLastMessageStatusIcon() {
    if (this.isLastMessageDelivered() || this.isLastMessageRead()) {
      return this.faCheckDouble;
    }
    return this.faCheck;
  }

  getConversationType(): ConversationType {
    return this.conversation()?.getConversationType() as ConversationType;
  }

  getConversationId(): string {
    return this.conversation()?.getConversationId() ?? '';
  }

  isLastMessageDeleted(): boolean {
    const msg = this.getLastMessage();
    if (!msg) return false;
    return !!(msg?.getDeletedAt?.() ?? msg?.deletedAt);
  }

  isLastMessageDeletedByMe(): boolean {
    return this.isLastMessageDeleted() && this.isLastMessageMine();
  }

  isTyping(): boolean {
    return !!(this.conversation() as any)?.__typing;
  }

  getTypingText(): string {
    // const typingByName = (this.conversation() as any)?.__typing_by_name;
    const typingText = this.hesTranslateService.t('chats.typing.txt');
    // if (this.getConversationType() === ConversationType.GROUP && typingByName) {
    //   return typingByName + ' ' + typingText;
    // }
    return typingText;
  }
}
