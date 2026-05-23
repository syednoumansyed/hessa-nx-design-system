import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslocoService } from '@jsverse/transloco';
import { ConversationType } from '@shared/enums';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ApiUrl } from '@shared/utils/api-url.util';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import {
  ChatStudentsParams,
  ChatPersonnel,
  ChatGroupMetadata,
  ChatUserMetadata,
  ChatParticipant,
  ChatStudent,
  ChatGroup,
} from './chat.interface';
import { IPaginatedResponse, IResponse } from '@shared/interfaces';
import {
  ChatPersonnelDTO,
  ChatGroupMetadataDTO,
  ChatUserMetadataDTO,
  ChatStudentDTO,
  ChatGroupDTO,
} from './chat.dto';
import { CHAT_MAP_FROM_DTO } from './chat-dto-transform';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly translocoService = inject(TranslocoService);
  private readonly toasterService = inject(HesToasterService);
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private triggerDeleteFunctionSource = new Subject<void>();
  triggerDeleteFunction$ = this.triggerDeleteFunctionSource.asObservable();
  private draftMessageSentSource = new Subject<CometChat.BaseMessage>();
  draftMessageSent$ = this.draftMessageSentSource.asObservable();
  private messageSelfDeletedSource = new Subject<CometChat.BaseMessage>();
  messageSelfDeleted$ = this.messageSelfDeletedSource.asObservable();
  isShowStartChatComponent = signal<boolean>(false);

  private _selectedChat = signal<ChatParticipant | undefined>(undefined);
  readonly selectedChat = computed(() => this._selectedChat());

  private _activeConversationId = signal<string | null>(null);
  readonly activeConversationId = computed(() => this._activeConversationId());

  private _hasConversations = signal<boolean>(false);
  readonly hasConversations = computed(() => this._hasConversations());

  private _availableGroupsList = signal<ChatGroup[]>([]);
  readonly availableGroupsList = computed(() => this._availableGroupsList());

  private _totalUnreadCount = signal<number>(0);
  readonly totalUnreadCount = computed(() => this._totalUnreadCount());

  private _isCometChatLoggedIn = signal<boolean>(false);
  readonly isCometChatLoggedIn = computed(() => this._isCometChatLoggedIn());

  private _isLoggingIn = signal<boolean>(false);
  private _loginPromise: Promise<boolean> | null = null;

  hasChatToken = computed(() => {
    const token = localStorage.getItem('chatAuthToken');
    return !(token == undefined || token == 'undefined' || token == null);
  });

  /**
   * @deprecated Use hasChatToken() instead. This is kept for backward compatibility.
   */
  isChatLoggedIn = this.hasChatToken;

  constructor(private http: HttpClient) {}

  /**
   * Ensures the user is logged into CometChat.
   * This method is called lazily when the user visits the chat page.
   * Returns true if login was successful or user was already logged in.
   */
  async ensureChatLogin(): Promise<boolean> {
    if (this._isCometChatLoggedIn()) {
      return true;
    }

    if (this._isLoggingIn() && this._loginPromise) {
      return this._loginPromise;
    }

    const token = localStorage.getItem('chatAuthToken');
    if (!token || token === 'undefined' || token === 'null') {
      return false;
    }

    this._isLoggingIn.set(true);
    this._loginPromise = this.performCometChatLogin(token);

    try {
      const result = await this._loginPromise;
      return result;
    } finally {
      this._isLoggingIn.set(false);
      this._loginPromise = null;
    }
  }

  private async performCometChatLogin(authToken: string): Promise<boolean> {
    try {
      const existingUser = await CometChat.getLoggedinUser();
      if (existingUser) {
        console.log(
          '[CometChat] User already logged in:',
          existingUser.getUid(),
        );
        this._isCometChatLoggedIn.set(true);
        return true;
      }

      const user = await CometChat.login({ authToken });
      console.log('[CometChat] Login successful:', user.getUid());
      this._isCometChatLoggedIn.set(true);
      return true;
    } catch (error) {
      console.error('[CometChat] Login failed:', error);
      this._isCometChatLoggedIn.set(false);
      return false;
    }
  }

  /**
   * Logs out from CometChat completely and resets the login state.
   * Use this when user logs out of the application entirely.
   */
  async logoutFromCometChat(): Promise<void> {
    // Check if actually logged in before attempting logout
    try {
      const loggedInUser = await CometChat.getLoggedinUser();
      if (!loggedInUser) {
        console.log('[CometChat] No user logged in, skipping logout');
        this._isCometChatLoggedIn.set(false);
        return;
      }

      await CometChat.logout();
      console.log('[CometChat] Logout successful (full logout)');
    } catch (error) {
      console.error('[CometChat] Logout failed:', error);
    } finally {
      this._isCometChatLoggedIn.set(false);
    }
  }

  /**
   * Disconnects from CometChat without full logout.
   * This frees up the CCU (Concurrent Connected Users) slot while preserving the session.
   * Use this when user navigates away from chat page but stays in the app.
   *
   * Note: CometChat SDK doesn't have a "disconnect" method separate from logout,
   * so we use logout() here. The user will need to re-authenticate when returning
   * to chat, but since we have the token stored, ensureChatLogin() handles this seamlessly.
   */
  async disconnectFromCometChat(): Promise<void> {
    if (!this._isCometChatLoggedIn()) {
      return;
    }

    try {
      await CometChat.logout();
      console.log('[CometChat] Disconnected successfully');
    } catch (error) {
      console.error('[CometChat] Disconnect failed:', error);
    } finally {
      this._isCometChatLoggedIn.set(false);
    }
  }

  /**
   * Initializes chat listeners after successful CometChat login.
   * Should be called after ensureChatLogin() returns true.
   * @param chatMessageListener - The listener service with an initListener() method
   */
  initializeChatListeners(chatMessageListener: {
    initListener: () => void;
  }): void {
    if (!this._isCometChatLoggedIn()) {
      console.warn('Cannot initialize chat listeners: CometChat not logged in');
      return;
    }

    try {
      chatMessageListener.initListener();
    } catch (error) {
      console.error('Error initializing chat listeners:', error);
    }
  }

  displayChatAuthMessage() {
    this.toasterService.error(
      this.translate('global.wrong_msg.title'),
      this.translate('chats.initiating_chat_error.txt'),
    );
  }

  displayChatUnavailableMessage() {
    this.toasterService.error(
      this.translate('global.wrong_msg.title'),
      this.translate('chats.chat_unavailable.txt'),
    );
  }

  deleteConversation(uid: string, type: ConversationType) {
    this.genericModalSerivce.show(
      () => {
        this.handleChatDelete(uid, type);
      },
      {
        modalTitle: this.translate('chats.delete_chat_msg.txt'),
        modalMessage: '',
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
      },
    );
  }

  private handleChatDelete(uid: string, type: ConversationType) {
    CometChat.deleteConversation(uid, type).then(
      async () => {
        this.toasterService.success(
          this.translate('chats.chat_deleted_successfully.txt'),
        );
        this.triggerDeleteFunctionSource.next();
      },
      (error: CometChat.CometChatException) => {
        this.toasterService.showGlobalWrongMessage(error.message);
      },
    );
  }
  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  chatDraftMessageSent(message: CometChat.BaseMessage) {
    this.setStartChatComponentVisibility(false);
    this.draftMessageSentSource.next(message);
  }

  notifyMessageSelfDeleted(message: CometChat.BaseMessage) {
    this.messageSelfDeletedSource.next(message);
  }

  setStartChatComponentVisibility(isVisible: boolean) {
    this.isShowStartChatComponent.set(isVisible);
  }

  getCometChatUser = (uid: string) => {
    return new Promise<CometChat.User>((resolve, reject) => {
      CometChat.getUser(uid).then(
        (user: CometChat.User) => {
          resolve(user);
        },
        (error: CometChat.CometChatException) => {
          reject(error);
        },
      );
    });
  };

  getCometChatGroup = (guid: string) => {
    return new Promise<CometChat.Group>((resolve, reject) => {
      CometChat.getGroup(guid).then(
        (group: CometChat.Group) => {
          resolve(group);
        },
        (error: CometChat.CometChatException) => {
          reject(error);
        },
      );
    });
  };

  registerUserToCometChat = (user: CometChat.User) => {
    return new Promise<CometChat.User>((resolve, reject) => {
      CometChat.createUser(user, environment.COMET_AUTH_KEY).then(
        (createdUser: CometChat.User) => {
          resolve(createdUser);
        },
        (error: CometChat.CometChatException) => {
          reject(error);
        },
      );
    });
  };

  setSelectedChat(participant: ChatParticipant | undefined) {
    this._selectedChat.set(participant);
  }

  setActiveConversationId(id: string | null) {
    this._activeConversationId.set(id);
  }

  setHasConversations(hasConversations: boolean) {
    this._hasConversations.set(hasConversations);
  }

  clearSelectedChat() {
    this.setSelectedChat(undefined);
    this.setActiveConversationId(null);
  }

  setAvailableGroupsList(groups: ChatGroup[]) {
    this._availableGroupsList.set(groups);
  }

  fetchAvailableGroups(): void {
    const selectedAcademicYearId =
      this.academicYearsScopeService.selectedAcademicYear()?.id;
    this.getGroups(selectedAcademicYearId).subscribe({
      next: (res) => {
        this._availableGroupsList.set(res.data || []);
      },
      error: (err) => {
        console.error('Error fetching available groups:', err);
        this._availableGroupsList.set([]);
      },
    });
  }

  getClassGroup(classId: number): ChatGroup | undefined {
    return this.availableGroupsList().find((group) => group.id === classId);
  }

  /**
   * Fetches total unread count from backend API.
   * This method does NOT require CometChat SDK login, reducing MAU costs.
   *
   * TODO: Implement backend endpoint GET /api/v2/chats/unread-count
   * The backend should use CometChat REST API to fetch unread counts.
   */
  fetchTotalUnreadCount(): void {
    if (!this.hasChatToken()) {
      this._totalUnreadCount.set(0);
      return;
    }

    this.getUnreadCountFromBackend().subscribe({
      next: (count) => {
        this._totalUnreadCount.set(count);
      },
      error: () => {
        this._totalUnreadCount.set(0);
      },
    });
  }

  /**
   * Fetches unread count from CometChat SDK.
   * Only use this when user is already logged into CometChat (on chat page).
   */
  async fetchUnreadCountFromCometChat(): Promise<void> {
    if (!this._isCometChatLoggedIn()) {
      return;
    }

    try {
      const unreadCount = (await CometChat.getUnreadMessageCount()) as any;
      let totalCount = 0;

      if (unreadCount.users) {
        totalCount += Object.values(
          unreadCount.users as { [key: string]: number },
        ).reduce((total, count) => total + count, 0);
      }

      if (unreadCount.groups) {
        totalCount += Object.values(
          unreadCount.groups as { [key: string]: number },
        ).reduce((total, count) => total + count, 0);
      }

      this._totalUnreadCount.set(totalCount);
    } catch (error) {
      console.error('Error fetching unread count from CometChat:', error);
    }
  }

  /**
   * Backend API call for unread count.
   * This endpoint calls CometChat REST API server-side to get unread counts
   * without requiring the user to be logged into CometChat SDK (saves MAU).
   */
  private getUnreadCountFromBackend(): Observable<number> {
    return this.http
      .get<
        IResponse<{ unreadCount: number }>
      >(`${ApiUrl.v2BE}/chats/unread-count`)
      .pipe(
        map((res) => res.data?.unreadCount ?? 0),
        catchError(() => of(0)),
      );
  }

  setTotalUnreadCount(count: number): void {
    this._totalUnreadCount.set(Math.max(0, count));
  }

  updateTotalUnreadCount(delta: number): void {
    const currentCount = this._totalUnreadCount();
    this.setTotalUnreadCount(currentCount + delta);
  }

  refreshUnreadCount(): void {
    if (this._isCometChatLoggedIn()) {
      this.fetchUnreadCountFromCometChat();
    } else {
      this.fetchTotalUnreadCount();
    }
  }

  getChatMetaData(
    chatIds: string,
  ): Observable<(ChatGroupMetadata | ChatUserMetadata)[]> {
    const filteredChatIds = chatIds
      .split(',')
      .filter((id) => id !== 'app_system')
      .join(',');
    return this.http
      .get<
        IResponse<{
          chatsMetadata: (ChatGroupMetadataDTO | ChatUserMetadataDTO)[];
        }>
      >(`${ApiUrl.v2BE}/chats/metadata?chatIds=${filteredChatIds}`)
      .pipe(
        map(
          (
            response: IResponse<{
              chatsMetadata: (ChatGroupMetadataDTO | ChatUserMetadataDTO)[];
            }>,
          ) =>
            response.data.chatsMetadata.map((metadataDTO) =>
              CHAT_MAP_FROM_DTO.metadata(metadataDTO),
            ),
        ),
      );
  }

  getStudentsList(
    params: ChatStudentsParams,
  ): Observable<IPaginatedResponse<ChatStudent[]>> {
    return this.http
      .get<
        IPaginatedResponse<ChatStudentDTO[]>
      >(`${ApiUrl.v2BE}/chats/students`, { params })
      .pipe(
        map((response: IPaginatedResponse<ChatStudentDTO[]>) => ({
          ...response,
          data: response.data.map((studentDTO: ChatStudentDTO) =>
            CHAT_MAP_FROM_DTO.student(studentDTO),
          ),
        })),
      );
  }

  getPersonnelsList(params: {
    studentId?: string;
  }): Observable<IResponse<ChatPersonnel[]>> {
    return this.http
      .get<
        IResponse<ChatPersonnelDTO[]>
      >(`${ApiUrl.v2BE}/chats/personnels`, { params })
      .pipe(
        map((response: IResponse<ChatPersonnelDTO[]>) => ({
          ...response,
          data: response.data.map((teacherDTO: ChatPersonnelDTO) =>
            CHAT_MAP_FROM_DTO.teacher(teacherDTO),
          ),
        })),
      );
  }

  getGroups(academicYearId?: number): Observable<IResponse<ChatGroup[]>> {
    const params: { academicYearId?: string } = {};
    if (academicYearId) {
      params.academicYearId = academicYearId.toString();
    }
    return this.http
      .get<IResponse<ChatGroupDTO[]>>(`${ApiUrl.v2BE}/chats/groups`, { params })
      .pipe(
        map((response: IResponse<ChatGroupDTO[]>) => ({
          ...response,
          data: response.data.map((groupDTO: ChatGroupDTO) =>
            CHAT_MAP_FROM_DTO.group(groupDTO),
          ),
        })),
      );
  }

  postGroup(payload: {
    target: string;
    targetId: number;
    academicYearId: number;
  }): Observable<IResponse<any>> {
    return this.http.post<IResponse<any>>(`${ApiUrl.v2BE}/chats`, payload);
  }

  /**
   * Open a specific chat by chatId and conversationType (for deep linking)
   * This method handles fetching the CometChat conversation and metadata, then opens the chat
   */
  async openChatFromDeepLink(params: {
    chatId: string;
    conversationType: ConversationType;
  }): Promise<void> {
    try {
      const { chatId, conversationType } = params;

      // Convert conversationType to CometChat type
      const cometChatType =
        conversationType === ConversationType.USER
          ? CometChat.RECEIVER_TYPE.USER
          : CometChat.RECEIVER_TYPE.GROUP;

      // Get the CometChat conversation object
      const conversation = await CometChat.getConversation(
        chatId,
        cometChatType,
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const withObj = conversation.getConversationWith();
      if (!withObj) {
        throw new Error('Conversation participant not found');
      }

      // Fetch metadata from backend
      const metadataList = await this.getChatMetaData(chatId).toPromise();
      let metadata =
        metadataList && metadataList.length > 0 ? metadataList[0] : undefined;

      // For group chats, extract profileColor from CometChat's group metadata
      if (conversationType === ConversationType.GROUP && withObj) {
        const cometChatMetadata = (withObj as any).getMetadata?.() || {};

        // Merge CometChat metadata (which has profileColor) with our backend metadata
        if (metadata && cometChatMetadata.profileColor) {
          metadata = {
            ...metadata,
            profileColor: cometChatMetadata.profileColor,
          } as ChatGroupMetadata;
        }
      }

      // Attach metadata to the conversation object
      if (metadata && withObj) {
        (withObj as any).setMetadata?.(metadata);
      }

      // Determine display name
      const displayName =
        metadata?.displayName ||
        (withObj as any).getName?.() ||
        (withObj as any).name ||
        '';

      // Set the selected chat
      this.setSelectedChat({
        id: chatId,
        displayName: displayName,
        type:
          conversationType === ConversationType.USER
            ? ConversationType.USER
            : ConversationType.GROUP,
        classId:
          conversationType === ConversationType.GROUP &&
          metadata &&
          'id' in metadata
            ? (metadata as ChatGroupMetadata).id
              ? Number((metadata as ChatGroupMetadata).id)
              : undefined
            : undefined,
        metadata: metadata,
      });

      // Set the active conversation ID
      this.setActiveConversationId(conversation.getConversationId());
    } catch (error) {
      throw error;
    }
  }
}
