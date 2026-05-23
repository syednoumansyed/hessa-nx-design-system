import {
  Component,
  inject,
  OnInit,
  effect,
  OnDestroy,
  Injector,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { ConversationType } from '@shared/enums';
import { ChatConversationsComponent } from './components/chat-conversations/chat-conversations.component';
import { isMobile } from '@shared/utils/platform';
import { ChatMessagesComponent } from './components/chat-messages/chat-messages.component';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { ChatService } from './data-access/chat.service';
import { LayoutService } from '@layout/layout.service';
import { AuthService } from '@auth/auth.service';
import { ActivatedRoute } from '@angular/router';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { skip, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chat-module',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    ChatConversationsComponent,
    IonContent,
    ChatMessagesComponent,
    NoDataCardComponent,
  ],
})
export class ChatComponent implements OnInit, OnDestroy {
  private readonly chatService = inject(ChatService);
  private readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );

  isMobile = isMobile();
  conversationType = ConversationType;
  selectedChat = this.chatService.selectedChat;
  hasConversations = this.chatService.hasConversations;

  private stopEffect?: { destroy: () => void };
  private destroy$ = new Subject<void>();

  constructor() {
    effect(
      () => {
        const selectedChat = this.selectedChat();
        if (this.isMobile) {
          this.layoutService.updateBottomBarVisibility(!selectedChat);
          this.layoutService.updateHeaderVisibility(!selectedChat);
        }
      },
      { injector: this.injector },
    );

    // Listen to academic year changes and re-fetch available groups
    toObservable(this.academicYearsScopeService.selectedAcademicYear)
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.authService.isUserPersonnel()) {
          this.chatService.fetchAvailableGroups();
        }
      });
  }

  ngOnInit() {
    if (this.authService.isUserPersonnel()) {
      this.chatService.fetchAvailableGroups();
    }

    // Handle deep link params from query string
    this.route.queryParams.subscribe((params) => {
      if (params['chatId'] && params['conversationType']) {
        this.handleDeepLink({
          chatId: params['chatId'],
          conversationType: params['conversationType'] as ConversationType,
        });
      }
    });
  }

  ngOnDestroy() {
    this.stopEffect?.destroy?.();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter() {
    this.layoutService.updateChildSelectorVisibility(false);
    if (this.isMobile) {
      const selectedChat = this.selectedChat();
      this.layoutService.updateBottomBarVisibility(!selectedChat);
      this.layoutService.updateHeaderVisibility(!selectedChat);
    }
  }

  ionViewWillLeave() {
    if (this.isMobile) {
      this.layoutService.updateBottomBarVisibility(true);
      this.layoutService.updateHeaderVisibility(true);
    }
  }

  /**
   * Handle deep linking to open a specific chat
   */
  private async handleDeepLink(params: {
    chatId: string;
    conversationType: ConversationType;
  }) {
    try {
      await this.chatService.openChatFromDeepLink(params);
    } catch (error) {
      console.error('Failed to open chat from deep link:', error);
    }
  }
}
