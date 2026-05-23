import { Component, inject, input, OnInit } from '@angular/core';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  ChatTagsComponent,
  IChatTag,
} from '@pages/chat/components/chat-tags/chat-tags.component';
import { ChannelIconComponent } from '@pages/chat/components/channel-icon/channel-icon.component';
import { StudentNamesComponent } from '../student-names/student-names.component';
import { CommonModule } from '@angular/common';
import { ChatService } from '@pages/chat/data-access/chat.service';
import {
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/pro-solid-svg-icons';

import { ConversationType, UserProfileColors } from '@shared/enums';
import { isMobile, isRtl } from '@shared/utils/platform';

interface ChatUserMetadata {
  displayName?: string;
  profileColor: UserProfileColors;
  imageUrl?: string;
  type?: ConversationType;
  tags?: IChatTag[];
  studentNames?: string[];
}

@Component({
  selector: 'app-chat-user-preview',
  templateUrl: './chat-user-preview.component.html',
  standalone: true,
  imports: [
    DsIconComponent,
    AvatarComponent,
    ChatTagsComponent,
    ChannelIconComponent,
    StudentNamesComponent,
    CommonModule,
  ],
})
export class ChatUserPreviewComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  readonly isRtl = isRtl();
  readonly faChevronLeft = faChevronLeft;
  readonly faChevronRight = faChevronRight;
  readonly conversationType = ConversationType;
  readonly userProfileColors = UserProfileColors;

  readonly info = input<ChatUserMetadata>();
  readonly includeBackButton = input<boolean>(false);

  isMobile = isMobile();

  ngOnInit() {}

  goBack() {
    this.chatService.clearSelectedChat();
  }

  getProfileColor() {
    return this.info()?.profileColor || this.userProfileColors.NEUTRAL;
  }

  getName() {
    return this.info()?.displayName || 'Unknown User';
  }
}
