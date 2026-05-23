import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { ChatPreviewComponent } from '@pages/chat/components/chat-preview/chat-preview.component';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import {
  NoDataBtnInterface,
  NoDataCardComponent,
} from '@shared/components/no-data-card/no-data-card.component';
import { ConversationType } from '@shared/enums';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { ChatMessageListenerService } from '@pages/chat/chat-message-listener.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import { ChatModalService } from '@pages/chat/chat-modal.service';
import { AuthService } from '@auth/auth.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { provideIcons } from '@ng-icons/core';
import { saxAddOutline } from '@ng-icons/iconsax/outline';
import {
  ChatGroupMetadata,
  ChatUserMetadata,
} from '@pages/chat/data-access/chat.interface';

@Component({
  selector: 'app-chat-conversations',
  templateUrl: './chat-conversations.component.html',
  standalone: true,
  imports: [
    SearchBoxComponent,
    CommonModule,
    TranslocoDirective,
    ChatPreviewComponent,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSpinner,
    NoDataCardComponent,
  ],
  viewProviders: [
    provideIcons({
      saxAddOutline,
    }),
  ],
})
export class ChatConversationsComponent implements OnInit, OnDestroy {
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly chatService = inject(ChatService);
  private readonly cometChatListener = inject(ChatMessageListenerService);
  private readonly chatModalService = inject(ChatModalService);
  private readonly auth = inject(AuthService);

  public readonly conversationsList = signal<CometChat.Conversation[]>([]);
  public readonly chatUser = signal<CometChat.User | null>(null);
  public readonly chatUserId = computed(() => this.chatUser()?.getUid());
  public readonly searchTerm = signal('');
  public readonly noSearchResults = signal(false);
  noDataBtnConfig = signal<NoDataBtnInterface>({
    label: this.hesTranslateService.t('chats.start_chat.btn'),
    onAction: () => this.openStartChatAsGuardianModal(),
    iconStart: 'saxAddOutline',
  });

  isPersonalUser = computed(() => this.auth.user()?.type === 'PERSONNEL');
  isGuardianUser = computed(() => this.auth.user()?.type === 'GUARDIAN');

  private readonly subscription = new Subscription();

  private limit = 20;
  private exhausted = false;
  private loading = signal(false);
  private initialLoading = signal(true); // Track initial load state
  private req!: CometChat.ConversationsRequest;
  private allConversations = signal<CometChat.Conversation[]>([]);
  private fullCache = signal<CometChat.Conversation[]>([]);
  private fullLoaded = false;
  public fullLoading = signal(false);

  // Show loading spinner when initially loading conversations or when searching
  isLoading = computed(
    () => this.initialLoading() || (this.fullLoading() && this.searchTerm()),
  );

  // Track if we have finished the initial load at least once
  hasInitiallyLoaded = computed(() => !this.initialLoading());

  @ViewChild(IonInfiniteScroll) infiniteScroll?: IonInfiniteScroll;

  async ngOnInit() {
    this.chatUser.set(await CometChat.getLoggedinUser());
    this.buildReq(this.limit);
    await this.loadInitial();

    this.subscription.add(
      this.cometChatListener.message$.subscribe(async (msg) => {
        await this.handleIncomingMessage(msg);
      }),
    );

    this.subscription.add(
      this.cometChatListener.typingStarted$.subscribe(
        (typingIndicator: CometChat.TypingIndicator) => {
          this.setTyping(typingIndicator, true);
        },
      ),
    );

    this.subscription.add(
      this.cometChatListener.typingEnded$.subscribe(
        (typingIndicator: CometChat.TypingIndicator) => {
          this.setTyping(typingIndicator, false);
        },
      ),
    );

    this.subscription.add(
      this.cometChatListener.markAsRead$.subscribe(
        async (receipt: CometChat.MessageReceipt) => {
          this.applyReceipt(receipt, true);
        },
      ),
    );

    this.subscription.add(
      this.cometChatListener.markAsDelivered$.subscribe(
        async (receipt: CometChat.MessageReceipt) => {
          this.applyReceipt(receipt, false);
        },
      ),
    );

    this.subscription.add(
      this.chatService.draftMessageSent$.subscribe(
        async (message: CometChat.BaseMessage) => {
          const conv = await this.fetchSingleConversation(
            message.getReceiverId(),
            message.getReceiverType() as ConversationType,
          );
          this.updateConversationList(conv);
        },
      ),
    );

    this.subscription.add(
      this.cometChatListener.messageDeleted$.subscribe(async (msg) => {
        await this.handleIncomingMessage(msg);
      }),
    );

    this.subscription.add(
      this.chatService.messageSelfDeleted$.subscribe(async (msg) => {
        await this.handleIncomingMessage(msg);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private buildReq(limit: number) {
    this.exhausted = false;
    this.loading.set(false);
    this.req = new CometChat.ConversationsRequestBuilder()
      .setLimit(limit)
      .build();
  }

  private async nextPage(): Promise<CometChat.Conversation[]> {
    if (this.exhausted || this.loading()) return [];
    if (!this.req) this.buildReq(this.limit);
    this.loading.set(true);
    try {
      const page = await this.req.fetchNext();
      if (!page?.length) {
        this.exhausted = true;
        return [];
      }
      return page;
    } finally {
      this.loading.set(false);
    }
  }

  private updateList() {
    const term = this.searchTerm();
    if (!term) {
      this.conversationsList.set(this.allConversations());
      this.noSearchResults.set(false);
    } else {
      const base = this.fullLoaded ? this.fullCache() : this.allConversations();
      const filtered = base.filter((c) =>
        this.nameOf(c).toLowerCase().includes(term),
      );
      this.conversationsList.set(filtered);
      this.noSearchResults.set(filtered.length === 0);
    }

    this.chatService.setHasConversations(this.allConversations().length > 0);
  }

  async loadInitial() {
    this.initialLoading.set(true);
    this.buildReq(this.limit);
    try {
      const first = await this.nextPage(); // nextPage manages loading itself
      await this.attachMetadataToConversations(first);
      this.allConversations.set(first);
      this.updateList();
    } finally {
      this.initialLoading.set(false);
    }
  }

  async loadMore(ev: CustomEvent) {
    if (this.searchTerm()) {
      (ev.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }
    if (this.noSearchResults()) {
      (ev.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }
    if (this.exhausted || this.loading()) {
      (ev.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }
    try {
      const next = await this.nextPage();
      await this.attachMetadataToConversations(next);
      this.allConversations.set([...this.allConversations(), ...next]);
      this.updateList();
      if (this.exhausted && this.infiniteScroll)
        this.infiniteScroll.disabled = true;
    } finally {
      (ev.target as HTMLIonInfiniteScrollElement).complete();
    }
  }

  onSearchChange(value: string) {
    const term = (value || '').trim().toLowerCase();
    this.searchTerm.set(term);
    if (!term) {
      this.updateList();
      if (this.infiniteScroll) this.infiniteScroll.disabled = this.exhausted;
      return;
    }
    if (this.infiniteScroll) this.infiniteScroll.disabled = true;
    this.ensureFullCache();
    this.updateList();
  }

  private async ensureFullCache() {
    if (this.fullLoaded || this.fullLoading()) return;
    this.fullLoading.set(true);
    try {
      const builder = new CometChat.ConversationsRequestBuilder().setLimit(20);
      const req = builder.build();
      const acc: CometChat.Conversation[] = [];
      for (let i = 0; i < 200; i++) {
        const page = await req.fetchNext();
        if (!page?.length) break;
        await this.attachMetadataToConversations(page);
        acc.push(...page);
      }
      const map = new Map<string, CometChat.Conversation>();
      [...this.allConversations(), ...acc].forEach((c) =>
        map.set(c.getConversationId(), c),
      );
      this.fullCache.set([...map.values()]);
      this.fullLoaded = true;
    } finally {
      this.fullLoading.set(false);
      if (this.searchTerm()) this.updateList();
    }
  }

  getConversationId(c: CometChat.Conversation) {
    return c.getConversationId();
  }

  private nameOf(c: CometChat.Conversation): string {
    try {
      const withObj: any =
        c.getConversationWith?.() ?? (c as any)['conversationWith'];
      const metadata = withObj?.getMetadata?.();
      return (
        metadata?.displayName ||
        (withObj?.getName?.() ?? withObj?.name ?? '').toString()
      );
    } catch {
      return '';
    }
  }

  selectConversation(c: CometChat.Conversation) {
    const withObj = c.getConversationWith?.();
    if (!withObj) return;

    const isUser = c.getConversationType() === CometChat.RECEIVER_TYPE.USER;
    const id = isUser
      ? (withObj as CometChat.User).getUid()
      : (withObj as CometChat.Group).getGuid();

    this.chatService.setSelectedChat({
      type: c.getConversationType().toLowerCase() as ConversationType,
      displayName: this.nameOf(c),
      id: id,
      metadata: (withObj as any).getMetadata?.(),
    });
    this.chatService.setActiveConversationId(c.getConversationId());

    // If personnel user selects a group conversation, call postGroup API
    if (this.isPersonalUser() && !isUser) {
      this.handleGroupSelection(id);
    }

    // Mark conversation as read when selected (only for user conversations)
    if (isUser) {
      this.markConversationAsRead(c);
    }

    (c as any).unreadMessageCount = 0;
    (c as any).setUnreadMentionsCount?.(0);
    const all = this.allConversations();
    this.allConversations.set([...all]);
    this.updateList();
    this.changeDetector.detectChanges();
    this.chatService.fetchUnreadCountFromCometChat();
  }

  private handleGroupSelection(guid: string) {
    // Find the group from availableGroupsList using the guid (chatId)
    const group = this.chatService
      .availableGroupsList()
      .find((g) => g.chatId === guid);

    if (group) {
      // Call postGroup API with the group's class ID and academic year ID
      this.chatService
        .postGroup({
          target: 'class',
          targetId: group.id,
          academicYearId: group.academicYearId,
        })
        .subscribe({
          next: (response) => {
            console.log('Group activated successfully:', response);
          },
          error: (error) => {
            console.error('Error activating group:', error);
          },
        });
    }
  }

  private markConversationAsRead(conversation: CometChat.Conversation) {
    const lastMessage = conversation.getLastMessage();
    if (!lastMessage) return;

    // Check if the last message is unread and not sent by current user
    const currentUserId = this.chatUserId();
    const lastMessageSenderId = lastMessage.getSender()?.getUid();

    // Only mark as read if:
    // 1. Last message is not sent by current user
    // 2. Last message is not already read
    if (lastMessageSenderId !== currentUserId && !lastMessage.getReadAt()) {
      CometChat.markAsRead(lastMessage);
    }
  }

  private async fetchSingleConversation(
    uid: string,
    type: ConversationType,
  ): Promise<CometChat.Conversation> {
    return CometChat.getConversation(uid, type);
  }

  private async updateConversationList(conv: CometChat.Conversation) {
    await this.attachMetadataToConversations([conv]);
    const id = conv.getConversationId();
    const all = this.allConversations();
    const idx = all.findIndex((c) => c.getConversationId() === id);
    const next =
      idx > -1
        ? [conv, ...all.slice(0, idx), ...all.slice(idx + 1)]
        : [conv, ...all];
    this.allConversations.set(next);
    if (this.fullLoaded) {
      const map = new Map<string, CometChat.Conversation>();
      [...this.fullCache(), conv].forEach((c) =>
        map.set(c.getConversationId(), c),
      );
      this.fullCache.set([...map.values()]);
    }
    this.updateList();
  }

  private async handleIncomingMessage(
    msg: CometChat.BaseMessage,
  ): Promise<void> {
    const type = (msg as any).receiverType as ConversationType;
    const uid =
      type === ConversationType.USER
        ? (msg as any).sender?.uid === this.chatUserId()
          ? (msg as any).receiver?.uid
          : (msg as any).sender?.uid
        : (msg as any).receiver?.guid;
    if (!uid) return;
    const conv = await this.fetchSingleConversation(uid, type);
    this.updateConversationList(conv);
  }

  private setTyping(ti: CometChat.TypingIndicator, active: boolean) {
    const myId = this.chatUserId();
    const sender: any = (ti as any).sender || (ti as any).getSender?.();
    const senderId = sender?.getUid?.() ?? sender?.uid;
    if (!senderId || senderId === myId) return;
    const type = (ti as any).receiverType || (ti as any).getReceiverType?.();
    const receiverId = (ti as any).receiverId || (ti as any).getReceiverId?.();
    let targetId: string | undefined;
    if (type === ConversationType.USER)
      targetId = senderId === myId ? receiverId : senderId;
    else targetId = receiverId;
    if (!targetId) return;
    const all = this.allConversations();
    for (const c of all) {
      if (c.getConversationType() !== type) continue;
      const withObj: any = c.getConversationWith?.();
      const id =
        type === ConversationType.USER
          ? (withObj?.getUid?.() ?? withObj?.uid)
          : (withObj?.getGuid?.() ?? withObj?.guid);
      if (id === targetId) {
        (c as any).__typing = active;
        (c as any).__typing_by_name = sender?.getName?.() ?? '';
        break;
      }
    }
    this.allConversations.set([...all]);
    this.updateList();
  }

  private async applyReceipt(
    receipt: CometChat.MessageReceipt,
    isRead: boolean,
  ) {
    const receiverType = receipt.getReceiverType();
    if (receiverType === CometChat.RECEIVER_TYPE.GROUP) {
      return;
    }

    const senderId = receipt.getSender().getUid();

    try {
      const freshConversation = await CometChat.getConversation(
        senderId,
        receiverType,
      );

      const lastMessage: any = freshConversation.getLastMessage?.();
      if (lastMessage) {
        if (isRead) {
          lastMessage.readAt = Math.floor(Date.now() / 1000);
        } else {
          lastMessage.deliveredAt = Math.floor(Date.now() / 1000);
        }
        await this.updateConversationList(freshConversation);
      }
    } catch (error) {
      console.error('Error fetching fresh conversation:', error);
    }
  }

  private async attachMetadataToConversations(
    conversations: CometChat.Conversation[],
  ): Promise<void> {
    if (!conversations?.length) return;

    const chatIds = conversations
      .map((conv) => {
        const withObj = conv.getConversationWith?.();
        const isUser =
          conv.getConversationType() === CometChat.RECEIVER_TYPE.USER;
        return isUser
          ? (withObj as CometChat.User).getUid()
          : (withObj as CometChat.Group).getGuid();
      })
      .join(',');

    try {
      const chatsMetadata = await firstValueFrom(
        this.chatService.getChatMetaData(chatIds),
      );

      if (chatsMetadata && chatsMetadata.length > 0) {
        const metadataMap = new Map(
          chatsMetadata.map((meta: ChatGroupMetadata | ChatUserMetadata) => [
            meta.id,
            meta,
          ]),
        );

        conversations.forEach((conversation) => {
          const withObj = conversation.getConversationWith?.();
          const isUser =
            conversation.getConversationType() === CometChat.RECEIVER_TYPE.USER;
          const chatId = isUser
            ? (withObj as CometChat.User).getUid()
            : (withObj as CometChat.Group).getGuid();

          const metadata = metadataMap.get(chatId);
          if (metadata && withObj) {
            if (isUser) {
              (withObj as any).setMetadata?.(metadata);
            } else {
              const existingMetadata = (withObj as any).getMetadata?.() || {};
              const mergedMetadata = { ...existingMetadata, ...metadata };
              (withObj as any).setMetadata?.(mergedMetadata);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch chat metadata:', error);
    }
  }

  openStartChatAsGuardianModal() {
    if (!this.isPersonalUser()) {
      this.chatModalService.openStartChatAsGuardianModal();
    } else {
      this.chatModalService.openClassSelectionModal();
    }
  }
}
