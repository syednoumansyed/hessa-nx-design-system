import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input,
  signal,
  viewChild,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  faCamera,
  faClose,
  faFile,
  faImage,
  faMicrophone,
  faPaperPlaneTop,
} from '@fortawesome/pro-regular-svg-icons';
import { IonPopover, PopoverController } from '@ionic/angular/standalone';
import { DsModalService } from '@ds/modal/modal.service';
import { HesSubscription } from '@shared/utils/hes-subscription.util';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs';
import {
  CometChat,
  MediaMessage,
  TextMessage,
  BaseMessage,
} from '@cometchat/chat-sdk-javascript';
import { MessageAttachmentsComponent } from './components/message-attachments/message-attachments.component';
import { isMobile } from '@shared/utils/platform';
import { Camera, CameraResultType } from '@capacitor/camera';
import { heicTo, isHeic } from 'heic-to';
import { SendMediaPreviewComponent } from './components/send-media-preview/send-media-preview.component';
import {
  FilePicker,
  PickFilesResult,
  PickedFile,
} from '@capawesome/capacitor-file-picker';
import { VoiceNoteControllerComponent } from './components/voice-note-controller/voice-note-controller.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { ChatMessageListenerService } from '@pages/chat/chat-message-listener.service';
import { DsIconComponent } from '@ds/icon/icon.component';
import { ChatParticipant } from '@pages/chat/data-access/chat.interface';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { firstValueFrom } from 'rxjs';
import { provideIcons } from '@ng-icons/core';
import { saxMicrophone2Bold } from '@ng-icons/iconsax/bold';
import { ChatTagsManagmentService } from '@pages/chat/chat-tags-managment.service';

@Component({
  selector: 'app-message-composer',
  templateUrl: './message-composer.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    VoiceNoteControllerComponent,
    TranslocoDirective,
    DsIconComponent,
  ],
  providers: [ChatTagsManagmentService],
  viewProviders: [
    provideIcons({
      saxMicrophone2Bold,
    }),
  ],
})
export class MessageComposerComponent implements OnInit, OnDestroy {
  participantData = input.required<ChatParticipant>();
  lastSenderTag = input.required<string[] | null>();
  @ViewChild('textInputTplRef') textInputTplRef: ElementRef;
  @Output() onEditingDone = new EventEmitter<string>();
  @Output() onReplyDone = new EventEmitter<void>();
  @Output() onCancelReply = new EventEmitter<void>();

  faCamera = faCamera;
  faImage = faImage;
  faFile = faFile;
  faClose = faClose;
  faCheck = faCheck;
  faMicrophone = faMicrophone;
  faPaperPlaneTop = faPaperPlaneTop;

  isMobile = isMobile();
  readonly textInput = new FormControl();
  message = input<string>('');
  editText = input<string>('');
  readonly isEditing = input<boolean>(false);
  readonly isReplying = input<boolean>(false);
  readonly replyMessage = input<BaseMessage | null>(null);
  readonly isSendButtonShow = signal<boolean>(false);
  readonly replySenderName = signal<string>('');
  private readonly subscription = new HesSubscription();
  private readonly chatMessageListenerService = inject(
    ChatMessageListenerService,
  );
  private readonly tagService = inject(ChatTagsManagmentService);
  private readonly modalService = inject(DsModalService);
  public popoverController = inject(PopoverController);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly chatService = inject(ChatService);

  public isRecordingStart = signal<boolean>(false);
  private toasterService = inject(HesToasterService);
  private maxSize: number = 90; // Max size in MB
  private translationService = inject(TranslocoService);
  private academicYearsScopeService = inject(AcademicYearsScopeService);
  textInputRef = viewChild('textInputTplRef', { read: ElementRef });
  private tags: string[] | null = null;
  constructor() {
    effect(() => {
      this.participantData();
      this.tags = null;
      this.textInput.patchValue(this.editText() || '', { emitEvent: true });
      if (this.editText()) this.adjustTextareaHeight();
    });

    effect(() => {
      const replyMessage = this.replyMessage();
      if (replyMessage) {
        this.fetchReplySenderName(replyMessage);
      } else {
        this.replySenderName.set('');
      }
    });
  }

  ngOnInit() {
    this.subscription.add = this.textInput.valueChanges
      .pipe(
        map((value) => value?.length > 0),
        distinctUntilChanged(),
      )
      .subscribe((isShow) => {
        this.isSendButtonShow.set(isShow);
      });

    // Initialize typing indicator after view is ready
    setTimeout(() => this.initTypingIndecator(), 0);
  }

  initTypingIndecator() {
    let isTyping = false;
    let lastValue = '';
    let userInitiated = false;

    this.subscription.add = this.textInput.valueChanges
      .pipe(
        tap((currentValue: string) => {
          if (!userInitiated || !currentValue || currentValue === lastValue) {
            lastValue = currentValue || '';
            // Set flag to true after first value change to allow future user input
            if (!userInitiated) {
              setTimeout(() => {
                userInitiated = true;
              }, 100);
            }
            return;
          }

          lastValue = currentValue;

          // Start typing indicator only if not already typing
          if (!isTyping) {
            isTyping = true;
            CometChat.startTyping(this.typingNotification);
          }
        }),
        debounceTime(2000),
      )
      .subscribe(() => {
        // Stop typing indicator after 2 seconds of no input
        if (isTyping) {
          isTyping = false;
          CometChat.endTyping(this.typingNotification);
        }
      });
  }

  get typingNotification() {
    return new CometChat.TypingIndicator(
      this.participantData().id,
      this.participantData().type,
    );
  }

  async onSend() {
    if (this.isEditing() && !this.textInput.value) {
      this.onCancelEdit();
      return;
    }
    if (this.textInput.value) {
      if (this.isEditing()) {
        this.onEditingDone.emit(this.textInput.value);
        this.clearInput();
      } else if (this.isReplying()) {
        await this.sendReplyMessage();
      } else {
        this.sendTextMessage();
      }
    } else {
      this.isRecordingStart.set(true);
    }
    this.cd.detectChanges();
  }

  onHideRecording() {
    this.isRecordingStart.set(false);
    this.cd.detectChanges();
  }

  private sendTextMessage() {
    const message = this.textInput.value;
    if (!message) {
      return;
    }
    const newMessage = new CometChat.TextMessage(
      this.participantData().id,
      message,
      this.participantData().type,
    );
    this.setDraftMessage(newMessage);
    this.clearInput();
  }

  private async sendReplyMessage() {
    const message = this.textInput.value;
    if (!message || !this.replyMessage()) {
      return;
    }
    const newMessage = new CometChat.TextMessage(
      this.participantData().id,
      message,
      this.participantData().type,
    );

    // Get the root message ID to avoid nested threading
    const replyToMessage = this.replyMessage()!;
    const rootMessageId = this.getRootMessageId(replyToMessage);

    // Set the parent message ID for reply (use root message to prevent nesting)
    newMessage.setParentMessageId(rootMessageId);

    // Get sender name from metadata API
    const senderId = replyToMessage.getSender().getUid();
    const senderName = await this.getSenderNameFromMetadata(senderId);
    const fallbackName = replyToMessage.getSender().getName();

    // Store reply metadata for better display (keep original message being replied to)
    const replyMetadata = {
      replyToMessage: {
        id: replyToMessage.getId(),
        type: replyToMessage.getType(),
        text:
          replyToMessage.getType() === 'text'
            ? replyToMessage.getData().text
            : null,
        fileName:
          replyToMessage.getType() === 'file'
            ? replyToMessage.getData().attachments?.[0]?.name
            : null,
        sender: {
          name: senderName || fallbackName,
          uid: senderId,
        },
      },
    };

    // Store metadata directly in the message data
    const messageData = newMessage.getData();
    Object.assign(messageData, replyMetadata);

    // Also try to set metadata using available method
    try {
      if (typeof (newMessage as any).setMetadata === 'function') {
        (newMessage as any).setMetadata(replyMetadata);
      }
    } catch (e) {
      console.log('setMetadata not available, using data assignment');
    }

    this.setDraftMessage(newMessage);
    this.clearInput();
    this.onReplyDone.emit();
  }

  private clearInput() {
    this.textInput.setValue('');
    this.adjustTextareaHeight({
      target: this.textInputRef()?.nativeElement,
    } as Event);
  }

  private async sentMediaMessage(
    file: File | PickedFile,
    capation: string | null,
  ) {
    const message = new CometChat.MediaMessage(
      this.participantData().id,
      file,
      this.getCometChatType(
        (file as File).type ?? (file as PickedFile).mimeType,
      ),
      this.participantData().type,
    );
    if (capation) {
      message.setCaption(capation);
    }

    // Handle reply mode for media messages
    if (this.isReplying() && this.replyMessage()) {
      // Get the root message ID to avoid nested threading
      const replyToMessage = this.replyMessage()!;
      const rootMessageId = this.getRootMessageId(replyToMessage);

      // Set the parent message ID for reply (use root message to prevent nesting)
      message.setParentMessageId(rootMessageId);

      // Get sender name from metadata API
      const senderId = replyToMessage.getSender().getUid();
      const senderName = await this.getSenderNameFromMetadata(senderId);
      const fallbackName = replyToMessage.getSender().getName();

      // Store reply metadata for better display (keep original message being replied to)
      const replyMetadata = {
        replyToMessage: {
          id: replyToMessage.getId(),
          type: replyToMessage.getType(),
          text:
            replyToMessage.getType() === 'text'
              ? replyToMessage.getData().text
              : null,
          fileName:
            replyToMessage.getType() === 'file'
              ? replyToMessage.getData().attachments?.[0]?.name
              : null,
          sender: {
            name: senderName || fallbackName,
            uid: senderId,
          },
        },
      };

      // Store metadata directly in the message data
      const messageData = message.getData();
      Object.assign(messageData, replyMetadata);

      // Also try to set metadata using available method
      try {
        if (typeof (message as any).setMetadata === 'function') {
          (message as any).setMetadata(replyMetadata);
        }
      } catch (e) {
        console.log(
          'setMetadata not available for media message, using data assignment',
        );
      }
    }

    this.setDraftMessage(message);

    // Clear reply mode after sending media message
    if (this.isReplying()) {
      this.onReplyDone.emit();
    }
  }

  private getCometChatType(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return CometChat.MESSAGE_TYPE.IMAGE;
    } else if (fileType.startsWith('video/')) {
      return CometChat.MESSAGE_TYPE.VIDEO;
    } else if (fileType.startsWith('audio/')) {
      return CometChat.MESSAGE_TYPE.AUDIO;
    } else {
      return CometChat.MESSAGE_TYPE.FILE;
    }
  }

  async onTriggerPickMedia() {
    const result = await FilePicker.pickMedia({
      limit: 1,
      readData: true,
    });
    this.filePickerToPreview(result);
  }

  private isValidSize(file: File): boolean {
    if (file) {
      const isValidSize = file.size <= this.sizeInBytes;
      if (!isValidSize) {
        this.toasterService.error(
          '',
          this.translationService.translate('chat.file_size_exceed_error.txt'),
        );
      }
      return isValidSize;
    }
    return false;
  }

  get sizeInBytes(): number {
    return this.maxSize * 1000000; // Convert size from MB to bytes
  }
  private async filePickerToPreview(result: PickFilesResult) {
    const file = (result as PickFilesResult).files[0];
    let rawFile: File;
    if (file.blob) {
      rawFile = new File([file.blob], file.name, {
        type: file.mimeType,
      });
    } else if (file.data) {
      rawFile = this.base64toFile(file.data, file.name, file.mimeType);
    } else {
      return;
    }
    rawFile = await this.convertHeicToJpeg(rawFile);
    this.sendPreview(rawFile);
  }
  private base64toFile(data: string, filename: string, contentType: string) {
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    const file = new File([blob], filename, { type: contentType });
    return file;
  }
  private async convertHeicToJpeg(file: File): Promise<File> {
    if (!(await isHeic(file))) {
      return file;
    }

    const blob = await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: 0.9,
    });

    const name = file.name.replace(/\.heic$|\.heif$/i, '.jpg');
    return new File([blob], name, { type: 'image/jpeg' });
  }

  async onTriggerPickDoc() {
    const result = await FilePicker.pickFiles({
      types: ['application/pdf'],
      limit: 1,
      readData: true,
    });
    this.filePickerToPreview(result);
  }

  async onTriggerTakePicture() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
    });

    var imageUrl = image.webPath;
    if (imageUrl) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      this.sendPreview(file);
    }
  }

  async sendPreview(file: File) {
    if (!this.isValidSize(file)) {
      return;
    }
    const modalRef = await this.modalService.open({
      component: SendMediaPreviewComponent,
      componentProps: {
        media: file,
        sendMessage: async (caption: string | null) => {
          await this.sentMediaMessage(file, caption);
          modalRef.dismiss();
        },
      },
      headerConfig: {
        showCloseButton: true,
      },
      size: 'lg',
      contentClass: 'p-0 h-full overflow-hidden',
      scrollableContent: false,
    });
  }

  onSendRecording(audioFile: File) {
    this.isRecordingStart.set(false);
    this.sentMediaMessage(audioFile, null);
    this.cd.detectChanges();
  }
  onEnter(event: Event) {
    // On mobile, insert new line instead of sending - users should use Send button
    if (this.isMobile) {
      return;
    }

    // On desktop, Enter sends message (Shift+Enter for new line)
    if (!(event as KeyboardEvent).shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  adjustTextareaHeight(event?: Event): void {
    const textarea = (
      event ? event.target : this.textInputTplRef.nativeElement
    ) as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    const maxRows = 4;
    const lineHeight = 24;
    const maxHeight = lineHeight * maxRows;

    if (textarea.scrollHeight <= maxHeight) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'scroll';
    }
  }

  onCancelEdit() {
    this.onEditingDone.emit('');
    this.clearInput();
  }

  private async getLoginUserId() {
    const user = await CometChat.getLoggedinUser();
    return user?.getUid();
  }

  private async setTag(): Promise<void> {
    // If tags are already set, exit early
    if (this.tags) {
      return;
    }

    // Generate fresh tags if a class ID exists
    if (this.participantData().classId) {
      this.tags = await this.generateTags();
      return;
    }

    // Reuse the last sender tag if available
    if (this.lastSenderTag()) {
      this.tags = this.lastSenderTag();
      return;
    }

    // Generate new tags as a fallback
    this.tags = await this.generateTags();
  }

  private async generateTags(): Promise<string[] | null> {
    // Retrieve the sender's chat ID
    const senderChatId = await this.getLoginUserId();

    // Extract participant details
    const { classId, id: receiverChatId, type } = this.participantData();

    return new Promise<string[] | null>((resolve) => {
      this.tagService
        .generateTags({
          senderChatId: senderChatId!,
          receiverChatId,
          academicYearId:
            this.academicYearsScopeService?.selectedAcademicYear()?.id!,
          conversationType: type === 'group' ? 'GROUP' : 'USER',
          ...(classId && { classId }),
        })
        .subscribe({
          next: (response) => {
            resolve(response.data);
          },
          error: () => {
            // Handle error gracefully
            resolve(null);
          },
        });
    });
  }

  private getRootMessageId(message: BaseMessage): number {
    // If the message has a parent message ID, it's a reply
    const parentId = message.getParentMessageId();
    if (parentId && parentId !== 0) {
      // This message is already a reply, so we need to find the root message
      return parentId;
    }
    // If no parent ID, this is the root message
    return message.getId();
  }

  private async getSenderNameFromMetadata(senderId: string): Promise<string> {
    try {
      const chatsMetadata = await firstValueFrom(
        this.chatService.getChatMetaData(senderId),
      );

      if (chatsMetadata && chatsMetadata.length > 0) {
        const senderMetadata = chatsMetadata[0];
        return senderMetadata.displayName || '';
      }
      return '';
    } catch (error) {
      console.error('Error fetching sender metadata:', error);
      return '';
    }
  }

  private async fetchReplySenderName(replyMessage: BaseMessage): Promise<void> {
    try {
      const senderId = replyMessage.getSender()?.getUid();
      if (!senderId) {
        this.replySenderName.set('');
        return;
      }

      const senderName = await this.getSenderNameFromMetadata(senderId);
      if (senderName) {
        this.replySenderName.set(senderName);
      } else {
        // Fallback to the original method if metadata is not available
        this.replySenderName.set(replyMessage.getSender()?.getName() || '');
      }
    } catch (error) {
      console.error('Error fetching sender metadata:', error);
      // Fallback to the original method on error
      this.replySenderName.set(replyMessage.getSender()?.getName() || '');
    }
  }

  private async setDraftMessage(
    message: TextMessage | MediaMessage,
  ): Promise<void> {
    // Ensure tags are set before proceeding
    if (!this.tags) {
      await this.setTag();
    }
    // TODO: There is an issue with setting tags for media messages.
    // Currently, tags are only applied to text messages.
    // We need to create a ticket with CometChat to address the issue and support tags for media messages as well.

    // Apply tags to the draft message
    if (this.tags && message.getType() === CometChat.MESSAGE_TYPE.TEXT) {
      message.setTags(this.tags);
    }

    // Notify the chat message listener service about the draft message
    this.chatMessageListenerService.setDraftMessage(message);
  }
}
