import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  input,
  OnInit,
  output,
  ViewChild,
} from '@angular/core';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  ChatGuardian,
  ChatStudent,
} from '@pages/chat/data-access/chat.interface';
import { isMobile, isRtl } from '@shared/utils/platform';
import {
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ConversationType, UserType } from '@shared/enums';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';

@Component({
  selector: 'app-chat-user-selection',
  templateUrl: './chat-user-selection.component.html',
  standalone: true,
  styleUrls: ['./chat-user-selection.component.scss'],
  imports: [
    DsIconComponent,
    CommonModule,
    TranslocoDirective,
    AvatarComponent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    EnumLangPipe,
  ],
})
export class ChatUserSelectionComponent implements OnInit {
  studentsList = input<ChatStudent[]>([]);
  showInfiniteScroll = input<boolean>(true);
  loadMore = output<void>();
  closeModal = output<void>();
  private readonly chatService = inject(ChatService);
  private readonly hesToasterService = inject(HesToasterService);

  @ViewChild('infiniteScrollRef') infiniteScroll?: IonInfiniteScroll;

  isMobile = isMobile();
  isRtl = isRtl();
  userType = UserType;

  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;

  ngOnInit() {}

  onLoadMore(event: any) {
    this.loadMore.emit(event);
  }

  onUserSelected(user: ChatStudent | ChatGuardian, userType: UserType) {
    this.chatService
      .getCometChatUser(user.chatId)
      .then(async (cometChatUser) => {
        this.handleChatSelection(user.chatId, cometChatUser);
      })
      .catch((error) => {
        if (error.code === 'ERR_UID_NOT_FOUND') {
          this.handleNewChatCreation(user, userType);
        } else {
          this.hesToasterService.error(error.message);
        }
      });
  }

  private handleNewChatCreation(
    user: ChatStudent | ChatGuardian,
    userType: UserType,
  ) {
    const cometChatUser = new CometChat.User(user.chatId);
    cometChatUser.setName(user.displayName);
    cometChatUser.setRole(userType.toLowerCase());
    this.chatService
      .registerUserToCometChat(cometChatUser)
      .then((cometChatUser) => {
        this.handleChatSelection(user.chatId, cometChatUser);
      })
      .catch((error) => {
        this.hesToasterService.error(error.message);
      });
  }

  private handleChatSelection(chatId: string, cometChatUser: any) {
    this.chatService.getChatMetaData(chatId).subscribe({
      next: (chatsMetadata) => {
        if (chatsMetadata && chatsMetadata.length > 0) {
          const metadata = chatsMetadata[0];
          this.chatService.setSelectedChat({
            id: chatId,
            displayName: metadata.displayName,
            type: ConversationType.USER,
            metadata: metadata,
          });
          this.closeModal.emit();
          this.chatService.setActiveConversationId(
            cometChatUser.conversationId,
          );
        }
      },
      error: (error) => {
        console.error('Error fetching chat metadata:', error);
      },
    });
  }
}
