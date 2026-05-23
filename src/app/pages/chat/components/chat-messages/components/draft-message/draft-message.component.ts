import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { BaseMessage, CometChat } from '@cometchat/chat-sdk-javascript';
import { TextMessageComponent } from '../text-message/text-message.component';
import { IonSpinner, IonImg } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { VoiceMessageComponent } from '../voice-message/voice-message.component';
import { VideoMessageComponent } from '../video-message/video-message.component';
import { FaIconComponentsProps } from '@shared/types';
import { faCircleArrowDown } from '@fortawesome/pro-light-svg-icons';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { ChatService } from '@pages/chat/data-access/chat.service';

@Component({
  selector: 'app-draft-message',
  templateUrl: './draft-message.component.html',
  styleUrls: ['./draft-message.component.scss'],
  standalone: true,
  imports: [
    IonImg,
    TextMessageComponent,
    IonSpinner,
    CommonModule,
    VoiceMessageComponent,
    VideoMessageComponent,
    HesIconComponent,
  ],
})
export class DraftMessageComponent implements OnInit {
  chatService = inject(ChatService);
  data = input.required<BaseMessage>();
  actualMessage = output<BaseMessage>();
  isLoading = signal(false);
  message = computed(() => {
    return this.data();
  });
  messageType = computed(() => {
    return this.data().getType();
  });
  imageUrl = signal('');
  file = computed(() => {
    return (this.data() as unknown as CometChat.MediaMessage)['files'][0];
  });
  fileName = computed(() => {
    return this.file().name;
  });

  readonly arrowDownIcon: FaIconComponentsProps = {
    icon: faCircleArrowDown,
    size: 'lg',
  };
  captionText = computed(() => {
    if (this.message().getType() !== CometChat.MESSAGE_TYPE.TEXT) {
      return this.message().getData().text;
    }
    return '';
  });

  constructor() {}

  ngOnInit() {
    this.isLoading.set(true);
    if (this.data().getType() === 'text') {
      this.sentTextMessage();
    } else {
      this.sentMediaMessage();
    }
    if (this.data().getType() === 'image') {
      this.readImage();
    }
  }

  private sentTextMessage() {
    CometChat.sendMessage(this.message())
      .then((message) => {
        this.actualMessage.emit(message);
        this.chatService.chatDraftMessageSent(message);
      })
      .finally(() => {
        this.isLoading.set(false);
      });
  }

  private sentMediaMessage() {
    CometChat.sendMediaMessage(this.message())
      .then((message) => {
        this.actualMessage.emit(message);
        this.chatService.chatDraftMessageSent(message);
      })
      .finally(() => {
        this.isLoading.set(false);
      });
  }

  private readImage() {
    const reader = new FileReader();
    reader.onload = (event) => {
      this.imageUrl.set(event?.target?.result as string);
    };
    reader.readAsDataURL(this.file());
  }
}
