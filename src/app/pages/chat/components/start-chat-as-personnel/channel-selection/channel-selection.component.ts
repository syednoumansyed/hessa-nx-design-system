import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';

import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { isMobile, isRtl } from '@shared/utils/platform';
import { ChannelIconComponent } from '../../channel-icon/channel-icon.component';
import { ConversationType, UserProfileColors } from '@shared/enums';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ChatGroup } from '@pages/chat/data-access/chat.interface';

@Component({
  selector: 'app-channel-selection',
  templateUrl: './channel-selection.component.html',
  standalone: true,
  imports: [
    DsIconComponent,
    CommonModule,
    TranslocoDirective,
    ChannelIconComponent,
    IonSpinner,
  ],
})
export class ChannelSelectionComponent implements OnInit {
  private readonly chatService = inject(ChatService);
  private readonly hesToasterService = inject(HesToasterService);

  selectedAcademicYearId = input<number | undefined>();
  classGroup = input<ChatGroup>();
  closeModal = output<void>();

  isMobile = isMobile();
  isRtl = isRtl();

  userProfileColor = UserProfileColors;
  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  isGroupProcessing = signal<boolean>(false);

  groupName = computed(() => {
    return this.classGroup()?.displayName || 'Unknown Group';
  });

  randomColor = computed(() => {
    const colors = Object.values(UserProfileColors);
    return colors[Math.floor(Math.random() * colors.length)];
  });

  ngOnInit() {}

  onChannelSelected(isRetry = false) {
    this.isGroupProcessing.set(true);
    const chatId = this.classGroup()?.chatId;
    if (!chatId) {
      return;
    }

    this.chatService
      .getCometChatGroup(chatId)
      .then(async (group) => {
        this.handleChatSelection(group);
      })
      .catch((error) => {
        if (
          (error.code === 'ERR_GUID_NOT_FOUND' ||
            error.code === 'ERR_NOT_A_MEMBER') &&
          !isRetry
        ) {
          this.handleNewGroupCreation();
        } else {
          this.isGroupProcessing.set(false);
          this.hesToasterService.error(error.message);
        }
      });
  }

  private handleNewGroupCreation() {
    const classGroup = this.classGroup();
    if (!classGroup?.id || !this.selectedAcademicYearId()) {
      return;
    }

    this.chatService
      .postGroup({
        target: 'class',
        targetId: classGroup.id,
        academicYearId: this.selectedAcademicYearId()!,
      })
      .subscribe({
        next: () => {
          this.onChannelSelected(true);
        },
        error: (error) => {
          this.isGroupProcessing.set(false);
          this.hesToasterService.error(error.message);
        },
      });
  }

  private handleChatSelection(createdGroup: any) {
    this.chatService.getChatMetaData(this.classGroup()?.chatId!).subscribe({
      next: (chatsMetadata) => {
        if (chatsMetadata && chatsMetadata.length > 0) {
          const data = chatsMetadata[0];
          console.log(data);

          this.chatService.setSelectedChat({
            id: this.classGroup()?.chatId || '',
            displayName: this.groupName(),
            type: ConversationType.GROUP,
            metadata: { ...createdGroup.metadata, ...data },
          });
          this.chatService.setActiveConversationId(createdGroup.conversationId);
          this.closeModal.emit();
          this.isGroupProcessing.set(false);
        }
      },
      error: (error) => {
        console.error('Error fetching chat metadata:', error);
      },
    });
  }
}
