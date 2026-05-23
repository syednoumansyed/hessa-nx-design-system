import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { DsModalService } from '@ds/modal/modal.service';
import { StartChatAsGuardianComponent } from './components/start-chat-as-guardian/start-chat-as-guardian.component';
import { StartChatAsPersonnelComponent } from './components/start-chat-as-personnel/start-chat-as-personnel.component';
import { ReactionDetailComponent } from './components/chat-messages/components/reaction-detail/reaction-detail.component';

@Injectable({
  providedIn: 'root',
})
export class ChatModalService {
  private readonly dsModalService = inject(DsModalService);
  private readonly transloco = inject(TranslocoService);

  openStartChatAsGuardianModal = async () => {
    await this.dsModalService.open({
      component: StartChatAsGuardianComponent,
      headerConfig: {
        title: this.transloco.translate('chat.new_chat.title'),
        showCloseButton: true,
      },
      size: 'lg',
      scrollableContent: false,
      contentClass: '',
      mobileHandle: false,
    });
  };

  openClassSelectionModal = async () => {
    await this.dsModalService.open({
      component: StartChatAsPersonnelComponent,
      headerConfig: {
        title: this.transloco.translate('chats.select_class.title'),
        subtitle: this.transloco.translate('chats.next_select_recipients.txt'),
        showCloseButton: true,
      },
      size: 'lg',
      scrollableContent: true,
      contentClass: '',
      mobileHandle: true,
    });
  };

  openReactionDetailModal = async (
    message: CometChat.BaseMessage,
    loginUserId: string,
    mappedReactions: any,
  ) => {
    await this.dsModalService.open({
      component: ReactionDetailComponent,
      componentProps: {
        message,
        loginUserId,
        mappedReactions,
      },
      headerConfig: {
        title: this.transloco.translate('chats.reaction.txt'),
        showCloseButton: true,
      },
      size: 'md',
      scrollableContent: true,
      contentClass: '',
      mobileHandle: false,
    });
  };
}
