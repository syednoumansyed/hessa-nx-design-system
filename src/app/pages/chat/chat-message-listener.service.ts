import { Injectable } from '@angular/core';
import { BaseMessage, CometChat } from '@cometchat/chat-sdk-javascript';
import { randomId } from '@shared/utils/randomId';
import { Subject, debounceTime } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ChatMessageListenerService {
  private messageSource = new Subject<BaseMessage>();
  public message$ = this.messageSource.asObservable();
  private markAsReadSource = new Subject<CometChat.MessageReceipt>();
  public markAsRead$ = this.markAsReadSource.asObservable();
  private markAsDeliveredSource = new Subject<CometChat.MessageReceipt>();
  public markAsDelivered$ = this.markAsDeliveredSource.asObservable();
  private reactionAddedSource = new Subject<CometChat.ReactionEvent>();
  public reactionAdded$ = this.reactionAddedSource.asObservable();
  private reactionRemovedSource = new Subject<CometChat.ReactionEvent>();
  public reactionRemoved$ = this.reactionRemovedSource.asObservable();
  private messageUpdatedSource = new Subject<string>();
  public messageUpdated$ = this.messageUpdatedSource.asObservable();
  private typingStartedSource = new Subject<CometChat.TypingIndicator>();
  public typingStarted$ = this.typingStartedSource.asObservable();
  private typingEndedSource = new Subject<CometChat.TypingIndicator>();
  public typingEnded$ = this.typingEndedSource.asObservable();
  private messageDeletedSource = new Subject<BaseMessage>();
  public messageDeleted$ = this.messageDeletedSource.asObservable();
  private fetchUnreadCountSource = new Subject<void>();
  public fetchUnreadCount$ = this.fetchUnreadCountSource.pipe(
    debounceTime(500),
  );

  private listenerId: string | null = null;

  private messageDraftSource = new Subject<BaseMessage>();
  public messageDraft$ = this.messageDraftSource.asObservable();
  constructor() {}

  initListener() {
    if (this.listenerId) {
      return;
    }
    let listenerID = randomId();
    this.listenerId = listenerID;
    CometChat.addMessageListener(
      listenerID,
      new CometChat.MessageListener({
        onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
          this.messageSource.next(textMessage);
          this.trigerFetchUnreadCount(textMessage);
          this.markMessageAsDelivered(textMessage);
        },
        onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
          this.messageSource.next(mediaMessage);
          this.trigerFetchUnreadCount(mediaMessage);
          this.markMessageAsDelivered(mediaMessage);
        },
        onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
          this.messageSource.next(customMessage);
          this.trigerFetchUnreadCount(customMessage);
          this.markMessageAsDelivered(customMessage);
        },
        onMessagesDelivered: (messageReceipt: CometChat.MessageReceipt) => {
          this.markAsDeliveredSource.next(messageReceipt);
          this.messageUpdatedSource.next(messageReceipt.getMessageId());
        },
        onMessagesRead: (messageReceipt: CometChat.MessageReceipt) => {
          this.markAsReadSource.next(messageReceipt);
          this.messageUpdatedSource.next(messageReceipt.getMessageId());
        },
        onMessageReactionAdded: (reactionEvent: CometChat.ReactionEvent) => {
          this.reactionAddedSource.next(reactionEvent);
          this.messageUpdatedSource.next(
            reactionEvent.getReaction().getMessageId(),
          );
        },
        onMessageReactionRemoved: (reactionEvent: CometChat.ReactionEvent) => {
          this.reactionRemovedSource.next(reactionEvent);
          this.messageUpdatedSource.next(
            reactionEvent.getReaction().getMessageId(),
          );
        },
        onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
          this.typingStartedSource.next(typingIndicator);
        },
        onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
          this.typingEndedSource.next(typingIndicator);
        },
        onMessageDeleted: (message: BaseMessage) => {
          this.messageDeletedSource.next(message);
          this.messageUpdatedSource.next(message.getId().toString());
        },
      }),
    );
  }
  trigerFetchUnreadCount(message?: BaseMessage) {
    if (message?.getReadAt()) {
      return;
    }
    this.fetchUnreadCountSource.next();
  }

  /**
   * Mark received message as delivered
   */
  private markMessageAsDelivered(message: BaseMessage) {
    if (message.getDeliveredAt() || message.getCategory() === 'action') {
      return;
    }
    CometChat.markAsDelivered(message);
  }

  setTextMessage(message: BaseMessage) {
    this.messageSource.next(message);
  }

  setDraftMessage(message: BaseMessage) {
    this.messageDraftSource.next(message);
  }

  destroyListener() {
    if (this.listenerId) CometChat.removeMessageListener(this.listenerId);
    this.listenerId = null;
  }
}
