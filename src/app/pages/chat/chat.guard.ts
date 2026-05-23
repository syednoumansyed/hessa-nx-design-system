import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  CanDeactivateFn,
  RouterStateSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { ChatMessageListenerService } from '@pages/chat/chat-message-listener.service';

/**
 * Guard that handles CometChat login when entering the chat page.
 * - If no chat token exists (e.g., dev quota exceeded), blocks access with a message
 * - If token exists, performs lazy login to CometChat (this is where MAU is counted)
 * - Initializes chat listeners after successful login
 */
export const chatGuard = (): CanActivateFn => {
  return async (
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ) => {
    const chatService = inject(ChatService);
    const chatMessageListener = inject(ChatMessageListenerService);

    // If no chat token, block access and show message
    // This handles cases where dev quota is exceeded or token wasn't generated
    if (!chatService.hasChatToken()) {
      chatService.displayChatUnavailableMessage();
      return false;
    }

    // Attempt lazy login to CometChat
    const isLoggedIn = await chatService.ensureChatLogin();
    if (!isLoggedIn) {
      chatService.displayChatAuthMessage();
      return false;
    }

    // Initialize chat listeners after successful login
    chatService.initializeChatListeners(chatMessageListener);

    return true;
  };
};

/**
 * Guard that handles CometChat logout when leaving the chat page.
 * This is critical for managing CCU (Concurrent Connected Users) billing.
 * Disconnects from CometChat when user navigates away from chat.
 */
export const chatDeactivateGuard = (): CanDeactivateFn<unknown> => {
  return async () => {
    const chatService = inject(ChatService);
    const chatMessageListener = inject(ChatMessageListenerService);

    // Only disconnect if we were actually connected
    if (chatService.isCometChatLoggedIn()) {
      // Destroy message listeners first
      chatMessageListener.destroyListener();

      // Disconnect from CometChat to free up CCU slot
      await chatService.disconnectFromCometChat();
    }

    return true;
  };
};
