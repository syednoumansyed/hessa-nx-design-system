import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { BaseMessage, CometChat } from '@cometchat/chat-sdk-javascript';
import { isMobile } from '@shared/utils/platform';
import { isWithinPauseWindow } from '@shared/utils/time-format.util';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { FaIconComponentsProps } from '@shared/types';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  IonHeader,
  IonFooter,
  IonToolbar,
  IonSpinner,
} from '@ionic/angular/standalone';
import {
  Observable,
  Subscription,
  distinctUntilChanged,
  filter,
  fromEvent,
  map,
  firstValueFrom,
  interval,
} from 'rxjs';
import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DurationPipe } from '@shared/pipes/duration.pipe';
import { MessageComposerComponent } from '../message-composer/message-composer/message-composer.component';
import { DraftMessageComponent } from './components/draft-message/draft-message.component';
import { ChatUserPreviewComponent } from '../chat-user-preview/chat-user-preview.component';
import { ChatMessageListenerService } from '@pages/chat/chat-message-listener.service';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { ConversationType, UserProfileColors } from '@shared/enums';
import { AuthService } from '@auth/auth.service';
import {
  ChatParticipant,
  ChatGroupMetadata,
  ChatUserMetadata,
} from '@pages/chat/data-access/chat.interface';
import { IsSameDayPipe } from '@pages/chat/pipe/is-date-diff.pipe';
import { NotificationPauseBannerComponent } from '../notification-pause-banner/notification-pause-banner.component';

const limit = 20;
@Component({
  selector: 'app-chat-messages',
  standalone: true,
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.scss'],
  host: {
    '[class.mobile-chat]': 'isMobile',
  },
  imports: [
    IonToolbar,
    IonFooter,
    IonHeader,
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    IonContent,
    CommonModule,
    ChatMessageComponent,
    HesIconComponent,
    IsSameDayPipe,
    DurationPipe,
    MessageComposerComponent,
    DraftMessageComponent,
    ChatUserPreviewComponent,
    IonSpinner,
    TranslocoDirective,
    NotificationPauseBannerComponent,
  ],
})
export class ChatMessagesComponent implements OnInit, OnDestroy {
  isMobile = isMobile();
  @Input() closeChatDetail = () => {};
  content = viewChild(IonContent);
  editMessage = signal<BaseMessage | null>(null);
  infinitScroll = viewChild(IonInfiniteScroll);
  chatData = signal<Array<BaseMessage>>([]);
  isEditing = signal(false);
  editText = signal('');
  isReplying = signal(false);
  replyMessage = signal<BaseMessage | null>(null);
  highlightingMessageId = signal<number | null>(null);
  private messageRequest: CometChat.MessagesRequest | null = null;

  // Sender metadata for displaying proper names
  sendersMetadata = signal<Map<string, ChatUserMetadata | ChatGroupMetadata>>(
    new Map(),
  );
  public user = signal<CometChat.User | null>(null);
  public uid = computed(() => this.user()?.getUid());
  public disabled = signal(false);
  public isGroupAdmin = signal<boolean>(false);
  readonly participant = signal<ChatParticipant | null>(null);
  private readonly messageListener = inject(ChatMessageListenerService);
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private readonly translocoService = inject(TranslocoService);
  private readonly auth = inject(AuthService);
  private changeDetector = inject(ChangeDetectorRef);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly chatService = inject(ChatService);
  isShowChevronButton$: Observable<boolean>;
  readonly faChevronDown: FaIconComponentsProps = {
    icon: faChevronDown,
    size: this.isMobile ? 'lg' : 'xl',
  };
  unreadMessageCount = signal(0);
  isTyping = signal(false);
  isGuardianUser = computed(() => this.auth.user()?.type === 'GUARDIAN');
  isStudentUser = computed(() => this.auth.user()?.type === 'STUDENT');
  isAdminBannerVisible = computed(() => this.auth.isLoggedInAsOtherUser());

  // Signal that ticks every minute to trigger re-evaluation of time-based computeds
  private currentTimeTick = signal(Date.now());

  /**
   * Check if the other user in a 1:1 chat has paused their notifications.
   * Only applies to user-type chats (not groups).
   * Calculates in real-time using snoozeStartTime/snoozeEndTime.
   * Re-evaluates every minute via currentTimeTick signal.
   */
  isOtherUserNotificationsPaused = computed(() => {
    // Subscribe to time tick to force re-evaluation every minute
    this.currentTimeTick();

    const selectedChat = this.chatService.selectedChat();
    if (selectedChat?.type !== 'user') return false;

    const metadata = selectedChat.metadata as ChatUserMetadata | undefined;
    return isWithinPauseWindow(
      metadata?.snoozeStartTime,
      metadata?.snoozeEndTime,
    );
  });

  otherUserDisplayName = computed(() => {
    return this.chatService.selectedChat()?.displayName || '';
  });

  @Input() set participantData(value: ChatParticipant | null) {
    this.lastSenderTag.set(null);
    this.participant.set(value);
    this.reset();
    this.isLoading.set(true);
    if (value) this.buildChatHistory(value);
    this.checkIfAdmin();
  }

  chatHeadInfo = computed(() => {
    const selectedChat = this.chatService.selectedChat();
    const metadata = selectedChat?.metadata;

    const profileColor =
      metadata && 'profileColor' in metadata && metadata.profileColor
        ? metadata.profileColor
        : UserProfileColors.NEUTRAL;

    // Determine tags: use subjects if available, otherwise use roles
    let tags: Array<{ name: string; color: UserProfileColors }> = [];
    if (selectedChat?.id.includes('personnel-') && metadata) {
      if ('subjects' in metadata && metadata.subjects?.length) {
        tags =
          metadata.subjects?.map((subject: any) => ({
            name: subject.displayName,
            color: profileColor,
          })) || [];
      } else if ('roles' in metadata) {
        tags =
          (metadata as any).roles?.map((role: any) => ({
            name: role.displayName,
            color: profileColor,
          })) || [];
      }
    }

    const studentNames = this.isStudentUser()
      ? []
      : metadata && 'students' in metadata
        ? metadata.students?.map((student: any) => student.displayName) || []
        : [];

    const info = {
      displayName: metadata?.displayName || '',
      imageUrl: (metadata && 'imageUrl' in metadata
        ? (metadata.imageUrl as string) || ''
        : '') as string,
      profileColor,
      type: selectedChat?.type || ConversationType.USER,
      tags,
      studentNames,
    };
    return info;
  });

  isLoading = signal(false);
  numberSkeleton = Array(8).fill(0);
  private readonly subscription = new Subscription();
  readonly lastSenderTag = signal<string[] | null>(null);
  async ngOnInit() {
    const user = await CometChat.getLoggedinUser();
    this.user.set(user);

    // Update time tick at the start of every minute to re-evaluate snooze window status
    const now = new Date();
    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeoutId = setTimeout(() => {
      this.currentTimeTick.set(Date.now());
      this.subscription.add(
        interval(60000).subscribe(() => this.currentTimeTick.set(Date.now())),
      );
    }, msUntilNextMinute);
    this.subscription.add({ unsubscribe: () => clearTimeout(timeoutId) });

    this.subscription.add(
      this.messageListener.message$
        .pipe(
          filter((message) => {
            const participant = this.participant();
            if (!participant) return false;

            const messageReceiverType = message.getReceiverType();
            const messageReceiverId = message.getReceiverId();
            const messageSenderId = message.getSender().getUid();

            // Check if this message belongs to the current conversation
            if (participant.type === 'user') {
              // For 1-1 chats: message must be a user message and either sent to or from the participant
              return (
                messageReceiverType === CometChat.RECEIVER_TYPE.USER &&
                (messageReceiverId === participant.id ||
                  messageSenderId === participant.id)
              );
            } else {
              // For group chats: message must be a group message sent to the current group
              return (
                messageReceiverType === CometChat.RECEIVER_TYPE.GROUP &&
                messageReceiverId === participant.id
              );
            }
          }),
        )
        .subscribe(async (message) => {
          const participant = this.participant();
          const currentUserId = this.uid();

          // Increment unread count for messages from other users (not sent by current user)
          if (message.getSender().getUid() !== currentUserId) {
            this.unreadMessageCount.update((v) => v + 1);
          }

          this.chatData.update((v) => [...v, message]);

          // Fetch metadata for the new message sender
          await this.fetchSendersMetadata([message]);

          this.cd.detectChanges();
          await this.scrollToBottom();
        }),
    );
    this.subscription.add(
      this.messageListener.typingStarted$.subscribe((typing) => {
        if (this.isTypingForCurrentConversation(typing)) {
          this.isTyping.set(true);
          this.scrollToBottom();
        }
      }),
    );

    this.subscription.add(
      this.messageListener.typingEnded$.subscribe((typing) => {
        if (this.isTypingForCurrentConversation(typing)) {
          this.isTyping.set(false);
        }
      }),
    );
    const content = this.content();
    if (content) {
      const element = await content.getScrollElement();
      this.isShowChevronButton$ = fromEvent(element, 'scroll').pipe(
        map(() => {
          const isEnd = this.isScrollToEnd(element);
          if (isEnd) {
            this.resetUnreadMessageCount();
          }
          return !isEnd;
        }),
        distinctUntilChanged(),
      );
      this.subscription.add(
        this.messageListener.messageDraft$.subscribe(async (message) => {
          this.chatData.update((v) => [...v, message]);

          // Fetch metadata for the draft message sender
          await this.fetchSendersMetadata([message]);

          this.scrollToBottom(true);
        }),
      );
    }

    this.subscription.add(
      this.messageListener.messageUpdated$.subscribe((messageId) => {
        this.updateMessageArray(messageId);
      }),
    );
  }

  private isTypingForCurrentConversation(
    typing: CometChat.TypingIndicator,
  ): boolean {
    const participant = this.participant();
    const currentUserId = this.uid();

    if (!participant || !currentUserId) return false;

    const typingSenderId = typing.getSender()?.getUid();
    const typingReceiverId = typing.getReceiverId();
    const typingReceiverType = typing.getReceiverType();

    // Don't show typing indicator for current user's own typing
    if (typingSenderId === currentUserId) return false;

    if (participant.type === 'user') {
      // For 1-1 chats: show typing when the participant is typing to us
      return (
        typingReceiverType === CometChat.RECEIVER_TYPE.USER &&
        typingSenderId === participant.id &&
        typingReceiverId === currentUserId
      );
    } else {
      // For group chats: show typing when someone is typing in the current group
      return (
        typingReceiverType === CometChat.RECEIVER_TYPE.GROUP &&
        typingReceiverId === participant.id
      );
    }
  }

  checkIfAdmin() {
    if (this.participant()?.type === 'group') {
      CometChat.getGroup(this.participant()?.id as string).then((group) => {
        if (group.getScope() === 'admin') {
          this.isGroupAdmin.set(true);
        }
      });
    }
  }

  async scrollToBottom(explicitCall = false, duration = 300) {
    const scroll = await this.content()?.getScrollElement();
    if (scroll) {
      if (explicitCall || this.isScrollToEnd(scroll)) {
        return new Promise<void>((resolve) => {
          setTimeout(async () => {
            this.content()
              ?.scrollToBottom(duration)
              .then(() => {
                resolve();
              });
          }, 100);
        });
      }
    }
  }

  private isScrollToEnd(scroll: HTMLElement) {
    return scroll.scrollHeight - scroll.scrollTop - 100 <= scroll?.clientHeight;
  }

  buildChatHistory(participant: ChatParticipant) {
    if (participant) {
      if (participant.type === 'user') {
        this.messageRequest = new CometChat.MessagesRequestBuilder()
          .setUID(participant.id)
          .setLimit(limit)
          .withTags(true)
          .build();
      } else {
        this.messageRequest = new CometChat.MessagesRequestBuilder()
          .setGUID(participant.id)
          .setLimit(limit)
          .withTags(true)
          .build();
      }
      this.loadMoreData(undefined, true);
    }
  }

  loadMoreData(event?: InfiniteScrollCustomEvent, explicitCall = false) {
    this.messageRequest
      ?.fetchPrevious()
      .then(async (messages: BaseMessage[]) => {
        this.setLastSenderTag(messages);
        this.chatData.update((v) => [...messages, ...v]);

        // Fetch metadata for all senders in the loaded messages
        await this.fetchSendersMetadata(messages);

        if (event) {
          event.target.complete();
        }

        if (messages.length < limit) {
          this.disabled.set(true);
        }

        if (explicitCall) {
          if (messages.length >= limit) {
            this.disabled.set(false);
          }
          this.scrollToBottom(true, 0).then(() => {
            this.scrollToBottom(true, 0).then(() => {});
          });
        }
      })
      .finally(() => {
        this.isLoading.set(false);
        this.changeDetector.detectChanges();
      })
      .catch((error: unknown) => {
        this.disabled.set(true);
        this.infinitScroll()?.complete();
      });
  }

  private async fetchSendersMetadata(messages: BaseMessage[]) {
    // Get unique sender IDs from messages (including reply message senders)
    const allSenderIds: string[] = [];

    messages.forEach((message) => {
      // Add current message sender
      const senderId = message.getSender()?.getUid();
      if (senderId) {
        allSenderIds.push(senderId);
      }

      // Add reply message sender if exists
      const messageData = message.getData() as any;
      let replyData = null;

      // Check in getData()
      if (messageData && messageData.replyToMessage) {
        replyData = messageData.replyToMessage;
      }

      // Check if there's a metadata property
      if (!replyData && (message as any).metadata) {
        const metadata = (message as any).metadata;
        if (metadata.replyToMessage) {
          replyData = metadata.replyToMessage;
        }
      }

      // Check if metadata is stored in data at root level
      if (!replyData && messageData) {
        Object.keys(messageData).forEach((key) => {
          if (
            typeof messageData[key] === 'object' &&
            messageData[key]?.sender
          ) {
            replyData = messageData[key];
          }
        });
      }

      // Extract reply sender ID
      if (replyData && replyData.sender) {
        const replySenderId = replyData.sender.uid || replyData.sender.id;
        if (replySenderId) {
          allSenderIds.push(replySenderId);
        }
      }
    });

    const senderIds = [...new Set(allSenderIds)].filter(Boolean) as string[];

    if (senderIds.length === 0) return;

    // Join sender IDs into comma-separated string as required by the API
    const senderIdsString = senderIds.join(',');

    try {
      const sendersMetadata = await firstValueFrom(
        this.chatService.getChatMetaData(senderIdsString),
      );

      if (sendersMetadata && sendersMetadata.length > 0) {
        const metadataMap = new Map(
          sendersMetadata.map((meta: ChatGroupMetadata | ChatUserMetadata) => [
            meta.id,
            meta,
          ]),
        );

        // Update the sendersMetadata signal
        this.sendersMetadata.update((currentMap) => {
          const newMap = new Map(currentMap);
          metadataMap.forEach((value, key) => {
            newMap.set(key, value);
          });
          return newMap;
        });

        // Update selectedChat with fresh snooze data for the participant (only if changed)
        const selectedChat = this.chatService.selectedChat();
        if (selectedChat?.type === 'user') {
          const participantMetadata = metadataMap.get(
            selectedChat.id,
          ) as ChatUserMetadata;
          const currentMetadata = selectedChat.metadata as
            | ChatUserMetadata
            | undefined;
          // Only update if snooze times have changed to prevent infinite loop
          if (
            participantMetadata &&
            (currentMetadata?.snoozeStartTime !==
              participantMetadata.snoozeStartTime ||
              currentMetadata?.snoozeEndTime !==
                participantMetadata.snoozeEndTime)
          ) {
            this.chatService.setSelectedChat({
              ...selectedChat,
              metadata: {
                ...selectedChat.metadata,
                snoozeStartTime: participantMetadata.snoozeStartTime,
                snoozeEndTime: participantMetadata.snoozeEndTime,
              } as ChatUserMetadata,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch senders metadata:', error);
    }
  }

  markAsDelivered(message: BaseMessage) {
    CometChat.markAsDelivered(message);
  }

  markAsRead(message: BaseMessage) {
    CometChat.markAsRead(message);
    this.messageListener.trigerFetchUnreadCount();
  }

  resetUnreadMessageCount() {
    this.unreadMessageCount.set(0);
  }

  onAddEmoji(emoji: string, message: BaseMessage) {
    CometChat.addReaction(message.getId(), emoji).then(() => {
      this.updateMessageArray(message.getId().toString());
    });
  }

  onDeleteEmoji(emojis: string[], message: BaseMessage) {
    Promise.all(
      emojis?.map((emoji) => {
        return CometChat.removeReaction(message.getId(), emoji);
      }),
    ).then(() => {
      this.updateMessageArray(message.getId().toString());
    });
  }

  updateMessageArray(messageId: string) {
    const messagesIdx = this.chatData().findIndex(
      (i) => i?.getId().toString() === messageId,
    );
    if (messagesIdx > -1) {
      CometChat.getMessageDetails(messageId).then((message) => {
        this.chatData.update((v) => {
          v[messagesIdx] = message;
          return v;
        });
        this.changeDetector.detectChanges();
      });
    }
  }

  private reset() {
    this.chatData.set([]);
    this.disabled.set(true);
    this.sendersMetadata.set(new Map());
  }

  enableEditMode(event: BaseMessage) {
    this.isEditing.set(true);
    this.editText.set(event.getData().text);
    this.editMessage.set(event);
  }

  enableReplyMode(event: BaseMessage) {
    this.isReplying.set(true);
    this.replyMessage.set(event);
  }

  showConfirmationDeleteModal(message: BaseMessage) {
    this.genericModalSerivce.show(
      () => {
        this.onDeleteMessage(message);
      },
      {
        modalTitle: this.translocoService.translate(
          'chats.delete_chat_msg.txt',
        ),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
      },
    );
  }
  onDeleteMessage(event: BaseMessage) {
    CometChat.deleteMessage(event.getId().toString()).then((deletedMessage) => {
      this.updateMessageArray(event.getId().toString());
      this.chatService.notifyMessageSelfDeleted(
        deletedMessage as CometChat.BaseMessage,
      );
    });
  }

  onEditingDone(text: string) {
    if (text.trim() === '') {
      this.isEditing.set(false);
      this.editText.set('');
    } else {
      const message = this.editMessage();
      if (message) {
        let updateMessage: CometChat.TextMessage = new CometChat.TextMessage(
          message.getReceiverId(),
          text,
          message.getReceiverType(),
        );
        updateMessage.setId(message.getId());
        CometChat.editMessage(updateMessage)
          .then(() => {
            this.updateMessageArray(message.getId().toString());
          })
          .then(() => {
            this.isEditing.set(false);
            this.editText.set('');
          });
      }
    }
  }

  onReplyDone() {
    this.isReplying.set(false);
    this.replyMessage.set(null);
  }

  onCancelReply() {
    this.isReplying.set(false);
    this.replyMessage.set(null);
  }

  scrollToMessage(messageId: number) {
    // Find the message in the chat data
    const targetMessage = this.chatData().find(
      (msg) => msg.getId() === messageId,
    );

    if (targetMessage) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(
          `app-chat-message[data-message-id="${messageId}"]`,
        ) as HTMLElement;

        if (element) {
          // Scroll to the element with smooth behavior
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });

          // Set the highlighting message ID to trigger highlight animation
          this.highlightingMessageId.set(messageId);

          // Remove the highlight effect after 2 seconds
          setTimeout(() => {
            this.highlightingMessageId.set(null);
          }, 2000);
        } else {
          console.log('Element not found for message ID:', messageId);
        }
      }, 100);
    } else {
      // If message is not in current chat data, we might need to load more history
      // For now, we'll show a message and scroll to top to potentially load more messages
      console.log(
        'Message not found in current chat data, scrolling to top to load more history',
      );
      this.content()?.scrollToTop(300);
    }
  }

  onReviceMessage(message: BaseMessage, idx: number) {
    this.chatData.update((v) => {
      v[idx] = message;
      return v;
    });
    this.changeDetector.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private async setLastSenderTag(messages: BaseMessage[]): Promise<void> {
    // If the last message sender tag is already set, do nothing
    if (this.lastSenderTag()) {
      return;
    }
    // Retrieve the logged-in user's chat ID
    const loggedInUserId = await this.getLoginUserId();

    // Find the first message sent by the logged-in user
    const userMessage = messages.find(
      (message) => message.getSender().getUid() === loggedInUserId,
    );

    // Extract and set the tags from the found message, if any
    const tags = (userMessage as any)?.getTags();
    this.lastSenderTag.set(tags);
  }

  private async getLoginUserId() {
    const user = await CometChat.getLoggedinUser();
    return user?.getUid();
  }

  // Helper methods for irregular skeleton loading
  getSkeletonWidth(index: number): number {
    const baseWidths = [120, 180, 160, 200, 140, 220, 100, 240];
    const mobileWidths = [80, 120, 100, 140, 90, 160, 70, 180];
    const widths = this.isMobile ? mobileWidths : baseWidths;
    return widths[index % widths.length];
  }

  getSkeletonHeight(index: number): number {
    // Increased height variation to simulate different message lengths
    const heights = [36, 56, 40, 72, 44, 64, 32, 80, 48, 52];
    return heights[index % heights.length];
  }

  shouldShowSystemMessage(message: BaseMessage): boolean {
    const messageData = message.getData() as any;
    const action = messageData?.action;

    // Filter out member management actions
    const memberManagementActions = [
      'added',
      'removed',
      'joined',
      'left',
      'kicked',
      'banned',
      'unbanned',
      'scopeChanged',
      'memberAdded',
      'memberRemoved',
      'memberJoined',
      'memberLeft',
      'memberKicked',
      'memberBanned',
      'memberUnbanned',
      'memberScopeChanged',
    ];

    // Don't show member management system messages
    if (action && memberManagementActions.includes(action.toLowerCase())) {
      return false;
    }

    // Show other system messages (like message deleted, etc.)
    return true;
  }
}
