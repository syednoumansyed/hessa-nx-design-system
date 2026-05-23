import { Component, computed, inject, input, OnInit } from '@angular/core';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { Router, RouterLink } from '@angular/router';
import { IonRouterLink } from '@ionic/angular/standalone';
import { NgClass } from '@angular/common';
import { AnimatedIconComponent } from '../animated-icon/animated-icon.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { LayoutService } from '@layout/layout.service';
import { ChatService } from '@pages/chat/data-access/chat.service';

@Component({
  selector: 'ds-bottom-nav-bar',
  templateUrl: './bottom-nav-bar.component.html',
  styleUrls: ['./bottom-nav-bar.component.scss'],
  imports: [
    RouterLink,
    IonRouterLink,
    NgClass,
    AnimatedIconComponent,
    TranslocoDirective,
  ],
})
export class BottomNavBarComponent implements OnInit {
  // Services
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);
  private readonly chatService = inject(ChatService);

  // Inputs
  mobileMenuItems = input<IMenuRoutes[]>();
  unreadChatCount = computed(() => {
    return this.chatService.totalUnreadCount();
  });

  // Store play functions for each menu item
  private animationPlayFunctions = new Map<string, () => void>();

  constructor() {}

  ngOnInit() {}

  /**
   * Save play function with item path context
   */
  savePlayFunctionForItem(playFunction: () => void, item: IMenuRoutes): void {
    this.animationPlayFunctions.set(item.path, playFunction);
  }

  /**
   * Check if device is mobile or tablet
   */
  isMobileOrTablet(): boolean {
    return this.layoutService.isMobileOrTablet();
  }

  /**
   * Check if a route is currently active
   */
  isActive(item: string): boolean {
    if (!item) return false;

    // Normalize path
    if (!item.startsWith('/')) {
      item = `/${item}`;
    }

    // For mobile/tablet, use exact match for home route
    if (this.isMobileOrTablet()) {
      if (item === '/home' || item === '/') {
        return this.router.url === '/' || this.router.url === '/home';
      }
    }

    return this.router.url.startsWith(item);
  }

  /**
   * Handle bottom navigation item clicks
   * Triggers animation and navigation
   */
  onBottomNavClick(path: string, event: Event): void {
    // Add click animation class
    const target = event.currentTarget as HTMLElement;
    target.classList.add('bottom-nav-click-animation');

    // Remove animation class after animation completes
    setTimeout(() => {
      target.classList.remove('bottom-nav-click-animation');
    }, 150);

    // Play Lottie animation for clicked item
    this.playBottomNavAnimation(path);
  }

  /**
   * Play animation for specific bottom navigation item
   */
  private playBottomNavAnimation(path: string): void {
    const playFunction = this.animationPlayFunctions.get(path);
    if (playFunction) {
      playFunction();
    }
  }
}
